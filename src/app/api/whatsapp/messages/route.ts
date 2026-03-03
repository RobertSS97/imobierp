import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { authenticateRequest, unauthorizedResponse } from "@/lib/auth";
import { successResponse, errorResponse, paginatedResponse, parsePagination } from "@/lib/api-helpers";

// ─── GET /api/whatsapp/messages ───────────────────────────────────
// Log de mensagens WhatsApp enviadas
export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (!auth) return unauthorizedResponse();

  try {
    const { searchParams } = new URL(req.url);
    const { page, limit, skip } = parsePagination(searchParams);

    const status = searchParams.get("status");
    const chargeId = searchParams.get("chargeId");

    const where: any = { userId: auth.userId };
    if (status) where.status = status;
    if (chargeId) where.chargeId = chargeId;

    const [messages, total] = await Promise.all([
      db.whatsappMessage.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.whatsappMessage.count({ where }),
    ]);

    return paginatedResponse(messages, total, page, limit);
  } catch (error: any) {
    console.error("Get WhatsApp messages error:", error);
    return errorResponse("Erro interno do servidor", 500);
  }
}
