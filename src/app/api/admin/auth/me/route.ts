import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-helpers";
import jwt from "jsonwebtoken";

const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET || "CHANGE-ME";

// ─── GET /api/admin/auth/me ──────────────────────────────────────
export async function GET(req: NextRequest) {
  const cookieToken = req.cookies.get("imobierp_admin_token")?.value;
  const headerToken = req.headers.get("authorization")?.replace("Bearer ", "");
  const token = cookieToken || headerToken;

  console.log(`[ADMIN ME] Cookie present: ${!!cookieToken}, Header present: ${!!headerToken}, Secret length: ${ADMIN_JWT_SECRET.length}`);

  if (!token) {
    console.log("[ADMIN ME] No token found in cookies or headers");
    return errorResponse("Não autenticado", 401);
  }

  let payload: { adminId: string; email: string };
  try {
    payload = jwt.verify(token, ADMIN_JWT_SECRET) as { adminId: string; email: string };
    console.log(`[ADMIN ME] JWT verified for adminId: ${payload.adminId}`);
  } catch (err: any) {
    console.error(`[ADMIN ME] JWT verify failed: ${err.message}`);
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
