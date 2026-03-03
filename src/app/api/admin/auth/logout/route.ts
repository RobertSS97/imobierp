import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-helpers";

// ─── POST /api/admin/auth/logout ─────────────────────────────────
export async function POST(_req: NextRequest) {
  const res = new Response(
    JSON.stringify({ success: true, data: { message: "Logout realizado" } }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );

  // Limpar cookie
  res.headers.set(
    "Set-Cookie",
    "imobierp_admin_token=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0"
  );

  return res;
}
