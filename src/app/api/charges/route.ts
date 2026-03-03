import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { authenticateRequest, unauthorizedResponse } from "@/lib/auth";
import {
  successResponse,
  errorResponse,
  paginatedResponse,
  parsePagination,
  parseSort,
  validateRequired,
  createHistoryLog,
} from "@/lib/api-helpers";

// ─── GET /api/charges ─────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (!auth) return unauthorizedResponse();

  try {
    const { searchParams } = new URL(req.url);
    const { page, limit, skip } = parsePagination(searchParams);
    const { orderBy } = parseSort(searchParams, [
      "dueDate", "value", "status", "type", "createdAt",
    ]);

    const where: any = { userId: auth.userId };

    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const tenantId = searchParams.get("tenantId");
    const propertyId = searchParams.get("propertyId");
    const contractId = searchParams.get("contractId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const search = searchParams.get("search") || "";

    if (status) where.status = status;
    if (type) where.type = type;
    if (tenantId) where.tenantId = tenantId;
    if (propertyId) where.propertyId = propertyId;
    if (contractId) where.contractId = contractId;

    if (startDate || endDate) {
      where.dueDate = {};
      if (startDate) where.dueDate.gte = new Date(startDate);
      if (endDate) where.dueDate.lte = new Date(endDate);
    }

    if (search) {
      where.OR = [
        { description: { contains: search, mode: "insensitive" } },
        { tenant: { name: { contains: search, mode: "insensitive" } } },
        { property: { title: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [charges, total] = await Promise.all([
      db.charge.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          tenant: {
            select: { id: true, name: true, phone: true, whatsapp: true, email: true },
          },
          property: {
            select: { id: true, title: true, street: true, city: true },
          },
          contract: {
            select: { id: true, status: true },
          },
        },
      }),
      db.charge.count({ where }),
    ]);

    // Stats de cobranças (apenas para o filtro atual)
    const statsWhere = { ...where };
    delete statsWhere.status; // Remover filtro de status para stats

    const [pendingStats, overdueStats, paidStats, totalMonth] = await Promise.all([
      db.charge.aggregate({
        where: { ...statsWhere, status: "PENDING" },
        _sum: { value: true },
        _count: true,
      }),
      db.charge.aggregate({
        where: { ...statsWhere, status: "OVERDUE" },
        _sum: { value: true },
        _count: true,
      }),
      db.charge.aggregate({
        where: {
          ...statsWhere,
          status: "PAID",
          paymentDate: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            lt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1),
          },
        },
        _sum: { value: true },
        _count: true,
      }),
      db.charge.count({
        where: {
          ...statsWhere,
          dueDate: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            lt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1),
          },
        },
      }),
    ]);

    return Response.json({
      success: true,
      data: charges,
      stats: {
        pending: { count: pendingStats._count, value: pendingStats._sum.value || 0 },
        overdue: { count: overdueStats._count, value: overdueStats._sum.value || 0 },
        paidThisMonth: { count: paidStats._count, value: paidStats._sum.value || 0 },
        totalThisMonth: totalMonth,
      },
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });
  } catch (error: any) {
    console.error("Get charges error:", error);
    return errorResponse("Erro interno do servidor", 500);
  }
}

// ─── POST /api/charges ────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (!auth) return unauthorizedResponse();

  try {
    const body = await req.json();

    const missing = validateRequired(body, [
      "contractId", "tenantId", "propertyId", "type", "description", "value", "dueDate",
    ]);
    if (missing.length > 0) {
      return errorResponse(`Campos obrigatórios: ${missing.join(", ")}`, 400);
    }

    // Verificar se pertence ao usuário
    const contract = await db.contract.findFirst({
      where: { id: body.contractId, userId: auth.userId },
    });
    if (!contract) {
      return errorResponse("Contrato não encontrado", 404);
    }

    const charge = await db.charge.create({
      data: {
        userId: auth.userId,
        contractId: body.contractId,
        tenantId: body.tenantId,
        propertyId: body.propertyId,
        type: body.type,
        description: body.description,
        value: parseFloat(body.value),
        dueDate: new Date(body.dueDate),
        status: body.status || "PENDING",
        notes: body.notes,
        discountValue: body.discountValue ? parseFloat(body.discountValue) : undefined,
      },
      include: {
        tenant: { select: { id: true, name: true } },
        property: { select: { id: true, title: true } },
      },
    });

    await createHistoryLog(
      db,
      auth.userId,
      "CHARGE",
      charge.id,
      "CREATE",
      `Cobrança "${charge.description}" criada - R$ ${charge.value.toFixed(2)}`
    );

    return successResponse(charge, 201);
  } catch (error: any) {
    console.error("Create charge error:", error);
    return errorResponse("Erro interno do servidor", 500);
  }
}
