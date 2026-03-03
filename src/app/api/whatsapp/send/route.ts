import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { authenticateRequest, unauthorizedResponse } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-helpers";
import { sendChargeWhatsapp, sendBulkChargeWhatsapp } from "@/lib/whatsapp";

// ─── POST /api/whatsapp/send ──────────────────────────────────────
// Envia mensagem de cobrança para um ou mais inquilinos via WhatsApp
export async function POST(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (!auth) return unauthorizedResponse();

  try {
    const body = await req.json();
    const { chargeId, chargeIds } = body;

    // Verificar se WhatsApp está habilitado
    const user = await db.user.findUnique({
      where: { id: auth.userId },
      select: { whatsappEnabled: true, whatsappApiUrl: true, whatsappApiKey: true },
    });

    if (!user?.whatsappEnabled || !user?.whatsappApiUrl || !user?.whatsappApiKey) {
      return errorResponse(
        "WhatsApp não está configurado. Vá em Configurações → WhatsApp para configurar.",
        400
      );
    }

    // Envio único
    if (chargeId) {
      const result = await sendChargeWhatsapp(auth.userId, chargeId);
      if (result.success) {
        return successResponse({ message: "Mensagem enviada com sucesso", ...result });
      }
      return errorResponse(result.error || "Erro ao enviar mensagem", 500);
    }

    // Envio em massa
    if (chargeIds && Array.isArray(chargeIds)) {
      if (chargeIds.length === 0) {
        return errorResponse("Nenhuma cobrança selecionada", 400);
      }

      if (chargeIds.length > 100) {
        return errorResponse("Máximo de 100 cobranças por envio em lote", 400);
      }

      const result = await sendBulkChargeWhatsapp(auth.userId, chargeIds);
      return successResponse({
        message: `${result.sent} de ${result.total} mensagens enviadas`,
        ...result,
      });
    }

    return errorResponse("chargeId ou chargeIds é obrigatório", 400);
  } catch (error: any) {
    console.error("WhatsApp send error:", error);
    return errorResponse("Erro interno do servidor", 500);
  }
}
