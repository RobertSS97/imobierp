import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { authenticateRequest, unauthorizedResponse, hashPassword, comparePassword } from "@/lib/auth";
import { successResponse, errorResponse, isValidEmail } from "@/lib/api-helpers";

// ─── GET /api/auth/me ─────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (!auth) return unauthorizedResponse();

  try {
    const user = await db.user.findUnique({
      where: { id: auth.userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatar: true,
        role: true,
        plan: true,
        planExpiresAt: true,
        companyName: true,
        companyEmail: true,
        companyPhone: true,
        companyStreet: true,
        companyNumber: true,
        companyComplement: true,
        companyNeighborhood: true,
        companyCity: true,
        companyState: true,
        companyZipCode: true,
        creciNumber: true,
        creciState: true,
        logo: true,
        primaryColor: true,
        whatsappEnabled: true,
        whatsappApiUrl: true,
        whatsappInstanceName: true,
        emailNotifications: true,
        notifyNewRegister: true,
        notifyPayment: true,
        notifyOverdue: true,
        notifyExpiring: true,
        autoChargeEnabled: true,
        autoChargeDay: true,
        lateFeePercentage: true,
        interestPercentage: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return errorResponse("Usuário não encontrado", 404);
    }

    // Calcular status do trial/plano
    const now = new Date();
    const trialExpired = user.planExpiresAt ? user.planExpiresAt < now : false;
    const trialDaysLeft = user.planExpiresAt
      ? Math.max(0, Math.ceil((user.planExpiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
      : null;

    return successResponse({
      ...user,
      trialExpired,
      trialDaysLeft,
    });
  } catch (error: any) {
    console.error("Get me error:", error);
    return errorResponse("Erro interno do servidor", 500);
  }
}

// ─── PUT /api/auth/me (Atualizar perfil) ──────────────────────────
export async function PUT(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (!auth) return unauthorizedResponse();

  try {
    const body = await req.json();

    // Campos que podem ser atualizados
    const allowedFields = [
      "name", "phone", "avatar",
      "companyName", "companyEmail", "companyPhone",
      "companyStreet", "companyNumber", "companyComplement",
      "companyNeighborhood", "companyCity", "companyState", "companyZipCode",
      "creciNumber", "creciState", "logo", "primaryColor",
      "whatsappEnabled", "whatsappApiUrl", "whatsappApiKey", "whatsappInstanceName",
      "emailNotifications", "notifyNewRegister", "notifyPayment", "notifyOverdue", "notifyExpiring",
      "autoChargeEnabled", "autoChargeDay",
      "lateFeePercentage", "interestPercentage",
    ];

    const updateData: Record<string, any> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // Validar email da empresa se fornecido
    if (updateData.companyEmail && !isValidEmail(updateData.companyEmail)) {
      return errorResponse("Email da empresa inválido", 400);
    }

    const user = await db.user.update({
      where: { id: auth.userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatar: true,
        role: true,
        plan: true,
        companyName: true,
        updatedAt: true,
      },
    });

    return successResponse(user);
  } catch (error: any) {
    console.error("Update me error:", error);
    return errorResponse("Erro interno do servidor", 500);
  }
}

// ─── PATCH /api/auth/me (Alterar senha) ───────────────────────────
export async function PATCH(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (!auth) return unauthorizedResponse();

  try {
    const body = await req.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return errorResponse("Senha atual e nova senha são obrigatórias", 400);
    }

    if (newPassword.length < 6) {
      return errorResponse("A nova senha deve ter no mínimo 6 caracteres", 400);
    }

    const user = await db.user.findUnique({
      where: { id: auth.userId },
      select: { passwordHash: true },
    });

    if (!user) {
      return errorResponse("Usuário não encontrado", 404);
    }

    const isValid = await comparePassword(currentPassword, user.passwordHash);
    if (!isValid) {
      return errorResponse("Senha atual incorreta", 400);
    }

    const passwordHash = await hashPassword(newPassword);
    await db.user.update({
      where: { id: auth.userId },
      data: { passwordHash },
    });

    return successResponse({ message: "Senha alterada com sucesso" });
  } catch (error: any) {
    console.error("Change password error:", error);
    return errorResponse("Erro interno do servidor", 500);
  }
}
