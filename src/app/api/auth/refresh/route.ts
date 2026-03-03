import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  verifyRefreshToken,
  generateAccessToken,
  generateRefreshToken,
  type JwtPayload,
} from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-helpers";

// ─── POST /api/auth/refresh ───────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { refreshToken: token } = body;

    if (!token) {
      return errorResponse("Refresh token é obrigatório", 400);
    }

    // Verificar token
    let payload: JwtPayload;
    try {
      payload = verifyRefreshToken(token);
    } catch {
      return errorResponse("Refresh token inválido ou expirado", 401);
    }

    // Verificar se o token bate com o armazenado
    const user = await db.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        role: true,
        plan: true,
        isActive: true,
        refreshToken: true,
      },
    });

    if (!user || !user.isActive || user.refreshToken !== token) {
      return errorResponse("Refresh token inválido", 401);
    }

    // Gerar novos tokens
    const newPayload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      plan: user.plan,
    };

    const accessToken = generateAccessToken(newPayload);
    const refreshTokenNew = generateRefreshToken(newPayload);

    // Atualizar refresh token (rotation)
    await db.user.update({
      where: { id: user.id },
      data: { refreshToken: refreshTokenNew },
    });

    return successResponse({
      accessToken,
      refreshToken: refreshTokenNew,
    });
  } catch (error: any) {
    console.error("Refresh error:", error);
    return errorResponse("Erro interno do servidor", 500);
  }
}
