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

// ─── GET /api/properties/[id] ─────────────────────────────────────
export async function GET(req: NextRequest, { params }: RouteParams) {
  const auth = await authenticateRequest(req);
  if (!auth) return unauthorizedResponse();

  try {
    const { id } = await params;
    const property = await db.property.findFirst({
      where: { id, userId: auth.userId },
      include: {
        owner: {
          select: { id: true, name: true, email: true, phone: true },
        },
        contracts: {
          select: {
            id: true,
            status: true,
            startDate: true,
            endDate: true,
            rentValue: true,
            tenant: { select: { id: true, name: true, phone: true } },
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
          },
          orderBy: { dueDate: "desc" },
          take: 20,
        },
        _count: {
          select: { contracts: true, charges: true },
        },
      },
    });

    if (!property) {
      return errorResponse("Imóvel não encontrado", 404);
    }

    return successResponse(property);
  } catch (error: any) {
    console.error("Get property error:", error);
    return errorResponse("Erro interno do servidor", 500);
  }
}

// ─── PUT /api/properties/[id] ─────────────────────────────────────
export async function PUT(req: NextRequest, { params }: RouteParams) {
  const auth = await authenticateRequest(req);
  if (!auth) return unauthorizedResponse();

  try {
    const { id } = await params;
    const body = await req.json();

    const existing = await db.property.findFirst({
      where: { id, userId: auth.userId },
    });

    if (!existing) {
      return errorResponse("Imóvel não encontrado", 404);
    }

    // Se mudou o proprietário, verificar se o novo pertence ao user
    if (body.ownerId && body.ownerId !== existing.ownerId) {
      const owner = await db.owner.findFirst({
        where: { id: body.ownerId, userId: auth.userId },
      });
      if (!owner) {
        return errorResponse("Proprietário não encontrado", 404);
      }
    }

    const allowedFields = [
      "title", "type", "status", "ownerId",
      "street", "number", "complement", "neighborhood", "city", "state", "zipCode",
      "bedrooms", "bathrooms", "parkingSpaces", "area",
      "rentValue", "condoFee", "iptu",
      "description", "amenities", "images",
    ];

    const updateData: Record<string, any> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    const property = await db.property.update({
      where: { id },
      data: updateData,
      include: {
        owner: { select: { id: true, name: true } },
      },
    });

    // Se mudou status, registrar
    const action = body.status && body.status !== existing.status ? "STATUS_CHANGE" : "UPDATE";
    await createHistoryLog(
      db,
      auth.userId,
      "PROPERTY",
      property.id,
      action,
      `Imóvel "${property.title}" atualizado`,
      existing as any,
      property as any
    );

    return successResponse(property);
  } catch (error: any) {
    console.error("Update property error:", error);
    return errorResponse("Erro interno do servidor", 500);
  }
}

// ─── DELETE /api/properties/[id] ──────────────────────────────────
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const auth = await authenticateRequest(req);
  if (!auth) return unauthorizedResponse();

  try {
    const { id } = await params;
    const existing = await db.property.findFirst({
      where: { id, userId: auth.userId },
    });

    if (!existing) {
      return errorResponse("Imóvel não encontrado", 404);
    }

    // Verificar contratos ativos
    const activeContracts = await db.contract.count({
      where: { propertyId: id, status: "ACTIVE" },
    });

    if (activeContracts > 0) {
      return errorResponse(
        "Não é possível excluir imóvel com contratos ativos",
        409
      );
    }

    await db.property.delete({ where: { id } });

    await createHistoryLog(
      db,
      auth.userId,
      "PROPERTY",
      id,
      "DELETE",
      `Imóvel "${existing.title}" removido`
    );

    return successResponse({ message: "Imóvel removido com sucesso" });
  } catch (error: any) {
    console.error("Delete property error:", error);
    return errorResponse("Erro interno do servidor", 500);
  }
}
