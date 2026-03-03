import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-helpers";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// ─── GET /api/admin/plans/:id ──────────────────────────────────────
export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const plan = await db.subscriptionPlan.findUnique({ where: { id } });
    if (!plan) return errorResponse("Plano não encontrado", 404);
    return successResponse(plan);
  } catch (error: any) {
    console.error("[ADMIN] Plan get error:", error);
    return errorResponse("Erro ao buscar plano", 500);
  }
}

// ─── PUT /api/admin/plans/:id ──────────────────────────────────────
export async function PUT(req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await req.json();

    const existing = await db.subscriptionPlan.findUnique({ where: { id } });
    if (!existing) return errorResponse("Plano não encontrado", 404);

    const updateData: Record<string, any> = {};
    const allowedFields = [
      "name", "slug", "description", "billingCycle",
      "isActive", "isPopular", "sortOrder",
      "maxProperties", "maxTenants", "maxOwners", "maxContracts", "maxUsers",
      "features", "stripeProductId", "stripePriceId",
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // Preço vem em centavos, salvar em reais
    if (body.price !== undefined) {
      updateData.price = body.price / 100;
    }

    const plan = await db.subscriptionPlan.update({
      where: { id },
      data: updateData,
    });

    return successResponse(plan);
  } catch (error: any) {
    console.error("[ADMIN] Plan update error:", error);
    return errorResponse("Erro ao atualizar plano", 500);
  }
}

// ─── DELETE /api/admin/plans/:id ───────────────────────────────────
export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const existing = await db.subscriptionPlan.findUnique({ where: { id } });
    if (!existing) return errorResponse("Plano não encontrado", 404);

    // Verificar se há usuários no plano
    const usersInPlan = await db.user.count({
      where: { plan: existing.slug.toUpperCase() as any },
    });

    if (usersInPlan > 0) {
      return errorResponse(
        `Não é possível excluir: ${usersInPlan} usuário(s) estão neste plano`,
        400
      );
    }

    await db.subscriptionPlan.delete({ where: { id } });
    return successResponse({ message: "Plano excluído com sucesso" });
  } catch (error: any) {
    console.error("[ADMIN] Plan delete error:", error);
    return errorResponse("Erro ao excluir plano", 500);
  }
}
