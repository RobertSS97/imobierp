import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { comparePassword, hashPassword } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-helpers";
import jwt from "jsonwebtoken";

const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET || "CHANGE-ME";
const ADMIN_JWT_EXPIRES = "8h";

// ─── POST /api/admin/auth/login ────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return errorResponse("Email e senha são obrigatórios", 400);
    }

    // Buscar admin no banco
    const admin = await db.adminUser.findUnique({ where: { email } });
    if (!admin || !admin.isActive) {
      // Log attempt
      console.warn(`[ADMIN AUTH] Failed login attempt for: ${email} from ${req.headers.get("x-forwarded-for") || "unknown"}`);
      return errorResponse("Credenciais inválidas", 401);
    }

    const valid = await comparePassword(password, admin.passwordHash);
    if (!valid) {
      console.warn(`[ADMIN AUTH] Wrong password for: ${email} from ${req.headers.get("x-forwarded-for") || "unknown"}`);
      return errorResponse("Credenciais inválidas", 401);
    }

    // Gerar token admin
    const token = jwt.sign(
      { adminId: admin.id, email: admin.email, role: "superadmin" },
      ADMIN_JWT_SECRET,
      { expiresIn: ADMIN_JWT_EXPIRES }
    );

    // Atualizar último login
    await db.adminUser.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });

    console.log(`[ADMIN AUTH] Successful login: ${email}`);

    const response = successResponse({
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
      },
      token,
    });

    // Set HttpOnly cookie para proteção do middleware
    const res = new Response(response.body, response);
    res.headers.set(
      "Set-Cookie",
      `imobierp_admin_token=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${8 * 60 * 60}${process.env.NODE_ENV === "production" ? "; Secure" : ""}`
    );

    return res;
  } catch (error: any) {
    console.error("[ADMIN AUTH] Login error:", error);
    return errorResponse("Erro interno do servidor", 500);
  }
}
