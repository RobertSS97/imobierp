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

// ─── GET /api/contracts ───────────────────────────────────────────
export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (!auth) return unauthorizedResponse();

  try {
    const { searchParams } = new URL(req.url);
    const { page, limit, skip } = parsePagination(searchParams);
    const { orderBy } = parseSort(searchParams, [
      "startDate", "endDate", "rentValue", "status", "createdAt",
    ]);

    const where: any = { userId: auth.userId };

    const status = searchParams.get("status");
    const propertyId = searchParams.get("propertyId");
    const tenantId = searchParams.get("tenantId");
    const ownerId = searchParams.get("ownerId");
    const search = searchParams.get("search") || "";
    const expiringDays = searchParams.get("expiringDays"); // Contratos expirando em X dias

    if (status) where.status = status;
    if (propertyId) where.propertyId = propertyId;
    if (tenantId) where.tenantId = tenantId;
    if (ownerId) where.ownerId = ownerId;

    if (search) {
      where.OR = [
        { property: { title: { contains: search, mode: "insensitive" } } },
        { tenant: { name: { contains: search, mode: "insensitive" } } },
        { owner: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    // Filtro de contratos expirando
    if (expiringDays) {
      const days = parseInt(expiringDays);
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);
      where.endDate = { lte: futureDate, gte: new Date() };
      where.status = "ACTIVE";
    }

    const [contracts, total] = await Promise.all([
      db.contract.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          property: {
            select: { id: true, title: true, street: true, city: true, state: true },
          },
          tenant: {
            select: { id: true, name: true, phone: true, whatsapp: true, email: true },
          },
          owner: {
            select: { id: true, name: true, phone: true, email: true },
          },
          _count: {
            select: { charges: true, clauses: true, documents: true },
          },
        },
      }),
      db.contract.count({ where }),
    ]);

    return paginatedResponse(contracts, total, page, limit);
  } catch (error: any) {
    console.error("Get contracts error:", error);
    return errorResponse("Erro interno do servidor", 500);
  }
}

// ─── POST /api/contracts ──────────────────────────────────────────
export async function POST(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (!auth) return unauthorizedResponse();

  try {
    const body = await req.json();

    const missing = validateRequired(body, [
      "propertyId", "tenantId", "ownerId",
      "startDate", "endDate", "rentValue", "paymentDay",
    ]);
    if (missing.length > 0) {
      return errorResponse(`Campos obrigatórios: ${missing.join(", ")}`, 400);
    }

    // Verificar se as entidades pertencem ao usuário
    const [property, tenant, owner] = await Promise.all([
      db.property.findFirst({ where: { id: body.propertyId, userId: auth.userId } }),
      db.tenant.findFirst({ where: { id: body.tenantId, userId: auth.userId } }),
      db.owner.findFirst({ where: { id: body.ownerId, userId: auth.userId } }),
    ]);

    if (!property) return errorResponse("Imóvel não encontrado", 404);
    if (!tenant) return errorResponse("Inquilino não encontrado", 404);
    if (!owner) return errorResponse("Proprietário não encontrado", 404);

    // Verificar se o imóvel já tem contrato ativo
    const activeContract = await db.contract.findFirst({
      where: { propertyId: body.propertyId, status: "ACTIVE" },
    });
    if (activeContract) {
      return errorResponse("Este imóvel já possui um contrato ativo", 409);
    }

    // Criar contrato com cláusulas
    const contract = await db.contract.create({
      data: {
        userId: auth.userId,
        propertyId: body.propertyId,
        tenantId: body.tenantId,
        ownerId: body.ownerId,
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
        rentValue: body.rentValue,
        condoFee: body.condoFee,
        iptu: body.iptu,
        depositValue: body.depositValue || 0,
        depositType: ((body.depositType as string) || "CASH").toUpperCase() as any,
        paymentDay: body.paymentDay,
        readjustmentIndex: ((body.readjustmentIndex as string) || "IGPM").toUpperCase() as any,
        readjustmentMonth: body.readjustmentMonth || 12,
        status: ((body.status as string) || "ACTIVE").toUpperCase() as any,
        clauses: body.clauses?.length > 0
          ? {
              create: body.clauses.map((c: any, idx: number) => ({
                title: c.title,
                content: c.content,
                order: c.order ?? idx,
              })),
            }
          : undefined,
      },
      include: {
        property: { select: { id: true, title: true } },
        tenant: { select: { id: true, name: true } },
        owner: { select: { id: true, name: true } },
        clauses: true,
      },
    });

    // Atualizar status do imóvel para "alugado" se contrato ativo
    if (contract.status === "ACTIVE") {
      await db.property.update({
        where: { id: body.propertyId },
        data: { status: "RENTED" },
      });
    }

    await createHistoryLog(
      db,
      auth.userId,
      "CONTRACT",
      contract.id,
      "CREATE",
      `Contrato criado: ${property.title} → ${tenant.name}`
    );

    // Gerar cobranças automáticas se contrato ativo
    if (contract.status === "ACTIVE") {
      await generateChargesForContract(auth.userId, contract);
    }

    return successResponse(contract, 201);
  } catch (error: any) {
    console.error("Create contract error:", error);
    return errorResponse("Erro interno do servidor", 500);
  }
}

// ─── Helper: Gerar cobranças para contrato ────────────────────────
async function generateChargesForContract(userId: string, contract: any) {
  const startDate = new Date(contract.startDate);
  const endDate = new Date(contract.endDate);
  const charges: any[] = [];

  let current = new Date(startDate);
  current.setDate(contract.paymentDay);

  // Se o dia de pagamento já passou no mês de início, começa no próximo
  if (current < startDate) {
    current.setMonth(current.getMonth() + 1);
  }

  while (current <= endDate) {
    // Cobrança de aluguel
    charges.push({
      userId,
      contractId: contract.id,
      tenantId: contract.tenantId,
      propertyId: contract.propertyId,
      type: "RENT" as const,
      description: `Aluguel - ${current.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}`,
      value: contract.rentValue,
      dueDate: new Date(current),
      status: "PENDING" as const,
    });

    // Cobrança de condomínio se aplicável
    if (contract.condoFee && contract.condoFee > 0) {
      charges.push({
        userId,
        contractId: contract.id,
        tenantId: contract.tenantId,
        propertyId: contract.propertyId,
        type: "CONDO_FEE" as const,
        description: `Condomínio - ${current.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}`,
        value: contract.condoFee,
        dueDate: new Date(current),
        status: "PENDING" as const,
      });
    }

    // Cobrança de IPTU se aplicável (mensal)
    if (contract.iptu && contract.iptu > 0) {
      charges.push({
        userId,
        contractId: contract.id,
        tenantId: contract.tenantId,
        propertyId: contract.propertyId,
        type: "IPTU" as const,
        description: `IPTU - ${current.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}`,
        value: contract.iptu / 12, // IPTU dividido em 12 meses
        dueDate: new Date(current),
        status: "PENDING" as const,
      });
    }

    current.setMonth(current.getMonth() + 1);
  }

  if (charges.length > 0) {
    await db.charge.createMany({ data: charges });
  }

  return charges.length;
}
