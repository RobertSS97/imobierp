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

// ─── GET /api/charges/[id] ────────────────────────────────────────
export async function GET(req: NextRequest, { params }: RouteParams) {
  const auth = await authenticateRequest(req);
  if (!auth) return unauthorizedResponse();

  try {
    const { id } = await params;
    const charge = await db.charge.findFirst({
      where: { id, userId: auth.userId },
      include: {
        tenant: {
          select: {
            id: true, name: true, email: true, phone: true, whatsapp: true, cpf: true,
          },
        },
        property: {
          select: {
            id: true, title: true, street: true, number: true,
            neighborhood: true, city: true, state: true,
          },
        },
        contract: {
          select: { id: true, status: true, startDate: true, endDate: true, paymentDay: true },
        },
      },
    });

    if (!charge) {
      return errorResponse("Cobrança não encontrada", 404);
    }

    // Calcular valor com multa e juros se vencida
    let totalValue = charge.value;
    if (charge.status === "OVERDUE" || (charge.status === "PENDING" && new Date(charge.dueDate) < new Date())) {
      const user = await db.user.findUnique({
        where: { id: auth.userId },
        select: { lateFeePercentage: true, interestPercentage: true },
      });

      if (user) {
        const daysLate = Math.floor(
          (new Date().getTime() - new Date(charge.dueDate).getTime()) / (1000 * 60 * 60 * 24)
        );
        const penalty = charge.value * (user.lateFeePercentage / 100);
        const interest = charge.value * (user.interestPercentage / 100) * (daysLate / 30);
        totalValue = charge.value + penalty + interest - (charge.discountValue || 0);
      }
    }

    return successResponse({
      ...charge,
      calculatedTotal: totalValue,
    });
  } catch (error: any) {
    console.error("Get charge error:", error);
    return errorResponse("Erro interno do servidor", 500);
  }
}

// ─── PUT /api/charges/[id] ────────────────────────────────────────
export async function PUT(req: NextRequest, { params }: RouteParams) {
  const auth = await authenticateRequest(req);
  if (!auth) return unauthorizedResponse();

  try {
    const { id } = await params;
    const body = await req.json();

    const existing = await db.charge.findFirst({
      where: { id, userId: auth.userId },
    });

    if (!existing) {
      return errorResponse("Cobrança não encontrada", 404);
    }

    const allowedFields = [
      "type", "description", "value", "dueDate", "status",
      "paymentMethod", "paymentDate", "penaltyValue", "interestValue",
      "discountValue", "notes",
    ];

    const updateData: Record<string, any> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // Converter tipos
    if (updateData.value) updateData.value = parseFloat(updateData.value);
    if (updateData.dueDate) updateData.dueDate = new Date(updateData.dueDate);
    if (updateData.paymentDate) updateData.paymentDate = new Date(updateData.paymentDate);
    if (updateData.penaltyValue) updateData.penaltyValue = parseFloat(updateData.penaltyValue);
    if (updateData.interestValue) updateData.interestValue = parseFloat(updateData.interestValue);
    if (updateData.discountValue) updateData.discountValue = parseFloat(updateData.discountValue);

    // Se marcou como pago, registrar data de pagamento
    if (updateData.status === "PAID" && !updateData.paymentDate) {
      updateData.paymentDate = new Date();
    }

    const charge = await db.charge.update({
      where: { id },
      data: updateData,
      include: {
        tenant: { select: { id: true, name: true } },
        property: { select: { id: true, title: true } },
      },
    });

    const action = body.status && body.status !== existing.status ? "STATUS_CHANGE" : "UPDATE";
    await createHistoryLog(
      db,
      auth.userId,
      "CHARGE",
      charge.id,
      action,
      `Cobrança "${charge.description}" atualizada - Status: ${charge.status}`,
      existing as any,
      charge as any
    );

    return successResponse(charge);
  } catch (error: any) {
    console.error("Update charge error:", error);
    return errorResponse("Erro interno do servidor", 500);
  }
}

// ─── DELETE /api/charges/[id] ─────────────────────────────────────
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const auth = await authenticateRequest(req);
  if (!auth) return unauthorizedResponse();

  try {
    const { id } = await params;
    const existing = await db.charge.findFirst({
      where: { id, userId: auth.userId },
    });

    if (!existing) {
      return errorResponse("Cobrança não encontrada", 404);
    }

    if (existing.status === "PAID") {
      return errorResponse("Não é possível excluir cobrança já paga", 409);
    }

    await db.charge.delete({ where: { id } });

    await createHistoryLog(
      db,
      auth.userId,
      "CHARGE",
      id,
      "DELETE",
      `Cobrança "${existing.description}" removida`
    );

    return successResponse({ message: "Cobrança removida com sucesso" });
  } catch (error: any) {
    console.error("Delete charge error:", error);
    return errorResponse("Erro interno do servidor", 500);
  }
}
