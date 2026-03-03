import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-helpers";

// ─── GET /api/admin/plans ──────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const plans = await db.subscriptionPlan.findMany({
      orderBy: { sortOrder: "asc" },
    });

    // Contar assinantes por plano
    const planData = await Promise.all(
      plans.map(async (plan) => {
        const subscribersCount = await db.user.count({
          where: { plan: plan.slug.toUpperCase() as any, isActive: true },
        });

        return {
          id: plan.id,
          name: plan.name,
          slug: plan.slug,
          stripeProductId: plan.stripeProductId || "",
          stripePriceIdMonthly: plan.stripePriceId || "",
          stripePriceIdYearly: "",
          priceMonthly: Math.round(plan.price * 100),
          priceYearly: Math.round(plan.price * 10 * 100), // 10 meses
          active: plan.isActive,
          popular: plan.isPopular,
          trialDays: 7,
          limits: {
            properties: plan.maxProperties,
            tenants: plan.maxTenants,
            owners: plan.maxOwners,
            contracts: plan.maxContracts,
            users: plan.maxUsers,
            storageGB: 5,
            whatsapp: plan.maxProperties > 15,
            reports: true,
            api: plan.maxProperties > 50,
          },
          features: plan.features,
          subscribersCount,
          mrr: Math.round(subscribersCount * plan.price * 100),
          createdAt: plan.createdAt.toISOString(),
          updatedAt: plan.updatedAt.toISOString(),
        };
      })
    );

    return successResponse(planData);
  } catch (error: any) {
    console.error("[ADMIN] Plans list error:", error);
    return errorResponse("Erro ao listar planos", 500);
  }
}

// ─── POST /api/admin/plans ─────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      slug,
      description,
      price,
      billingCycle,
      isActive,
      isPopular,
      sortOrder,
      maxProperties,
      maxTenants,
      maxOwners,
      maxContracts,
      maxUsers,
      features,
      stripeProductId,
      stripePriceId,
    } = body;

    if (!name || !slug || price === undefined) {
      return errorResponse("Nome, slug e preço são obrigatórios", 400);
    }

    const plan = await db.subscriptionPlan.create({
      data: {
        name,
        slug,
        description,
        price: price / 100, // centavos -> reais
        billingCycle: billingCycle || "MONTHLY",
        isActive: isActive ?? true,
        isPopular: isPopular ?? false,
        sortOrder: sortOrder ?? 0,
        maxProperties: maxProperties ?? 10,
        maxTenants: maxTenants ?? 10,
        maxOwners: maxOwners ?? 10,
        maxContracts: maxContracts ?? 10,
        maxUsers: maxUsers ?? 1,
        features: features ?? [],
        stripeProductId,
        stripePriceId,
      },
    });

    return successResponse(plan, 201);
  } catch (error: any) {
    console.error("[ADMIN] Plan create error:", error);
    if (error.code === "P2002") {
      return errorResponse("Já existe um plano com esse nome ou slug", 409);
    }
    return errorResponse("Erro ao criar plano", 500);
  }
}
