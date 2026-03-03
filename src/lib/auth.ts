import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { db } from "./db";
import { NextRequest } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

if (!JWT_SECRET || !JWT_REFRESH_SECRET) {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "FATAL: JWT_SECRET e JWT_REFRESH_SECRET devem ser configurados nas variáveis de ambiente."
    );
  }
}

// Non-null assertion safe after check above (dev: uses fallback)
const getJwtSecret = (): string => JWT_SECRET || "dev-only-insecure-fallback";
const getRefreshSecret = (): string => JWT_REFRESH_SECRET || "dev-only-insecure-refresh-fallback";
const JWT_EXPIRES_IN = "1h";
const JWT_REFRESH_EXPIRES_IN = "7d";

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  plan: string;
}

// ─── Hash de senha ────────────────────────────────────────────────
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ─── Tokens JWT ───────────────────────────────────────────────────
export function generateAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: JWT_EXPIRES_IN });
}

export function generateRefreshToken(payload: JwtPayload): string {
  return jwt.sign(payload, getRefreshSecret(), { expiresIn: JWT_REFRESH_EXPIRES_IN });
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, getJwtSecret()) as unknown as JwtPayload;
}

export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, getRefreshSecret()) as unknown as JwtPayload;
}

// ─── Middleware de autenticação ───────────────────────────────────
export async function authenticateRequest(req: NextRequest): Promise<{
  userId: string;
  email: string;
  role: string;
  plan: string;
} | null> {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return null;
    }

    const token = authHeader.substring(7);
    const payload = verifyAccessToken(token);

    // Verificar se o usuário ainda existe e está ativo
    const user = await db.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, role: true, plan: true, isActive: true },
    });

    if (!user || !user.isActive) {
      return null;
    }

    return {
      userId: user.id,
      email: user.email,
      role: user.role,
      plan: user.plan,
    };
  } catch {
    return null;
  }
}

// ─── Helper para respostas de erro de autenticação ────────────────
export function unauthorizedResponse(message = "Não autorizado") {
  return Response.json({ error: message }, { status: 401 });
}

export function forbiddenResponse(message = "Acesso negado") {
  return Response.json({ error: message }, { status: 403 });
}

// ─── Geração de token de reset de senha ───────────────────────────
export function generateResetToken(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 64; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
