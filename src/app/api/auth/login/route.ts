import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  type JwtPayload,
} from "@/lib/auth";
import {
  successResponse,
  errorResponse,
  validateRequired,
  isValidEmail,
} from "@/lib/api-helpers";

// ─── POST /api/auth/login ─────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    // Validação
    const missing = validateRequired(body, ["email", "password"]);
    if (missing.length > 0) {
      return errorResponse(`Campos obrigatórios: ${missing.join(", ")}`, 400);
    }

    if (!isValidEmail(email)) {
      return errorResponse("Email inválido", 400);
    }

    // Buscar usuário
    const user = await db.user.findUnique({ where: { email } });
    if (!user) {
      return errorResponse("Email ou senha incorretos", 401);
    }

    if (!user.isActive) {
      return errorResponse("Conta desativada. Entre em contato com o suporte.", 403);
    }

    // Verificar senha
    const isValid = await comparePassword(password, user.passwordHash);
    if (!isValid) {
      return errorResponse("Email ou senha incorretos", 401);
    }

    // Gerar tokens
    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      plan: user.plan,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Atualizar refresh token e último login
    await db.user.update({
      where: { id: user.id },
      data: { refreshToken, lastLoginAt: new Date() },
    });

    return successResponse({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        role: user.role,
        plan: user.plan,
        companyName: user.companyName,
        whatsappEnabled: user.whatsappEnabled,
        emailNotifications: user.emailNotifications,
      },
      accessToken,
      refreshToken,
    });
  } catch (error: any) {
    console.error("Login error:", error);
    return errorResponse("Erro interno do servidor", 500);
  }
}
