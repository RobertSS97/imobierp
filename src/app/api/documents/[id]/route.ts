import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { authenticateRequest, unauthorizedResponse } from "@/lib/auth";
import { successResponse, errorResponse, createHistoryLog } from "@/lib/api-helpers";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// ─── GET /api/documents/[id] ──────────────────────────────────────
export async function GET(req: NextRequest, { params }: RouteParams) {
  const auth = await authenticateRequest(req);
  if (!auth) return unauthorizedResponse();

  try {
    const { id } = await params;
    const document = await db.document.findFirst({
      where: { id, userId: auth.userId },
      include: {
        tenant: { select: { id: true, name: true } },
        contract: {
          select: {
            id: true,
            property: { select: { id: true, title: true } },
            tenant: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!document) {
      return errorResponse("Documento não encontrado", 404);
    }

    return successResponse(document);
  } catch (error: any) {
    console.error("Get document error:", error);
    return errorResponse("Erro interno do servidor", 500);
  }
}

// ─── DELETE /api/documents/[id] ───────────────────────────────────
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const auth = await authenticateRequest(req);
  if (!auth) return unauthorizedResponse();

  try {
    const { id } = await params;
    const existing = await db.document.findFirst({
      where: { id, userId: auth.userId },
    });

    if (!existing) {
      return errorResponse("Documento não encontrado", 404);
    }

    await db.document.delete({ where: { id } });

    await createHistoryLog(
      db,
      auth.userId,
      "DOCUMENT",
      id,
      "DELETE",
      `Documento "${existing.name}" removido`
    );

    return successResponse({ message: "Documento removido com sucesso" });
  } catch (error: any) {
    console.error("Delete document error:", error);
    return errorResponse("Erro interno do servidor", 500);
  }
}
