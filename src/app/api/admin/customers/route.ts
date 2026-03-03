import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-helpers";

// ─── GET /api/admin/customers ──────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const plan = searchParams.get("plan") || "";
    const skip = (page - 1) * limit;
    const now = new Date();

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { companyName: { contains: search, mode: "insensitive" } },
      ];
    }

    if (plan) {
      where.plan = plan.toUpperCase();
    }

    if (status === "active") {
      where.isActive = true;
      where.OR = [
        { planExpiresAt: null },
        { planExpiresAt: { gt: now } },
      ];
    } else if (status === "trialing") {
      where.isActive = true;
      where.planExpiresAt = { gt: now };
    } else if (status === "inactive") {
      where.OR = [
        { isActive: false },
        { planExpiresAt: { lt: now } },
      ];
    }

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          companyName: true,
          plan: true,
          planExpiresAt: true,
          isActive: true,
          createdAt: true,
          lastLoginAt: true,
          _count: {
            select: {
              properties: true,
              tenants: true,
              owners: true,
              contracts: true,
            },
          },
        },
      }),
      db.user.count({ where }),
    ]);

    // Stats globais
    const [totalAll, activeCount, trialingCount] = await Promise.all([
      db.user.count(),
      db.user.count({
        where: {
          isActive: true,
          OR: [{ planExpiresAt: null }, { planExpiresAt: { gt: now } }],
        },
      }),
      db.user.count({
        where: { isActive: true, planExpiresAt: { gt: now }, plan: "STARTER" },
      }),
    ]);

    const customers = users.map((u) => {
      const isTrialing = u.planExpiresAt && u.planExpiresAt > now && u.plan === "STARTER";
      const isExpired = u.planExpiresAt && u.planExpiresAt < now;

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone || "",
        companyName: u.companyName || "-",
        planId: u.plan.toLowerCase(),
        planName: u.plan,
        status: !u.isActive || isExpired ? "inactive" : isTrialing ? "trialing" : "active",
        stripeCustomerId: "",
        subscriptionStatus: !u.isActive || isExpired
          ? "canceled"
          : isTrialing
          ? "trialing"
          : "active",
        currentPeriodEnd: u.planExpiresAt?.toISOString() || "",
        propertiesCount: u._count.properties,
        tenantsCount: u._count.tenants,
        usage: {
          properties: u._count.properties,
          tenants: u._count.tenants,
          owners: u._count.owners,
          contracts: u._count.contracts,
          storageUsedMB: 0,
        },
        totalPaid: 0,
        lastPayment: null,
        createdAt: u.createdAt.toISOString(),
      };
    });

    return successResponse(customers, 200, {
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
      stats: {
        total: totalAll,
        active: activeCount,
        trialing: trialingCount,
        churned: totalAll - activeCount,
      },
    });
  } catch (error: any) {
    console.error("[ADMIN] Customers list error:", error);
    return errorResponse("Erro ao listar clientes", 500);
  }
}
