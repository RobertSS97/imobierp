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

// ─── GET /api/contracts/[id] ──────────────────────────────────────
export async function GET(req: NextRequest, { params }: RouteParams) {
  const auth = await authenticateRequest(req);
  if (!auth) return unauthorizedResponse();

  try {
    const { id } = await params;
    const contract = await db.contract.findFirst({
      where: { id, userId: auth.userId },
      include: {
        property: {
          select: {
            id: true, title: true, type: true, street: true, number: true,
            complement: true, neighborhood: true, city: true, state: true, zipCode: true,
            bedrooms: true, bathrooms: true, area: true,
          },
        },
        tenant: {
          select: {
            id: true, name: true, email: true, phone: true, whatsapp: true, cpf: true,
          },
        },
        owner: {
          select: {
            id: true, name: true, email: true, phone: true, cpfCnpj: true,
            bankName: true, bankAgency: true, bankAccount: true, pixKey: true,
          },
        },
        clauses: { orderBy: { order: "asc" } },
        charges: {
          orderBy: { dueDate: "asc" },
          select: {
            id: true, type: true, description: true, value: true, dueDate: true,
            paymentDate: true, status: true, paymentMethod: true,
            penaltyValue: true, interestValue: true, discountValue: true,
            whatsappSent: true, whatsappSentAt: true,
          },
        },
        documents: {
          select: {
            id: true, name: true, type: true, url: true, size: true, uploadedAt: true,
          },
        },
        _count: {
          select: { charges: true, clauses: true, documents: true },
        },
      },
    });

    if (!contract) {
      return errorResponse("Contrato não encontrado", 404);
    }

    // Calcular totais
    const chargesSummary = {
      totalCharges: contract.charges.length,
      totalValue: contract.charges.reduce((sum, c) => sum + c.value, 0),
      paidValue: contract.charges.filter(c => c.status === "PAID").reduce((sum, c) => sum + c.value, 0),
      pendingValue: contract.charges.filter(c => c.status === "PENDING").reduce((sum, c) => sum + c.value, 0),
      overdueValue: contract.charges.filter(c => c.status === "OVERDUE").reduce((sum, c) => sum + c.value, 0),
      overdueCount: contract.charges.filter(c => c.status === "OVERDUE").length,
    };

    return successResponse({ ...contract, chargesSummary });
  } catch (error: any) {
    console.error("Get contract error:", error);
    return errorResponse("Erro interno do servidor", 500);
  }
}

// ─── PUT /api/contracts/[id] ──────────────────────────────────────
export async function PUT(req: NextRequest, { params }: RouteParams) {
  const auth = await authenticateRequest(req);
  if (!auth) return unauthorizedResponse();

  try {
    const { id } = await params;
    const body = await req.json();

    const existing = await db.contract.findFirst({
      where: { id, userId: auth.userId },
    });

    if (!existing) {
      return errorResponse("Contrato não encontrado", 404);
    }

    const allowedFields = [
      "startDate", "endDate", "rentValue", "condoFee", "iptu",
      "depositValue", "depositType", "paymentDay",
      "readjustmentIndex", "readjustmentMonth", "status",
    ];

    const rawData: Record<string, any> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        rawData[field] = body[field];
      }
    }

    const updateData = sanitizeUpdateData(
      rawData,
      ["depositType", "readjustmentIndex", "status"],
      ["startDate", "endDate"],
    );

    const contract = await db.contract.update({
      where: { id },
      data: updateData,
      include: {
        property: { select: { id: true, title: true } },
        tenant: { select: { id: true, name: true } },
        owner: { select: { id: true, name: true } },
      },
    });

    // Se status mudou para cancelado/expirado, liberar imóvel
    if (body.status && body.status !== existing.status) {
      if (body.status === "CANCELLED" || body.status === "EXPIRED") {
        await db.property.update({
          where: { id: existing.propertyId },
          data: { status: "AVAILABLE" },
        });

        // Cancelar cobranças pendentes
        if (body.status === "CANCELLED") {
          await db.charge.updateMany({
            where: { contractId: id, status: "PENDING" },
            data: { status: "CANCELLED" },
          });
        }
      }

      // Se ativou, marcar imóvel como alugado
      if (body.status === "ACTIVE" && existing.status !== "ACTIVE") {
        await db.property.update({
          where: { id: existing.propertyId },
          data: { status: "RENTED" },
        });
      }
    }

    // Atualizar cláusulas se fornecidas
    if (body.clauses) {
      // Deletar cláusulas existentes e recriar
      await db.contractClause.deleteMany({ where: { contractId: id } });
      if (body.clauses.length > 0) {
        await db.contractClause.createMany({
          data: body.clauses.map((c: any, idx: number) => ({
            contractId: id,
            title: c.title,
            content: c.content,
            order: c.order ?? idx,
          })),
        });
      }
    }

    const action = body.status && body.status !== existing.status ? "STATUS_CHANGE" : "UPDATE";
    await createHistoryLog(
      db,
      auth.userId,
      "CONTRACT",
      contract.id,
      action,
      `Contrato atualizado: ${contract.property.title} → ${contract.tenant.name}`,
      existing as any,
      contract as any
    );

    return successResponse(contract);
  } catch (error: any) {
    console.error("Update contract error:", error);
    return errorResponse("Erro interno do servidor", 500);
  }
}

// ─── DELETE /api/contracts/[id] ───────────────────────────────────
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const auth = await authenticateRequest(req);
  if (!auth) return unauthorizedResponse();

  try {
    const { id } = await params;
    const existing = await db.contract.findFirst({
      where: { id, userId: auth.userId },
      include: {
        property: { select: { title: true } },
        tenant: { select: { name: true } },
      },
    });

    if (!existing) {
      return errorResponse("Contrato não encontrado", 404);
    }

    if (existing.status === "ACTIVE") {
      return errorResponse(
        "Não é possível excluir contrato ativo. Cancele-o primeiro.",
        409
      );
    }

    // Deletar cobranças, cláusulas e documentos associados
    await Promise.all([
      db.charge.deleteMany({ where: { contractId: id } }),
      db.contractClause.deleteMany({ where: { contractId: id } }),
      db.document.deleteMany({ where: { contractId: id } }),
    ]);

    await db.contract.delete({ where: { id } });

    await createHistoryLog(
      db,
      auth.userId,
      "CONTRACT",
      id,
      "DELETE",
      `Contrato removido: ${existing.property.title} → ${existing.tenant.name}`
    );

    return successResponse({ message: "Contrato removido com sucesso" });
  } catch (error: any) {
    console.error("Delete contract error:", error);
    return errorResponse("Erro interno do servidor", 500);
  }
}
