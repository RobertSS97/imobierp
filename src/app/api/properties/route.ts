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

// ─── GET /api/properties ──────────────────────────────────────────
export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (!auth) return unauthorizedResponse();

  try {
    const { searchParams } = new URL(req.url);
    const { page, limit, skip } = parsePagination(searchParams);
    const { orderBy } = parseSort(searchParams, [
      "title", "rentValue", "status", "type", "city", "createdAt",
    ]);

    const where: any = { userId: auth.userId };

    // Filtros
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const city = searchParams.get("city");
    const state = searchParams.get("state");
    const ownerId = searchParams.get("ownerId");
    const minRent = searchParams.get("minRent");
    const maxRent = searchParams.get("maxRent");
    const bedrooms = searchParams.get("bedrooms");

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { street: { contains: search, mode: "insensitive" } },
        { neighborhood: { contains: search, mode: "insensitive" } },
        { city: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status) where.status = status;
    if (type) where.type = type;
    if (city) where.city = { contains: city, mode: "insensitive" };
    if (state) where.state = state;
    if (ownerId) where.ownerId = ownerId;
    if (bedrooms) where.bedrooms = parseInt(bedrooms);

    if (minRent || maxRent) {
      where.rentValue = {};
      if (minRent) where.rentValue.gte = parseFloat(minRent);
      if (maxRent) where.rentValue.lte = parseFloat(maxRent);
    }

    const [properties, total] = await Promise.all([
      db.property.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          owner: {
            select: { id: true, name: true, phone: true },
          },
          _count: {
            select: { contracts: true, charges: true },
          },
        },
      }),
      db.property.count({ where }),
    ]);

    return paginatedResponse(properties, total, page, limit);
  } catch (error: any) {
    console.error("Get properties error:", error);
    return errorResponse("Erro interno do servidor", 500);
  }
}

// ─── POST /api/properties ─────────────────────────────────────────
export async function POST(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (!auth) return unauthorizedResponse();

  try {
    const body = await req.json();

    const missing = validateRequired(body, [
      "title", "type", "ownerId", "street", "number",
      "neighborhood", "city", "state", "zipCode", "rentValue",
    ]);
    if (missing.length > 0) {
      return errorResponse(`Campos obrigatórios: ${missing.join(", ")}`, 400);
    }

    // Verificar se o proprietário pertence ao usuário
    const owner = await db.owner.findFirst({
      where: { id: body.ownerId, userId: auth.userId },
    });
    if (!owner) {
      return errorResponse("Proprietário não encontrado", 404);
    }

    const property = await db.property.create({
      data: {
        userId: auth.userId,
        ownerId: body.ownerId,
        title: body.title,
        type: body.type,
        status: body.status || "AVAILABLE",
        street: body.street,
        number: body.number,
        complement: body.complement,
        neighborhood: body.neighborhood,
        city: body.city,
        state: body.state,
        zipCode: body.zipCode,
        bedrooms: body.bedrooms || 0,
        bathrooms: body.bathrooms || 0,
        parkingSpaces: body.parkingSpaces || 0,
        area: body.area || 0,
        rentValue: body.rentValue,
        condoFee: body.condoFee,
        iptu: body.iptu,
        description: body.description,
        amenities: body.amenities || [],
        images: body.images || [],
      },
      include: {
        owner: { select: { id: true, name: true } },
      },
    });

    await createHistoryLog(
      db,
      auth.userId,
      "PROPERTY",
      property.id,
      "CREATE",
      `Imóvel "${property.title}" cadastrado`
    );

    return successResponse(property, 201);
  } catch (error: any) {
    console.error("Create property error:", error);
    return errorResponse("Erro interno do servidor", 500);
  }
}
