import { NextResponse } from "next/server";

// ─── Sanitizar body: converte "" em undefined para campos opcionais ──
// Evita enviar strings vazias para campos enum do Prisma
export function sanitizeBody(body: Record<string, any>, enumFields: string[]): Record<string, any> {
  const cleaned = { ...body };
  for (const field of enumFields) {
    if (cleaned[field] === "" || cleaned[field] === undefined) {
      cleaned[field] = undefined;
    } else if (typeof cleaned[field] === "string") {
      cleaned[field] = cleaned[field].toUpperCase();
    }
  }
  return cleaned;
}

// Sanitizar dados de update: remove entries com "" para enum, faz uppercase e converte tipos
export function sanitizeUpdateData(
  data: Record<string, any>,
  enumFields: string[],
  dateFields: string[] = [],
  floatFields: string[] = []
): Record<string, any> {
  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue;
    if (enumFields.includes(key)) {
      if (value === "" || value === null) continue; // skip empty enums
      cleaned[key] = typeof value === "string" ? value.toUpperCase() : value;
    } else if (dateFields.includes(key)) {
      if (value === "" || value === null) continue;
      cleaned[key] = new Date(value);
    } else if (floatFields.includes(key)) {
      if (value === "" || value === null) continue;
      cleaned[key] = parseFloat(value);
    } else {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

// ─── Resposta padronizada de sucesso ──────────────────────────────
export function successResponse<T>(data: T, status = 200, extra?: Record<string, any>) {
  return NextResponse.json({ success: true, data, ...extra }, { status });
}

// ─── Resposta padronizada de lista com paginação ──────────────────
export function paginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
) {
  return NextResponse.json({
    success: true,
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  });
}

// ─── Resposta de erro padronizada ─────────────────────────────────
export function errorResponse(message: string, status = 400, errors?: Record<string, string[]>) {
  return NextResponse.json({ success: false, error: message, errors }, { status });
}

// ─── Parser de query params de paginação ──────────────────────────
export function parsePagination(searchParams: URLSearchParams) {
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

// ─── Parser de ordenação ──────────────────────────────────────────
export function parseSort(searchParams: URLSearchParams, allowedFields: string[]) {
  const sortBy = searchParams.get("sortBy") || "createdAt";
  const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";

  if (!allowedFields.includes(sortBy)) {
    return { orderBy: { createdAt: sortOrder as "asc" | "desc" } };
  }

  return { orderBy: { [sortBy]: sortOrder } };
}

// ─── Validação de campos obrigatórios ─────────────────────────────
export function validateRequired(data: Record<string, unknown>, fields: string[]): string[] {
  const missing: string[] = [];
  for (const field of fields) {
    if (data[field] === undefined || data[field] === null || data[field] === "") {
      missing.push(field);
    }
  }
  return missing;
}

// ─── Validação de email ───────────────────────────────────────────
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ─── Validação de CPF ─────────────────────────────────────────────
export function isValidCPF(cpf: string): boolean {
  const cleaned = cpf.replace(/\D/g, "");
  if (cleaned.length !== 11) return false;
  if (/^(\d)\1+$/.test(cleaned)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(cleaned[i]) * (10 - i);
  let remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  if (remainder !== parseInt(cleaned[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(cleaned[i]) * (11 - i);
  remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  return remainder === parseInt(cleaned[10]);
}

// ─── Validação de CNPJ ───────────────────────────────────────────
export function isValidCNPJ(cnpj: string): boolean {
  const cleaned = cnpj.replace(/\D/g, "");
  if (cleaned.length !== 14) return false;
  if (/^(\d)\1+$/.test(cleaned)) return false;

  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  let sum = 0;
  for (let i = 0; i < 12; i++) sum += parseInt(cleaned[i]) * weights1[i];
  let remainder = sum % 11;
  if (remainder < 2) remainder = 0;
  else remainder = 11 - remainder;
  if (remainder !== parseInt(cleaned[12])) return false;

  sum = 0;
  for (let i = 0; i < 13; i++) sum += parseInt(cleaned[i]) * weights2[i];
  remainder = sum % 11;
  if (remainder < 2) remainder = 0;
  else remainder = 11 - remainder;
  return remainder === parseInt(cleaned[13]);
}

// ─── Formatar valor em BRL ────────────────────────────────────────
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

// ─── Log de histórico helper ──────────────────────────────────────
export async function createHistoryLog(
  db: any,
  userId: string,
  entityType: string,
  entityId: string,
  action: string,
  description: string,
  oldValues?: Record<string, unknown>,
  newValues?: Record<string, unknown>
) {
  return db.historyLog.create({
    data: {
      userId,
      entityType,
      entityId,
      action,
      description,
      oldValues: oldValues || undefined,
      newValues: newValues || undefined,
    },
  });
}
