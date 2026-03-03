import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  generateResetToken,
  type JwtPayload,
} from "@/lib/auth";
import {
  successResponse,
  errorResponse,
  validateRequired,
  isValidEmail,
} from "@/lib/api-helpers";

// ─── POST /api/auth/register ──────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password, phone, companyName } = body;

    // Validação
    const missing = validateRequired(body, ["name", "email", "password"]);
    if (missing.length > 0) {
      return errorResponse(`Campos obrigatórios: ${missing.join(", ")}`, 400);
    }

    if (!isValidEmail(email)) {
      return errorResponse("Email inválido", 400);
    }

    if (password.length < 6) {
      return errorResponse("A senha deve ter no mínimo 6 caracteres", 400);
    }

    // Verificar se email já existe
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return errorResponse("Este email já está cadastrado", 409);
    }

    // Buscar dias de trial nas configurações do sistema
    let trialDays = 7; // fallback
    try {
      const trialSetting = await db.systemSettings.findUnique({
        where: { key: "trial_days" },
      });
      if (trialSetting) {
        trialDays = parseInt(trialSetting.value, 10) || 7;
      }
    } catch {
      // Se a tabela não existe ainda, usa fallback
    }

    const trialExpiresAt = new Date();
    trialExpiresAt.setDate(trialExpiresAt.getDate() + trialDays);

    // Criar usuário com período de trial
    const passwordHash = await hashPassword(password);
    const user = await db.user.create({
      data: {
        name,
        email,
        phone,
        passwordHash,
        companyName,
        role: "ADMIN",
        plan: "STARTER",
        planExpiresAt: trialExpiresAt,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        plan: true,
        planExpiresAt: true,
        companyName: true,
        createdAt: true,
      },
    });

    // Gerar tokens
    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      plan: user.plan,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Salvar refresh token
    await db.user.update({
      where: { id: user.id },
      data: { refreshToken, lastLoginAt: new Date() },
    });

    return successResponse(
      {
        user,
        accessToken,
        refreshToken,
      },
      201
    );
  } catch (error: any) {
    console.error("Register error:", error);
    return errorResponse("Erro interno do servidor", 500);
  }
}
