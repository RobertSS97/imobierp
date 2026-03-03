import { db } from "@/lib/db";
import { sendChargeWhatsapp } from "@/lib/whatsapp";

// ─── Job: Atualizar status de cobranças vencidas ──────────────────
export async function updateOverdueCharges() {
  console.log("[CRON] Verificando cobranças vencidas...");

  try {
    const result = await db.charge.updateMany({
      where: {
        status: "PENDING",
        dueDate: { lt: new Date() },
      },
      data: { status: "OVERDUE" },
    });

    console.log(`[CRON] ${result.count} cobranças marcadas como vencidas`);
    return result.count;
  } catch (error) {
    console.error("[CRON] Erro ao atualizar cobranças vencidas:", error);
    return 0;
  }
}

// ─── Job: Verificar contratos expirados ───────────────────────────
export async function updateExpiredContracts() {
  console.log("[CRON] Verificando contratos expirados...");

  try {
    const expiredContracts = await db.contract.findMany({
      where: {
        status: "ACTIVE",
        endDate: { lt: new Date() },
      },
      select: { id: true, propertyId: true },
    });

    for (const contract of expiredContracts) {
      await db.contract.update({
        where: { id: contract.id },
        data: { status: "EXPIRED" },
      });

      // Verificar se não há outro contrato ativo para o imóvel
      const activeCount = await db.contract.count({
        where: { propertyId: contract.propertyId, status: "ACTIVE" },
      });

      if (activeCount === 0) {
        await db.property.update({
          where: { id: contract.propertyId },
          data: { status: "AVAILABLE" },
        });
      }
    }

    console.log(`[CRON] ${expiredContracts.length} contratos marcados como expirados`);
    return expiredContracts.length;
  } catch (error) {
    console.error("[CRON] Erro ao atualizar contratos expirados:", error);
    return 0;
  }
}

// ─── Job: Enviar lembretes via WhatsApp (cobranças próximas ao vencimento) ──
export async function sendChargeReminders() {
  console.log("[CRON] Enviando lembretes de cobrança via WhatsApp...");

  try {
    // Buscar usuários com WhatsApp e cobrança automática habilitados
    const users = await db.user.findMany({
      where: {
        whatsappEnabled: true,
        autoChargeEnabled: true,
        whatsappApiUrl: { not: null },
        whatsappApiKey: { not: null },
      },
      select: { id: true, autoChargeDay: true },
    });

    let totalSent = 0;

    for (const user of users) {
      // Buscar cobranças que vencem nos próximos X dias (configurável)
      const reminderDate = new Date();
      reminderDate.setDate(reminderDate.getDate() + user.autoChargeDay);

      const charges = await db.charge.findMany({
        where: {
          userId: user.id,
          status: "PENDING",
          whatsappSent: false,
          dueDate: {
            gte: new Date(),
            lte: reminderDate,
          },
        },
        select: { id: true },
      });

      for (const charge of charges) {
        try {
          await sendChargeWhatsapp(user.id, charge.id);
          totalSent++;
          // Delay entre mensagens
          await new Promise((resolve) => setTimeout(resolve, 3000));
        } catch (error) {
          console.error(`[CRON] Erro ao enviar WhatsApp para cobrança ${charge.id}:`, error);
        }
      }
    }

    console.log(`[CRON] ${totalSent} lembretes enviados via WhatsApp`);
    return totalSent;
  } catch (error) {
    console.error("[CRON] Erro ao enviar lembretes:", error);
    return 0;
  }
}

// ─── Job: Enviar alertas de cobranças vencidas via WhatsApp ───────
export async function sendOverdueAlerts() {
  console.log("[CRON] Enviando alertas de cobranças vencidas...");

  try {
    const users = await db.user.findMany({
      where: {
        whatsappEnabled: true,
        whatsappApiUrl: { not: null },
        whatsappApiKey: { not: null },
      },
      select: { id: true },
    });

    let totalSent = 0;

    for (const user of users) {
      // Buscar cobranças vencidas que não receberam alerta recente
      const charges = await db.charge.findMany({
        where: {
          userId: user.id,
          status: "OVERDUE",
          OR: [
            { whatsappSent: false },
            {
              whatsappSentAt: {
                lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Mais de 7 dias desde último envio
              },
            },
          ],
        },
        select: { id: true },
      });

      for (const charge of charges) {
        try {
          await sendChargeWhatsapp(user.id, charge.id);
          totalSent++;
          await new Promise((resolve) => setTimeout(resolve, 3000));
        } catch (error) {
          console.error(`[CRON] Erro ao enviar alerta de atraso para ${charge.id}:`, error);
        }
      }
    }

    console.log(`[CRON] ${totalSent} alertas de atraso enviados`);
    return totalSent;
  } catch (error) {
    console.error("[CRON] Erro ao enviar alertas de atraso:", error);
    return 0;
  }
}

// ─── Job: Criar notificações para contratos próximos ao vencimento ─
export async function notifyExpiringContracts() {
  console.log("[CRON] Verificando contratos próximos ao vencimento...");

  try {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const expiringContracts = await db.contract.findMany({
      where: {
        status: "ACTIVE",
        endDate: {
          gte: new Date(),
          lte: thirtyDaysFromNow,
        },
      },
      include: {
        property: { select: { title: true } },
        tenant: { select: { name: true } },
      },
    });

    for (const contract of expiringContracts) {
      const daysUntilExpiry = Math.ceil(
        (contract.endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );

      // Verificar se já existe notificação recente para este contrato
      const existingNotification = await db.notification.findFirst({
        where: {
          userId: contract.userId,
          link: `/contratos?id=${contract.id}`,
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      });

      if (!existingNotification) {
        await db.notification.create({
          data: {
            userId: contract.userId,
            title: "Contrato próximo ao vencimento",
            message: `O contrato de ${contract.property.title} com ${contract.tenant.name} vence em ${daysUntilExpiry} dias.`,
            type: "WARNING",
            link: `/contratos?id=${contract.id}`,
          },
        });
      }
    }

    console.log(`[CRON] ${expiringContracts.length} contratos próximos ao vencimento`);
    return expiringContracts.length;
  } catch (error) {
    console.error("[CRON] Erro ao notificar contratos:", error);
    return 0;
  }
}

// ─── Executar todos os jobs ───────────────────────────────────────
export async function runAllScheduledJobs() {
  console.log("[CRON] Iniciando execução dos jobs agendados...");

  const results = {
    overdueCharges: await updateOverdueCharges(),
    expiredContracts: await updateExpiredContracts(),
    chargeReminders: await sendChargeReminders(),
    overdueAlerts: await sendOverdueAlerts(),
    expiringContracts: await notifyExpiringContracts(),
  };

  console.log("[CRON] Jobs concluídos:", results);
  return results;
}
