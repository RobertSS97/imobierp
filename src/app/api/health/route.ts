import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// ─── GET /api/health ──────────────────────────────────────────────
export async function GET() {
  try {
    // Testar conexão com o banco
    await db.$queryRaw`SELECT 1`;

    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || "1.0.0",
      database: "connected",
      uptime: process.uptime(),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        database: "disconnected",
        error: error.message,
      },
      { status: 503 }
    );
  }
}
