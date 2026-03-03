import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-helpers";

// ─── GET /api/admin/payments ───────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status") || "";
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) {
      where.status = status.toUpperCase();
    }

    const [payments, total] = await Promise.all([
      db.paymentLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      db.paymentLog.count({ where }),
    ]);

    // Stats
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalRevenue, revenueThisMonth, failedCount, refundedCount] = await Promise.all([
      db.paymentLog.aggregate({ where: { status: "PAID" }, _sum: { amount: true } }),
      db.paymentLog.aggregate({
        where: { status: "PAID", createdAt: { gte: startOfMonth } },
        _sum: { amount: true },
      }),
      db.paymentLog.count({ where: { status: "FAILED" } }),
      db.paymentLog.count({ where: { status: "REFUNDED" } }),
    ]);

    // Enriquecer com dados do user
    const userIds = [...new Set(payments.map((p) => p.userId))];
    const users = await db.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, companyName: true, plan: true },
    });
    const userMap: Record<string, { name: string; companyName: string | null; plan: string }> = {};
    users.forEach((u) => { userMap[u.id] = u; });

    const data = payments.map((p) => {
      const user = userMap[p.userId];
      return {
        id: p.id,
        customerId: p.userId,
        customerName: user ? user.name : "-",
        companyName: user ? (user.companyName || "-") : "-",
        planName: user ? user.plan : "-",
        amount: Math.round(p.amount * 100),
        currency: p.currency.toLowerCase(),
        status: p.status.toLowerCase(),
        stripeInvoiceId: p.stripeInvoiceId || "",
        stripePaymentIntentId: p.stripePaymentId || "",
        method: p.paymentMethod || "pix",
        cardLast4: null,
        createdAt: p.createdAt.toISOString(),
      };
    });

    return successResponse(data, 200, {
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
      stats: {
        totalRevenue: Math.round((totalRevenue._sum.amount || 0) * 100),
        thisMonth: Math.round((revenueThisMonth._sum.amount || 0) * 100),
        failed: failedCount,
        refunded: refundedCount,
      },
    });
  } catch (error: any) {
    console.error("[ADMIN] Payments list error:", error);
    return errorResponse("Erro ao listar pagamentos", 500);
  }
}
