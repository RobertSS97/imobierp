import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { authenticateRequest, unauthorizedResponse } from "@/lib/auth";
import { successResponse, errorResponse, createHistoryLog } from "@/lib/api-helpers";

// ─── POST /api/charges/bulk-pay ───────────────────────────────────
// Marcar múltiplas cobranças como pagas
export async function POST(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (!auth) return unauthorizedResponse();

  try {
    const body = await req.json();
    const { chargeIds, paymentMethod, paymentDate } = body;

    if (!chargeIds || !Array.isArray(chargeIds) || chargeIds.length === 0) {
      return errorResponse("IDs das cobranças são obrigatórios", 400);
    }

    // Verificar se todas as cobranças pertencem ao usuário
    const charges = await db.charge.findMany({
      where: { id: { in: chargeIds }, userId: auth.userId },
    });

    if (charges.length !== chargeIds.length) {
      return errorResponse("Uma ou mais cobranças não foram encontradas", 404);
    }

    const alreadyPaid = charges.filter((c) => c.status === "PAID");
    if (alreadyPaid.length > 0) {
      return errorResponse(
        `${alreadyPaid.length} cobrança(s) já estão marcadas como pagas`,
        409
      );
    }

    // Atualizar em massa
    const result = await db.charge.updateMany({
      where: { id: { in: chargeIds }, userId: auth.userId },
      data: {
        status: "PAID",
        paymentMethod: paymentMethod || "PIX",
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
      },
    });

    // Registrar histórico para cada cobrança
    for (const charge of charges) {
      await createHistoryLog(
        db,
        auth.userId,
        "CHARGE",
        charge.id,
        "STATUS_CHANGE",
        `Cobrança "${charge.description}" marcada como paga (pagamento em lote)`
      );
    }

    return successResponse({
      message: `${result.count} cobrança(s) marcadas como pagas`,
      count: result.count,
    });
  } catch (error: any) {
    console.error("Bulk pay error:", error);
    return errorResponse("Erro interno do servidor", 500);
  }
}
