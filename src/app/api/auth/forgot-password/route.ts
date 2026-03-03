import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { generateResetToken, hashPassword } from "@/lib/auth";
import {
  successResponse,
  errorResponse,
  validateRequired,
  isValidEmail,
} from "@/lib/api-helpers";

// ─── POST /api/auth/forgot-password ───────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email || !isValidEmail(email)) {
      return errorResponse("Email válido é obrigatório", 400);
    }

    const user = await db.user.findUnique({ where: { email } });

    // Sempre retorna sucesso para não revelar se o email existe
    if (!user) {
      return successResponse({
        message: "Se o email estiver cadastrado, você receberá as instruções de recuperação.",
      });
    }

    // Gerar token de reset
    const resetToken = generateResetToken();
    const resetTokenExp = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    await db.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExp },
    });

    // TODO: Enviar email com o link de reset
    // Em produção, integrar com serviço de email (SendGrid, AWS SES, etc.)
    console.log(`Reset token for ${email}: ${resetToken}`);

    return successResponse({
      message: "Se o email estiver cadastrado, você receberá as instruções de recuperação.",
    });
  } catch (error: any) {
    console.error("Forgot password error:", error);
    return errorResponse("Erro interno do servidor", 500);
  }
}

// ─── PUT /api/auth/forgot-password (Reset password) ───────────────
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, password } = body;

    const missing = validateRequired(body, ["token", "password"]);
    if (missing.length > 0) {
      return errorResponse(`Campos obrigatórios: ${missing.join(", ")}`, 400);
    }

    if (password.length < 6) {
      return errorResponse("A senha deve ter no mínimo 6 caracteres", 400);
    }

    // Buscar usuário pelo token
    const user = await db.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExp: { gt: new Date() },
      },
    });

    if (!user) {
      return errorResponse("Token inválido ou expirado", 400);
    }

    // Atualizar senha
    const passwordHash = await hashPassword(password);
    await db.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExp: null,
      },
    });

    return successResponse({
      message: "Senha alterada com sucesso.",
    });
  } catch (error: any) {
    console.error("Reset password error:", error);
    return errorResponse("Erro interno do servidor", 500);
  }
}
