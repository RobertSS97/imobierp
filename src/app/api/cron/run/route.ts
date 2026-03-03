import { NextRequest } from "next/server";
import { authenticateRequest, unauthorizedResponse } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-helpers";
import { runAllScheduledJobs, updateOverdueCharges, updateExpiredContracts, sendChargeReminders, sendOverdueAlerts, notifyExpiringContracts } from "@/lib/cron-jobs";

// ─── POST /api/cron/run ───────────────────────────────────────────
// Endpoint para executar jobs manualmente ou via cron externo (ex: Vercel Cron)
export async function POST(req: NextRequest) {
  try {
    // Verificar se é chamada via cron secret ou autenticada
    const cronSecret = req.headers.get("x-cron-secret");
    const expectedSecret = process.env.CRON_SECRET;

    // Se não tem cron secret, verificar auth normal (apenas admin)
    if (cronSecret !== expectedSecret) {
      const auth = await authenticateRequest(req);
      if (!auth) return unauthorizedResponse();
      if (auth.role !== "ADMIN") {
        return errorResponse("Apenas administradores podem executar jobs", 403);
      }
    }

    const body = await req.json().catch(() => ({}));
    const job = body.job || "all";

    let result;
    switch (job) {
      case "overdue-charges":
        result = { overdueCharges: await updateOverdueCharges() };
        break;
      case "expired-contracts":
        result = { expiredContracts: await updateExpiredContracts() };
        break;
      case "charge-reminders":
        result = { chargeReminders: await sendChargeReminders() };
        break;
      case "overdue-alerts":
        result = { overdueAlerts: await sendOverdueAlerts() };
        break;
      case "expiring-contracts":
        result = { expiringContracts: await notifyExpiringContracts() };
        break;
      case "all":
      default:
        result = await runAllScheduledJobs();
        break;
    }

    return successResponse({
      message: "Jobs executados com sucesso",
      results: result,
    });
  } catch (error: any) {
    console.error("Cron run error:", error);
    return errorResponse("Erro ao executar jobs", 500);
  }
}
