import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-helpers";

// ─── GET /api/admin/settings ───────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const settings = await db.systemSettings.findMany();
    const settingsMap: Record<string, string> = {};
    settings.forEach((s) => {
      settingsMap[s.key] = s.value;
    });

    return successResponse({
      stripeSecretKey: settingsMap.stripe_secret_key || "",
      stripeWebhookSecret: settingsMap.stripe_webhook_secret || "",
      stripePublishableKey: settingsMap.stripe_publishable_key || "",
      appName: settingsMap.app_name || "ImobiERP",
      appUrl: settingsMap.app_url || "",
      supportEmail: settingsMap.support_email || "suporte@imobierp.com",
      fromEmail: settingsMap.from_email || "",
      smtpHost: settingsMap.smtp_host || "",
      smtpPort: parseInt(settingsMap.smtp_port || "587"),
      trialDays: parseInt(settingsMap.trial_days || "7"),
      maintenanceMode: settingsMap.maintenance_mode === "true",
    });
  } catch (error: any) {
    console.error("[ADMIN] Settings get error:", error);
    return errorResponse("Erro ao carregar configurações", 500);
  }
}

// ─── PUT /api/admin/settings ───────────────────────────────────────
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();

    // Mapear campos do frontend para chaves do banco
    const keyMap: Record<string, { key: string; type: string }> = {
      stripeSecretKey: { key: "stripe_secret_key", type: "string" },
      stripeWebhookSecret: { key: "stripe_webhook_secret", type: "string" },
      stripePublishableKey: { key: "stripe_publishable_key", type: "string" },
      appName: { key: "app_name", type: "string" },
      appUrl: { key: "app_url", type: "string" },
      supportEmail: { key: "support_email", type: "string" },
      fromEmail: { key: "from_email", type: "string" },
      smtpHost: { key: "smtp_host", type: "string" },
      smtpPort: { key: "smtp_port", type: "number" },
      trialDays: { key: "trial_days", type: "number" },
      maintenanceMode: { key: "maintenance_mode", type: "boolean" },
    };

    const updates: Promise<any>[] = [];

    for (const [field, config] of Object.entries(keyMap)) {
      if (body[field] !== undefined) {
        const value = String(body[field]);
        updates.push(
          db.systemSettings.upsert({
            where: { key: config.key },
            update: { value, type: config.type },
            create: { key: config.key, value, type: config.type },
          })
        );
      }
    }

    await Promise.all(updates);

    return successResponse({ message: "Configurações salvas com sucesso" });
  } catch (error: any) {
    console.error("[ADMIN] Settings update error:", error);
    return errorResponse("Erro ao salvar configurações", 500);
  }
}
