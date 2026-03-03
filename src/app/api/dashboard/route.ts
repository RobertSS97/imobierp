import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { authenticateRequest, unauthorizedResponse } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-helpers";

// ─── GET /api/dashboard ───────────────────────────────────────────
export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (!auth) return unauthorizedResponse();

  try {
    const userId = auth.userId;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // ─── Stats gerais ──────────────────────────────────────────────
    const [
      totalProperties,
      rentedProperties,
      availableProperties,
      maintenanceProperties,
      totalTenants,
      activeTenants,
      totalOwners,
      activeOwners,
      activeContracts,
      totalContracts,
    ] = await Promise.all([
      db.property.count({ where: { userId } }),
      db.property.count({ where: { userId, status: "RENTED" } }),
      db.property.count({ where: { userId, status: "AVAILABLE" } }),
      db.property.count({ where: { userId, status: "MAINTENANCE" } }),
      db.tenant.count({ where: { userId } }),
      db.tenant.count({ where: { userId, status: "ACTIVE" } }),
      db.owner.count({ where: { userId } }),
      db.owner.count({ where: { userId, status: "ACTIVE" } }),
      db.contract.count({ where: { userId, status: "ACTIVE" } }),
      db.contract.count({ where: { userId } }),
    ]);

    // ─── Cobranças ───────────────────────────────────────────────
    const [
      pendingCharges,
      overdueCharges,
      paidThisMonth,
      pendingThisMonth,
      paidLastMonth,
    ] = await Promise.all([
      db.charge.aggregate({
        where: { userId, status: "PENDING" },
        _count: true,
        _sum: { value: true },
      }),
      db.charge.aggregate({
        where: { userId, status: "OVERDUE" },
        _count: true,
        _sum: { value: true },
      }),
      db.charge.aggregate({
        where: {
          userId,
          status: "PAID",
          paymentDate: { gte: startOfMonth, lte: endOfMonth },
        },
        _count: true,
        _sum: { value: true },
      }),
      db.charge.aggregate({
        where: {
          userId,
          status: { in: ["PENDING", "OVERDUE"] },
          dueDate: { gte: startOfMonth, lte: endOfMonth },
        },
        _count: true,
        _sum: { value: true },
      }),
      db.charge.aggregate({
        where: {
          userId,
          status: "PAID",
          paymentDate: { gte: startOfLastMonth, lte: endOfLastMonth },
        },
        _sum: { value: true },
      }),
    ]);

    // Taxa de ocupação
    const occupancyRate = totalProperties > 0
      ? ((rentedProperties / totalProperties) * 100)
      : 0;

    // Variação de receita mês a mês
    const currentRevenue = paidThisMonth._sum.value || 0;
    const lastRevenue = paidLastMonth._sum.value || 0;
    const revenueTrend = lastRevenue > 0
      ? ((currentRevenue - lastRevenue) / lastRevenue) * 100
      : 0;

    // ─── Receita mensal (últimos 12 meses) ───────────────────────
    const revenueData: any[] = [];
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const [paid, pending] = await Promise.all([
        db.charge.aggregate({
          where: {
            userId,
            status: "PAID",
            paymentDate: { gte: monthStart, lte: monthEnd },
          },
          _sum: { value: true },
        }),
        db.charge.aggregate({
          where: {
            userId,
            status: { in: ["PENDING", "OVERDUE"] },
            dueDate: { gte: monthStart, lte: monthEnd },
          },
          _sum: { value: true },
        }),
      ]);

      const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
      revenueData.push({
        month: monthNames[monthStart.getMonth()],
        year: monthStart.getFullYear(),
        receita: paid._sum.value || 0,
        pendente: pending._sum.value || 0,
      });
    }

    // ─── Dados de ocupação (para gráfico) ────────────────────────
    const occupancyData = [
      { name: "Alugados", value: rentedProperties, color: "hsl(var(--primary))" },
      { name: "Disponíveis", value: availableProperties, color: "hsl(var(--chart-2))" },
      { name: "Manutenção", value: maintenanceProperties, color: "hsl(var(--chart-3))" },
    ];

    // ─── Cobranças recentes ──────────────────────────────────────
    const recentOverdueCharges = await db.charge.findMany({
      where: { userId, status: "OVERDUE" },
      orderBy: { dueDate: "asc" },
      take: 10,
      include: {
        tenant: { select: { id: true, name: true, phone: true } },
        property: { select: { id: true, title: true } },
      },
    });

    const recentPendingCharges = await db.charge.findMany({
      where: { userId, status: "PENDING" },
      orderBy: { dueDate: "asc" },
      take: 10,
      include: {
        tenant: { select: { id: true, name: true, phone: true } },
        property: { select: { id: true, title: true } },
      },
    });

    // ─── Contratos expirando em 30 dias ──────────────────────────
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const expiringContracts = await db.contract.findMany({
      where: {
        userId,
        status: "ACTIVE",
        endDate: { gte: now, lte: thirtyDaysFromNow },
      },
      orderBy: { endDate: "asc" },
      take: 5,
      include: {
        property: { select: { id: true, title: true } },
        tenant: { select: { id: true, name: true } },
      },
    });

    // ─── Atividade recente ───────────────────────────────────────
    const recentActivity = await db.historyLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 15,
    });

    return successResponse({
      stats: {
        totalProperties,
        rentedProperties,
        availableProperties,
        maintenanceProperties,
        totalTenants,
        activeTenants,
        totalOwners,
        activeOwners,
        activeContracts,
        totalContracts,
        pendingCharges: pendingCharges._count,
        pendingChargesValue: pendingCharges._sum.value || 0,
        overdueCharges: overdueCharges._count,
        overdueChargesValue: overdueCharges._sum.value || 0,
        monthlyRevenue: currentRevenue,
        monthlyPending: pendingThisMonth._sum.value || 0,
        occupancyRate: Math.round(occupancyRate * 100) / 100,
        revenueTrend: Math.round(revenueTrend * 100) / 100,
      },
      revenueData,
      occupancyData,
      recentOverdueCharges,
      recentPendingCharges,
      expiringContracts,
      recentActivity,
    });
  } catch (error: any) {
    console.error("Dashboard error:", error);
    return errorResponse("Erro interno do servidor", 500);
  }
}
