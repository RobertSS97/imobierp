import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { authenticateRequest, unauthorizedResponse } from "@/lib/auth";
import {
  successResponse,
  errorResponse,
  createHistoryLog,
  sanitizeUpdateData,
} from "@/lib/api-helpers";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// ─── GET /api/owners/[id] ─────────────────────────────────────────
export async function GET(req: NextRequest, { params }: RouteParams) {
  const auth = await authenticateRequest(req);
  if (!auth) return unauthorizedResponse();

  try {
    const { id } = await params;
    const owner = await db.owner.findFirst({
      where: { id, userId: auth.userId },
      include: {
        properties: {
          select: {
            id: true,
            title: true,
            type: true,
            status: true,
            rentValue: true,
            city: true,
            state: true,
          },
        },
        contracts: {
          select: {
            id: true,
            status: true,
            startDate: true,
            endDate: true,
            rentValue: true,
            property: { select: { id: true, title: true } },
            tenant: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        _count: {
          select: { properties: true, contracts: true },
        },
      },
    });

    if (!owner) {
      return errorResponse("Proprietário não encontrado", 404);
    }

    return successResponse(owner);
  } catch (error: any) {
    console.error("Get owner error:", error);
    return errorResponse("Erro interno do servidor", 500);
  }
}

// ─── PUT /api/owners/[id] ─────────────────────────────────────────
export async function PUT(req: NextRequest, { params }: RouteParams) {
  const auth = await authenticateRequest(req);
  if (!auth) return unauthorizedResponse();

  try {
    const { id } = await params;
    const body = await req.json();

    // Verificar se pertence ao usuário
    const existing = await db.owner.findFirst({
      where: { id, userId: auth.userId },
    });

    if (!existing) {
      return errorResponse("Proprietário não encontrado", 404);
    }

    // Verificar CPF/CNPJ duplicado se mudou
    if (body.cpfCnpj && body.cpfCnpj !== existing.cpfCnpj) {
      const duplicate = await db.owner.findFirst({
        where: { userId: auth.userId, cpfCnpj: body.cpfCnpj, id: { not: id } },
      });
      if (duplicate) {
        return errorResponse("Já existe um proprietário com este CPF/CNPJ", 409);
      }
    }

    const allowedFields = [
      "name", "email", "phone", "whatsapp", "cpfCnpj", "rg",
      "street", "number", "complement", "neighborhood", "city", "state", "zipCode",
      "bankName", "bankAgency", "bankAccount", "bankAccountType", "pixKey",
      "status", "notes",
    ];

    const rawData: Record<string, any> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        rawData[field] = body[field];
      }
    }

    const updateData = sanitizeUpdateData(
      rawData,
      ["bankAccountType", "status"],
    );

    const owner = await db.owner.update({
      where: { id },
      data: updateData,
    });

    await createHistoryLog(
      db,
      auth.userId,
      "OWNER",
      owner.id,
      "UPDATE",
      `Proprietário "${owner.name}" atualizado`,
      existing as any,
      owner as any
    );

    return successResponse(owner);
  } catch (error: any) {
    console.error("Update owner error:", error);
    return errorResponse("Erro interno do servidor", 500);
  }
}

// ─── DELETE /api/owners/[id] ──────────────────────────────────────
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const auth = await authenticateRequest(req);
  if (!auth) return unauthorizedResponse();

  try {
    const { id } = await params;
    const existing = await db.owner.findFirst({
      where: { id, userId: auth.userId },
      include: { _count: { select: { properties: true, contracts: true } } },
    });

    if (!existing) {
      return errorResponse("Proprietário não encontrado", 404);
    }

    // Verificar se tem contratos ativos
    const activeContracts = await db.contract.count({
      where: { ownerId: id, status: "ACTIVE" },
    });

    if (activeContracts > 0) {
      return errorResponse(
        "Não é possível excluir proprietário com contratos ativos",
        409
      );
    }

    await db.owner.delete({ where: { id } });

    await createHistoryLog(
      db,
      auth.userId,
      "OWNER",
      id,
      "DELETE",
      `Proprietário "${existing.name}" removido`
    );

    return successResponse({ message: "Proprietário removido com sucesso" });
  } catch (error: any) {
    console.error("Delete owner error:", error);
    return errorResponse("Erro interno do servidor", 500);
  }
}
