import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { authenticateRequest, unauthorizedResponse } from "@/lib/auth";
import {
  successResponse,
  errorResponse,
  paginatedResponse,
  parsePagination,
  createHistoryLog,
} from "@/lib/api-helpers";

// ─── GET /api/documents ───────────────────────────────────────────
export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (!auth) return unauthorizedResponse();

  try {
    const { searchParams } = new URL(req.url);
    const { page, limit, skip } = parsePagination(searchParams);

    const where: any = { userId: auth.userId };

    const type = searchParams.get("type");
    const tenantId = searchParams.get("tenantId");
    const contractId = searchParams.get("contractId");
    const search = searchParams.get("search") || "";

    if (type) where.type = type;
    if (tenantId) where.tenantId = tenantId;
    if (contractId) where.contractId = contractId;

    if (search) {
      where.name = { contains: search, mode: "insensitive" };
    }

    const [documents, total] = await Promise.all([
      db.document.findMany({
        where,
        orderBy: { uploadedAt: "desc" },
        skip,
        take: limit,
        include: {
          tenant: tenantId ? undefined : { select: { id: true, name: true } },
          contract: contractId
            ? undefined
            : {
                select: {
                  id: true,
                  property: { select: { title: true } },
                  tenant: { select: { name: true } },
                },
              },
        },
      }),
      db.document.count({ where }),
    ]);

    // Stats
    const stats = await db.document.groupBy({
      by: ["type"],
      where: { userId: auth.userId },
      _count: true,
      _sum: { size: true },
    });

    const totalSize = await db.document.aggregate({
      where: { userId: auth.userId },
      _sum: { size: true },
      _count: true,
    });

    return Response.json({
      success: true,
      data: documents,
      stats: {
        byType: stats,
        totalDocuments: totalSize._count,
        totalSize: totalSize._sum.size || 0,
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
    console.error("Get documents error:", error);
    return errorResponse("Erro interno do servidor", 500);
  }
}

// ─── POST /api/documents ──────────────────────────────────────────
export async function POST(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (!auth) return unauthorizedResponse();

  try {
    const body = await req.json();

    if (!body.name || !body.url || !body.type) {
      return errorResponse("Nome, URL e tipo são obrigatórios", 400);
    }

    const document = await db.document.create({
      data: {
        userId: auth.userId,
        name: body.name,
        type: body.type,
        url: body.url,
        size: body.size || 0,
        mimeType: body.mimeType || "application/octet-stream",
        tenantId: body.tenantId || null,
        contractId: body.contractId || null,
      },
    });

    await createHistoryLog(
      db,
      auth.userId,
      "DOCUMENT",
      document.id,
      "CREATE",
      `Documento "${document.name}" enviado`
    );

    return successResponse(document, 201);
  } catch (error: any) {
    console.error("Create document error:", error);
    return errorResponse("Erro interno do servidor", 500);
  }
}
