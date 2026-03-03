import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { authenticateRequest, unauthorizedResponse } from "@/lib/auth";
import { successResponse, errorResponse, paginatedResponse, parsePagination } from "@/lib/api-helpers";

// ─── GET /api/notifications ──────────────────────────────────────
export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (!auth) return unauthorizedResponse();

  try {
    const { searchParams } = new URL(req.url);
    const { page, limit, skip } = parsePagination(searchParams);
    const unreadOnly = searchParams.get("unread") === "true";

    const where: any = { userId: auth.userId };
    if (unreadOnly) where.read = false;

    const [notifications, total, unreadCount] = await Promise.all([
      db.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.notification.count({ where }),
      db.notification.count({
        where: { userId: auth.userId, read: false },
      }),
    ]);

    return Response.json({
      success: true,
      data: notifications,
      unreadCount,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });
  } catch (error: any) {
    console.error("Get notifications error:", error);
    return errorResponse("Erro interno do servidor", 500);
  }
}

// ─── PUT /api/notifications (Marcar como lidas) ──────────────────
export async function PUT(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (!auth) return unauthorizedResponse();

  try {
    const body = await req.json();
    const { notificationIds, markAll } = body;

    if (markAll) {
      await db.notification.updateMany({
        where: { userId: auth.userId, read: false },
        data: { read: true },
      });
      return successResponse({ message: "Todas as notificações marcadas como lidas" });
    }

    if (notificationIds && Array.isArray(notificationIds)) {
      await db.notification.updateMany({
        where: {
          id: { in: notificationIds },
          userId: auth.userId,
        },
        data: { read: true },
      });
      return successResponse({ message: `${notificationIds.length} notificação(ões) marcadas como lidas` });
    }

    return errorResponse("notificationIds ou markAll é obrigatório", 400);
  } catch (error: any) {
    console.error("Update notifications error:", error);
    return errorResponse("Erro interno do servidor", 500);
  }
}

// ─── DELETE /api/notifications ────────────────────────────────────
export async function DELETE(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (!auth) return unauthorizedResponse();

  try {
    const { searchParams } = new URL(req.url);
    const deleteAll = searchParams.get("all") === "true";

    if (deleteAll) {
      await db.notification.deleteMany({
        where: { userId: auth.userId },
      });
      return successResponse({ message: "Todas as notificações removidas" });
    }

    // Deletar apenas lidas
    await db.notification.deleteMany({
      where: { userId: auth.userId, read: true },
    });

    return successResponse({ message: "Notificações lidas removidas" });
  } catch (error: any) {
    console.error("Delete notifications error:", error);
    return errorResponse("Erro interno do servidor", 500);
  }
}
