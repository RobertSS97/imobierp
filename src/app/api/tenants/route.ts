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

// ─── GET /api/tenants ─────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (!auth) return unauthorizedResponse();

  try {
    const { searchParams } = new URL(req.url);
    const { page, limit, skip } = parsePagination(searchParams);
    const { orderBy } = parseSort(searchParams, ["name", "email", "cpf", "status", "createdAt"]);

    const where: any = { userId: auth.userId };

    const search = searchParams.get("search") || "";
    const status = searchParams.get("status");

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { cpf: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    if (status) where.status = status;

    const [tenants, total] = await Promise.all([
      db.tenant.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          _count: {
            select: { contracts: true, charges: true, documents: true },
          },
        },
      }),
      db.tenant.count({ where }),
    ]);

    return paginatedResponse(tenants, total, page, limit);
  } catch (error: any) {
    console.error("Get tenants error:", error);
    return errorResponse("Erro interno do servidor", 500);
  }
}

// ─── POST /api/tenants ────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (!auth) return unauthorizedResponse();

  try {
    const body = await req.json();

    const missing = validateRequired(body, ["name", "email", "phone", "cpf"]);
    if (missing.length > 0) {
      return errorResponse(`Campos obrigatórios: ${missing.join(", ")}`, 400);
    }

    // Verificar CPF duplicado
    const existingCpf = await db.tenant.findFirst({
      where: { userId: auth.userId, cpf: body.cpf },
    });
    if (existingCpf) {
      return errorResponse("Já existe um inquilino com este CPF", 409);
    }

    const tenant = await db.tenant.create({
      data: {
        userId: auth.userId,
        name: body.name,
        email: body.email,
        phone: body.phone,
        whatsapp: body.whatsapp,
        cpf: body.cpf,
        rg: body.rg,
        dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : undefined,
        maritalStatus: body.maritalStatus ? (body.maritalStatus as string).toUpperCase() as any : undefined,
        profession: body.profession,
        income: body.income ? parseFloat(body.income) : undefined,
        street: body.street,
        number: body.number,
        complement: body.complement,
        neighborhood: body.neighborhood,
        city: body.city,
        state: body.state,
        zipCode: body.zipCode,
        emergencyName: body.emergencyName,
        emergencyPhone: body.emergencyPhone,
        emergencyRelationship: body.emergencyRelationship,
        status: ((body.status as string) || "ACTIVE").toUpperCase() as any,
        notes: body.notes,
      },
    });

    await createHistoryLog(
      db,
      auth.userId,
      "TENANT",
      tenant.id,
      "CREATE",
      `Inquilino "${tenant.name}" cadastrado`
    );

    return successResponse(tenant, 201);
  } catch (error: any) {
    console.error("Create tenant error:", error);
    return errorResponse("Erro interno do servidor", 500);
  }
}
