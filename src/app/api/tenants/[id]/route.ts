import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { authenticateRequest, unauthorizedResponse } from "@/lib/auth";
import {
  successResponse,
  errorResponse,
  createHistoryLog,
} from "@/lib/api-helpers";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// ─── GET /api/tenants/[id] ────────────────────────────────────────
export async function GET(req: NextRequest, { params }: RouteParams) {
  const auth = await authenticateRequest(req);
  if (!auth) return unauthorizedResponse();

  try {
    const { id } = await params;
    const tenant = await db.tenant.findFirst({
      where: { id, userId: auth.userId },
      include: {
        contracts: {
          select: {
            id: true,
            status: true,
            startDate: true,
            endDate: true,
            rentValue: true,
            property: { select: { id: true, title: true, street: true, city: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        charges: {
          select: {
            id: true,
            type: true,
            value: true,
            dueDate: true,
            status: true,
            paymentDate: true,
            whatsappSent: true,
          },
          orderBy: { dueDate: "desc" },
          take: 20,
        },
        documents: {
          select: {
            id: true,
            name: true,
            type: true,
            url: true,
            size: true,
            mimeType: true,
            uploadedAt: true,
          },
        },
        _count: {
          select: { contracts: true, charges: true, documents: true },
        },
      },
    });

    if (!tenant) {
      return errorResponse("Inquilino não encontrado", 404);
    }

    return successResponse(tenant);
  } catch (error: any) {
    console.error("Get tenant error:", error);
    return errorResponse("Erro interno do servidor", 500);
  }
}

// ─── PUT /api/tenants/[id] ────────────────────────────────────────
export async function PUT(req: NextRequest, { params }: RouteParams) {
  const auth = await authenticateRequest(req);
  if (!auth) return unauthorizedResponse();

  try {
    const { id } = await params;
    const body = await req.json();

    const existing = await db.tenant.findFirst({
      where: { id, userId: auth.userId },
    });

    if (!existing) {
      return errorResponse("Inquilino não encontrado", 404);
    }

    // Verificar CPF duplicado se mudou
    if (body.cpf && body.cpf !== existing.cpf) {
      const duplicate = await db.tenant.findFirst({
        where: { userId: auth.userId, cpf: body.cpf, id: { not: id } },
      });
      if (duplicate) {
        return errorResponse("Já existe um inquilino com este CPF", 409);
      }
    }

    const allowedFields = [
      "name", "email", "phone", "whatsapp", "cpf", "rg",
      "dateOfBirth", "maritalStatus", "profession", "income",
      "street", "number", "complement", "neighborhood", "city", "state", "zipCode",
      "emergencyName", "emergencyPhone", "emergencyRelationship",
      "status", "notes",
    ];

    const updateData: Record<string, any> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // Converter tipos
    if (updateData.dateOfBirth) updateData.dateOfBirth = new Date(updateData.dateOfBirth);
    if (updateData.income) updateData.income = parseFloat(updateData.income);

    const tenant = await db.tenant.update({
      where: { id },
      data: updateData,
    });

    const action = body.status && body.status !== existing.status ? "STATUS_CHANGE" : "UPDATE";
    await createHistoryLog(
      db,
      auth.userId,
      "TENANT",
      tenant.id,
      action,
      `Inquilino "${tenant.name}" atualizado`,
      existing as any,
      tenant as any
    );

    return successResponse(tenant);
  } catch (error: any) {
    console.error("Update tenant error:", error);
    return errorResponse("Erro interno do servidor", 500);
  }
}

// ─── DELETE /api/tenants/[id] ─────────────────────────────────────
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const auth = await authenticateRequest(req);
  if (!auth) return unauthorizedResponse();

  try {
    const { id } = await params;
    const existing = await db.tenant.findFirst({
      where: { id, userId: auth.userId },
    });

    if (!existing) {
      return errorResponse("Inquilino não encontrado", 404);
    }

    const activeContracts = await db.contract.count({
      where: { tenantId: id, status: "ACTIVE" },
    });

    if (activeContracts > 0) {
      return errorResponse(
        "Não é possível excluir inquilino com contratos ativos",
        409
      );
    }

    await db.tenant.delete({ where: { id } });

    await createHistoryLog(
      db,
      auth.userId,
      "TENANT",
      id,
      "DELETE",
      `Inquilino "${existing.name}" removido`
    );

    return successResponse({ message: "Inquilino removido com sucesso" });
  } catch (error: any) {
    console.error("Delete tenant error:", error);
    return errorResponse("Erro interno do servidor", 500);
  }
}
