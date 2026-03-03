import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-helpers";

// ─── GET /api/admin/dashboard ──────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Contar clientes (Users)
    const [totalCustomers, activeSubscribers, trialUsers, recentUsers] = await Promise.all([
      db.user.count(),
      db.user.count({
        where: {
          isActive: true,
          OR: [
            { planExpiresAt: null },
            { planExpiresAt: { gt: now } },
          ],
        },
      }),
      db.user.count({
        where: {
          isActive: true,
          planExpiresAt: { gt: now },
          plan: "STARTER",
        },
      }),
      db.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          name: true,
          companyName: true,
          plan: true,
          createdAt: true,
        },
      }),
    ]);

    const churned = await db.user.count({
      where: {
        OR: [
          { isActive: false },
          { planExpiresAt: { lt: now } },
        ],
      },
    });

    // Pagamentos do mês
    const [paymentsThisMonth, totalPayments] = await Promise.all([
      db.paymentLog.aggregate({
        where: {
          status: "PAID",
          createdAt: { gte: startOfMonth },
        },
        _sum: { amount: true },
        _count: true,
      }),
      db.paymentLog.aggregate({
        where: { status: "PAID" },
        _sum: { amount: true },
      }),
    ]);

    const revenueThisMonth = paymentsThisMonth._sum.amount || 0;
    const totalRevenue = totalPayments._sum.amount || 0;
    const mrr = revenueThisMonth;
    const arr = mrr * 12;
    const avgRevenuePerUser = activeSubscribers > 0 ? mrr / activeSubscribers : 0;
    const ltv = avgRevenuePerUser * 12;
    const churnRate = totalCustomers > 0 ? (churned / totalCustomers) * 100 : 0;

    // Novos usuários este mês vs mês passado
    const newThisMonth = await db.user.count({
      where: { createdAt: { gte: startOfMonth } },
    });
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const newLastMonth = await db.user.count({
      where: {
        createdAt: { gte: lastMonth, lt: startOfMonth },
      },
    });
    const growthRate = newLastMonth > 0 ? ((newThisMonth - newLastMonth) / newLastMonth) * 100 : 0;

    // Distribuição de planos
    const planCounts = await db.user.groupBy({
      by: ["plan"],
      _count: true,
    });

    const planColors: Record<string, string> = {
      STARTER: "#3b82f6",
      PROFESSIONAL: "#8b5cf6",
      ENTERPRISE: "#f59e0b",
    };

    const planDistribution = planCounts.map((p) => ({
      name: p.plan,
      value: p._count,
      color: planColors[p.plan] || "#6b7280",
    }));

    // Recentes (signup)
    const recentSignups = recentUsers.map((u) => ({
      id: u.id,
      name: u.name,
      company: u.companyName || "-",
      plan: u.plan,
      date: u.createdAt.toISOString(),
    }));

    // MRR chart (últimos 6 meses)
    const mrrChart: { month: string; mrr: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const monthPayments = await db.paymentLog.aggregate({
        where: {
          status: "PAID",
          createdAt: { gte: d, lt: end },
        },
        _sum: { amount: true },
      });
      mrrChart.push({
        month: d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
        mrr: monthPayments._sum.amount || 0,
      });
    }

    // Pagamentos recentes
    const recentPayments = await db.paymentLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    return successResponse({
      stats: {
        totalCustomers,
        activeSubscribers,
        trialUsers,
        churned,
        mrr: Math.round(mrr * 100),
        arr: Math.round(arr * 100),
        avgRevenuePerUser: Math.round(avgRevenuePerUser * 100),
        ltv: Math.round(ltv * 100),
        churnRate: Math.round(churnRate * 100) / 100,
        growthRate: Math.round(growthRate * 100) / 100,
        totalRevenue: Math.round(totalRevenue * 100),
        revenueThisMonth: Math.round(revenueThisMonth * 100),
      },
      mrrChart,
      planDistribution,
      recentSignups,
      recentPayments: recentPayments.map((p) => ({
        id: p.id,
        customerId: p.userId,
        customerName: "-",
        companyName: "-",
        planName: "-",
        amount: Math.round(p.amount * 100),
        currency: p.currency.toLowerCase(),
        status: p.status.toLowerCase(),
        stripeInvoiceId: p.stripeInvoiceId || "",
        stripePaymentIntentId: p.stripePaymentId || "",
        method: p.paymentMethod || "pix",
        cardLast4: null,
        createdAt: p.createdAt.toISOString(),
      })),
    });
  } catch (error: any) {
    console.error("[ADMIN] Dashboard error:", error);
    return errorResponse("Erro ao carregar dashboard", 500);
  }
}
