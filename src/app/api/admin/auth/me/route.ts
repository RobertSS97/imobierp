import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-helpers";
import jwt from "jsonwebtoken";

const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET || "CHANGE-ME";

// ─── GET /api/admin/auth/me ──────────────────────────────────────
export async function GET(req: NextRequest) {
  const token =
    req.cookies.get("imobierp_admin_token")?.value ||
    req.headers.get("authorization")?.replace("Bearer ", "");

  if (!token) {
    return errorResponse("Não autenticado", 401);
  }

  let payload: { adminId: string; email: string };
  try {
    payload = jwt.verify(token, ADMIN_JWT_SECRET) as { adminId: string; email: string };
  } catch {
    return errorResponse("Token inválido ou expirado", 401);
  }

  try {
    const admin = await db.adminUser.findUnique({
      where: { id: payload.adminId },
      select: { id: true, name: true, email: true, isActive: true, lastLoginAt: true, createdAt: true },
    });

    if (!admin || !admin.isActive) {
      return errorResponse("Admin não encontrado ou desativado", 401);
    }

    return successResponse(admin);
  } catch (error) {
    console.error("[ADMIN ME] DB error:", error);
    return errorResponse("Erro de conexão com banco de dados", 503);
  }
}
