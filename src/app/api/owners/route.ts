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
  sanitizeBody,
} from "@/lib/api-helpers";

// ─── GET /api/owners ──────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (!auth) return unauthorizedResponse();

  try {
    const { searchParams } = new URL(req.url);
    const { page, limit, skip } = parsePagination(searchParams);
    const { orderBy } = parseSort(searchParams, ["name", "email", "cpfCnpj", "status", "createdAt"]);

    // Filtros
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status");

    const where: any = { userId: auth.userId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { cpfCnpj: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    if (status) {
      where.status = status;
    }

    const [owners, total] = await Promise.all([
      db.owner.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          _count: {
            select: { properties: true, contracts: true },
          },
        },
      }),
      db.owner.count({ where }),
    ]);

    return paginatedResponse(owners, total, page, limit);
  } catch (error: any) {
    console.error("Get owners error:", error);
    return errorResponse("Erro interno do servidor", 500);
  }
}

// ─── POST /api/owners ─────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (!auth) return unauthorizedResponse();

  try {
    const body = await req.json();

    const missing = validateRequired(body, ["name", "email", "phone", "cpfCnpj"]);
    if (missing.length > 0) {
      return errorResponse(`Campos obrigatórios: ${missing.join(", ")}`, 400);
    }

    // Verificar CPF/CNPJ duplicado para este user
    const existingCpf = await db.owner.findFirst({
      where: { userId: auth.userId, cpfCnpj: body.cpfCnpj },
    });
    if (existingCpf) {
      return errorResponse("Já existe um proprietário com este CPF/CNPJ", 409);
    }

    const safe = sanitizeBody(body, ["bankAccountType", "status"]);

    const owner = await db.owner.create({
      data: {
        userId: auth.userId,
        name: body.name,
        email: body.email,
        phone: body.phone,
        whatsapp: body.whatsapp || undefined,
        cpfCnpj: body.cpfCnpj,
        rg: body.rg || undefined,
        street: body.street || undefined,
        number: body.number || undefined,
        complement: body.complement || undefined,
        neighborhood: body.neighborhood || undefined,
        city: body.city || undefined,
        state: body.state || undefined,
        zipCode: body.zipCode || undefined,
        bankName: body.bankName || undefined,
        bankAgency: body.bankAgency || undefined,
        bankAccount: body.bankAccount || undefined,
        bankAccountType: safe.bankAccountType || undefined,
        pixKey: body.pixKey || undefined,
        status: safe.status || "ACTIVE",
        notes: body.notes || undefined,
      },
    });

    // Registrar no histórico
    await createHistoryLog(
      db,
      auth.userId,
      "OWNER",
      owner.id,
      "CREATE",
      `Proprietário "${owner.name}" cadastrado`
    );

    return successResponse(owner, 201);
  } catch (error: any) {
    console.error("Create owner error:", error);
    return errorResponse("Erro interno do servidor", 500);
  }
}
