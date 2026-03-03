import { NextRequest } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { authenticateRequest, unauthorizedResponse } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-helpers";

// ─── POST /api/documents/upload ───────────────────────────────────
// Upload de arquivos para armazenamento local (em produção usar S3/R2)
export async function POST(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (!auth) return unauthorizedResponse();

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return errorResponse("Nenhum arquivo enviado", 400);
    }

    // Validar tamanho (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return errorResponse("Arquivo muito grande. Máximo permitido: 10MB", 400);
    }

    // Validar tipo
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];

    if (!allowedTypes.includes(file.type)) {
      return errorResponse(
        "Tipo de arquivo não permitido. Permitidos: PDF, JPEG, PNG, WebP, DOC, DOCX, XLS, XLSX",
        400
      );
    }

    // Gerar nome único
    const ext = file.name.split(".").pop();
    const uniqueName = `${auth.userId}_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;

    // Criar diretório de uploads se não existir
    const uploadDir = join(process.cwd(), "public", "uploads", auth.userId);
    await mkdir(uploadDir, { recursive: true });

    // Salvar arquivo
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filePath = join(uploadDir, uniqueName);
    await writeFile(filePath, buffer);

    // URL relativa
    const url = `/uploads/${auth.userId}/${uniqueName}`;

    return successResponse({
      url,
      name: file.name,
      size: file.size,
      mimeType: file.type,
    }, 201);
  } catch (error: any) {
    console.error("Upload error:", error);
    return errorResponse("Erro ao fazer upload", 500);
  }
}
