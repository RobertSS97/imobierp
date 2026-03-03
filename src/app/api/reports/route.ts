import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { authenticateRequest, unauthorizedResponse } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-helpers";

// ─── GET /api/reports ─────────────────────────────────────────────
// Gera relatórios com base nos filtros
export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (!auth) return unauthorizedResponse();

  try {
    const { searchParams } = new URL(req.url);
    const reportType = searchParams.get("type") || "financial-summary";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const userId = auth.userId;

    const dateFilter: any = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    switch (reportType) {
      case "financial-summary":
        return await financialSummaryReport(userId, dateFilter);

      case "charges-by-status":
        return await chargesByStatusReport(userId, dateFilter);

      case "charges-by-property":
        return await chargesByPropertyReport(userId, dateFilter);

      case "charges-by-tenant":
        return await chargesByTenantReport(userId, dateFilter);

      case "occupancy":
        return await occupancyReport(userId);

      case "properties-by-type":
        return await propertiesByTypeReport(userId);

      case "properties-by-status":
        return await propertiesByStatusReport(userId);

      case "contracts-expiring":
        return await contractsExpiringReport(userId);

      case "overdue-tenants":
        return await overdueTenantsReport(userId);

      case "revenue-by-month":
        return await revenueByMonthReport(userId, dateFilter);

      case "income-by-owner":
        return await incomeByOwnerReport(userId, dateFilter);

      default:
        return errorResponse("Tipo de relatório inválido", 400);
    }
  } catch (error: any) {
    console.error("Reports error:", error);
    return errorResponse("Erro interno do servidor", 500);
  }
}

// ─── Resumo financeiro ────────────────────────────────────────────
async function financialSummaryReport(userId: string, dateFilter: any) {
  const chargeWhere: any = { userId };
  if (dateFilter.gte || dateFilter.lte) {
    chargeWhere.dueDate = dateFilter;
  }

  const [totalReceived, totalPending, totalOverdue, totalCancelled, chargesByType] = await Promise.all([
    db.charge.aggregate({
      where: { ...chargeWhere, status: "PAID" },
      _sum: { value: true, penaltyValue: true, interestValue: true, discountValue: true },
      _count: true,
    }),
    db.charge.aggregate({
      where: { ...chargeWhere, status: "PENDING" },
      _sum: { value: true },
      _count: true,
    }),
    db.charge.aggregate({
      where: { ...chargeWhere, status: "OVERDUE" },
      _sum: { value: true },
      _count: true,
    }),
    db.charge.aggregate({
      where: { ...chargeWhere, status: "CANCELLED" },
      _sum: { value: true },
      _count: true,
    }),
    db.charge.groupBy({
      by: ["type"],
      where: chargeWhere,
      _sum: { value: true },
      _count: true,
    }),
  ]);

  return successResponse({
    type: "financial-summary",
    data: {
      received: {
        count: totalReceived._count,
        value: totalReceived._sum.value || 0,
        penalties: totalReceived._sum.penaltyValue || 0,
        interest: totalReceived._sum.interestValue || 0,
        discounts: totalReceived._sum.discountValue || 0,
      },
      pending: {
        count: totalPending._count,
        value: totalPending._sum.value || 0,
      },
      overdue: {
        count: totalOverdue._count,
        value: totalOverdue._sum.value || 0,
      },
      cancelled: {
        count: totalCancelled._count,
        value: totalCancelled._sum.value || 0,
      },
      byType: chargesByType,
    },
  });
}

// ─── Cobranças por status ─────────────────────────────────────────
async function chargesByStatusReport(userId: string, dateFilter: any) {
  const where: any = { userId };
  if (dateFilter.gte || dateFilter.lte) where.dueDate = dateFilter;

  const data = await db.charge.groupBy({
    by: ["status"],
    where,
    _sum: { value: true },
    _count: true,
  });

  return successResponse({ type: "charges-by-status", data });
}

// ─── Cobranças por imóvel ─────────────────────────────────────────
async function chargesByPropertyReport(userId: string, dateFilter: any) {
  const where: any = { userId };
  if (dateFilter.gte || dateFilter.lte) where.dueDate = dateFilter;

  const charges = await db.charge.findMany({
    where,
    select: {
      value: true,
      status: true,
      property: { select: { id: true, title: true, city: true } },
    },
  });

  // Agrupar por imóvel
  const byProperty: Record<string, any> = {};
  for (const charge of charges) {
    const key = charge.property.id;
    if (!byProperty[key]) {
      byProperty[key] = {
        property: charge.property,
        total: 0,
        paid: 0,
        pending: 0,
        overdue: 0,
        count: 0,
      };
    }
    byProperty[key].total += charge.value;
    byProperty[key].count++;
    if (charge.status === "PAID") byProperty[key].paid += charge.value;
    if (charge.status === "PENDING") byProperty[key].pending += charge.value;
    if (charge.status === "OVERDUE") byProperty[key].overdue += charge.value;
  }

  return successResponse({
    type: "charges-by-property",
    data: Object.values(byProperty).sort((a: any, b: any) => b.total - a.total),
  });
}

// ─── Cobranças por inquilino ──────────────────────────────────────
async function chargesByTenantReport(userId: string, dateFilter: any) {
  const where: any = { userId };
  if (dateFilter.gte || dateFilter.lte) where.dueDate = dateFilter;

  const charges = await db.charge.findMany({
    where,
    select: {
      value: true,
      status: true,
      tenant: { select: { id: true, name: true, email: true, phone: true } },
    },
  });

  const byTenant: Record<string, any> = {};
  for (const charge of charges) {
    const key = charge.tenant.id;
    if (!byTenant[key]) {
      byTenant[key] = {
        tenant: charge.tenant,
        total: 0,
        paid: 0,
        pending: 0,
        overdue: 0,
        count: 0,
      };
    }
    byTenant[key].total += charge.value;
    byTenant[key].count++;
    if (charge.status === "PAID") byTenant[key].paid += charge.value;
    if (charge.status === "PENDING") byTenant[key].pending += charge.value;
    if (charge.status === "OVERDUE") byTenant[key].overdue += charge.value;
  }

  return successResponse({
    type: "charges-by-tenant",
    data: Object.values(byTenant).sort((a: any, b: any) => b.overdue - a.overdue),
  });
}

// ─── Relatório de ocupação ────────────────────────────────────────
async function occupancyReport(userId: string) {
  const [byStatus, byType, byCity] = await Promise.all([
    db.property.groupBy({
      by: ["status"],
      where: { userId },
      _count: true,
    }),
    db.property.groupBy({
      by: ["type"],
      where: { userId },
      _count: true,
      _avg: { rentValue: true },
    }),
    db.property.groupBy({
      by: ["city", "state"],
      where: { userId },
      _count: true,
      _avg: { rentValue: true },
    }),
  ]);

  return successResponse({
    type: "occupancy",
    data: { byStatus, byType, byCity },
  });
}

// ─── Imóveis por tipo ─────────────────────────────────────────────
async function propertiesByTypeReport(userId: string) {
  const data = await db.property.groupBy({
    by: ["type"],
    where: { userId },
    _count: true,
    _avg: { rentValue: true, area: true },
    _min: { rentValue: true },
    _max: { rentValue: true },
  });

  return successResponse({ type: "properties-by-type", data });
}

// ─── Imóveis por status ──────────────────────────────────────────
async function propertiesByStatusReport(userId: string) {
  const data = await db.property.groupBy({
    by: ["status"],
    where: { userId },
    _count: true,
    _sum: { rentValue: true },
  });

  return successResponse({ type: "properties-by-status", data });
}

// ─── Contratos expirando ─────────────────────────────────────────
async function contractsExpiringReport(userId: string) {
  const ninetyDays = new Date();
  ninetyDays.setDate(ninetyDays.getDate() + 90);

  const data = await db.contract.findMany({
    where: {
      userId,
      status: "ACTIVE",
      endDate: { gte: new Date(), lte: ninetyDays },
    },
    orderBy: { endDate: "asc" },
    include: {
      property: { select: { id: true, title: true, city: true } },
      tenant: { select: { id: true, name: true, phone: true, email: true } },
      owner: { select: { id: true, name: true } },
    },
  });

  return successResponse({
    type: "contracts-expiring",
    data: data.map((c) => ({
      ...c,
      daysUntilExpiry: Math.ceil(
        (c.endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      ),
    })),
  });
}

// ─── Inquilinos inadimplentes ────────────────────────────────────
async function overdueTenantsReport(userId: string) {
  const overdueCharges = await db.charge.findMany({
    where: { userId, status: "OVERDUE" },
    include: {
      tenant: { select: { id: true, name: true, phone: true, whatsapp: true, email: true } },
      property: { select: { id: true, title: true } },
    },
    orderBy: { dueDate: "asc" },
  });

  // Agrupar por inquilino
  const byTenant: Record<string, any> = {};
  for (const charge of overdueCharges) {
    const key = charge.tenant.id;
    if (!byTenant[key]) {
      byTenant[key] = {
        tenant: charge.tenant,
        totalOverdue: 0,
        overdueCount: 0,
        charges: [],
        oldestDueDate: charge.dueDate,
      };
    }
    byTenant[key].totalOverdue += charge.value;
    byTenant[key].overdueCount++;
    byTenant[key].charges.push({
      id: charge.id,
      description: charge.description,
      value: charge.value,
      dueDate: charge.dueDate,
      property: charge.property,
    });
  }

  return successResponse({
    type: "overdue-tenants",
    data: Object.values(byTenant).sort((a: any, b: any) => b.totalOverdue - a.totalOverdue),
  });
}

// ─── Receita por mês ─────────────────────────────────────────────
async function revenueByMonthReport(userId: string, dateFilter: any) {
  const months = 12;
  const now = new Date();
  const data: any[] = [];

  for (let i = months - 1; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

    const [paid, pending, overdue] = await Promise.all([
      db.charge.aggregate({
        where: { userId, status: "PAID", paymentDate: { gte: monthStart, lte: monthEnd } },
        _sum: { value: true },
        _count: true,
      }),
      db.charge.aggregate({
        where: { userId, status: "PENDING", dueDate: { gte: monthStart, lte: monthEnd } },
        _sum: { value: true },
        _count: true,
      }),
      db.charge.aggregate({
        where: { userId, status: "OVERDUE", dueDate: { gte: monthStart, lte: monthEnd } },
        _sum: { value: true },
        _count: true,
      }),
    ]);

    const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    data.push({
      month: monthNames[monthStart.getMonth()],
      year: monthStart.getFullYear(),
      paid: { count: paid._count, value: paid._sum.value || 0 },
      pending: { count: pending._count, value: pending._sum.value || 0 },
      overdue: { count: overdue._count, value: overdue._sum.value || 0 },
      total: (paid._sum.value || 0) + (pending._sum.value || 0) + (overdue._sum.value || 0),
    });
  }

  return successResponse({ type: "revenue-by-month", data });
}

// ─── Receita por proprietário ────────────────────────────────────
async function incomeByOwnerReport(userId: string, dateFilter: any) {
  const contracts = await db.contract.findMany({
    where: { userId },
    include: {
      owner: { select: { id: true, name: true, email: true, phone: true } },
      property: { select: { id: true, title: true } },
      charges: {
        where: dateFilter.gte || dateFilter.lte
          ? { dueDate: dateFilter }
          : undefined,
        select: { value: true, status: true },
      },
    },
  });

  const byOwner: Record<string, any> = {};
  for (const contract of contracts) {
    const key = contract.owner.id;
    if (!byOwner[key]) {
      byOwner[key] = {
        owner: contract.owner,
        properties: [],
        totalValue: 0,
        paidValue: 0,
        pendingValue: 0,
        overdueValue: 0,
      };
    }

    byOwner[key].properties.push(contract.property);

    for (const charge of contract.charges) {
      byOwner[key].totalValue += charge.value;
      if (charge.status === "PAID") byOwner[key].paidValue += charge.value;
      if (charge.status === "PENDING") byOwner[key].pendingValue += charge.value;
      if (charge.status === "OVERDUE") byOwner[key].overdueValue += charge.value;
    }
  }

  return successResponse({
    type: "income-by-owner",
    data: Object.values(byOwner).sort((a: any, b: any) => b.totalValue - a.totalValue),
  });
}
