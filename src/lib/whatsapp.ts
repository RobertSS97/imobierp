import { db } from "@/lib/db";

// ─── Serviço de WhatsApp (Evolution API / Z-API compatível) ──────
// Este serviço é flexível para integrar com:
// - Evolution API (open source)
// - Z-API
// - Baileys-based APIs
// - Qualquer API REST de WhatsApp

interface WhatsappConfig {
  apiUrl: string;
  apiKey: string;
  instanceName: string;
}

interface SendMessageParams {
  phone: string;
  message: string;
  userId: string;
  chargeId?: string;
  templateName?: string;
}

// ─── Formatar telefone para WhatsApp ──────────────────────────────
function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  // Se não começa com 55, adicionar código do Brasil
  if (!cleaned.startsWith("55")) {
    return `55${cleaned}`;
  }
  return cleaned;
}

// ─── Enviar mensagem via API ──────────────────────────────────────
async function sendWhatsappMessage(config: WhatsappConfig, params: SendMessageParams) {
  const formattedPhone = formatPhone(params.phone);

  try {
    // Evolution API format
    const response = await fetch(`${config.apiUrl}/message/sendText/${config.instanceName}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: config.apiKey,
      },
      body: JSON.stringify({
        number: formattedPhone,
        text: params.message,
      }),
    });

    const data = await response.json();

    // Registrar mensagem no log
    await db.whatsappMessage.create({
      data: {
        userId: params.userId,
        phone: formattedPhone,
        message: params.message,
        templateName: params.templateName,
        status: response.ok ? "SENT" : "FAILED",
        externalId: data?.key?.id || data?.messageId || null,
        errorMessage: response.ok ? null : JSON.stringify(data),
        chargeId: params.chargeId,
        sentAt: response.ok ? new Date() : null,
      },
    });

    return { success: response.ok, data, externalId: data?.key?.id };
  } catch (error: any) {
    // Registrar falha
    await db.whatsappMessage.create({
      data: {
        userId: params.userId,
        phone: formattedPhone,
        message: params.message,
        templateName: params.templateName,
        status: "FAILED",
        errorMessage: error.message,
        chargeId: params.chargeId,
      },
    });

    return { success: false, error: error.message };
  }
}

// ─── Templates de mensagem ────────────────────────────────────────
export function generateChargeMessage(data: {
  tenantName: string;
  propertyTitle: string;
  chargeDescription: string;
  value: number;
  dueDate: Date;
  companyName?: string;
  pixKey?: string;
}) {
  const formattedValue = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(data.value);

  const formattedDate = new Intl.DateTimeFormat("pt-BR").format(new Date(data.dueDate));

  let message = `🏠 *${data.companyName || "ImobiERP"}*\n\n`;
  message += `Olá, *${data.tenantName}*!\n\n`;
  message += `Segue o lembrete da sua cobrança:\n\n`;
  message += `📋 *${data.chargeDescription}*\n`;
  message += `🏡 Imóvel: ${data.propertyTitle}\n`;
  message += `💰 Valor: *${formattedValue}*\n`;
  message += `📅 Vencimento: *${formattedDate}*\n`;

  if (data.pixKey) {
    message += `\n💳 *Chave PIX:* ${data.pixKey}\n`;
  }

  message += `\nDúvidas? Entre em contato conosco.\n`;
  message += `\n_Mensagem automática - ${data.companyName || "ImobiERP"}_`;

  return message;
}

export function generateOverdueMessage(data: {
  tenantName: string;
  propertyTitle: string;
  chargeDescription: string;
  value: number;
  dueDate: Date;
  daysLate: number;
  penaltyValue?: number;
  totalValue?: number;
  companyName?: string;
  pixKey?: string;
}) {
  const formattedValue = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(data.value);

  const formattedTotal = data.totalValue
    ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(data.totalValue)
    : formattedValue;

  const formattedDate = new Intl.DateTimeFormat("pt-BR").format(new Date(data.dueDate));

  let message = `🏠 *${data.companyName || "ImobiERP"}*\n\n`;
  message += `⚠️ *AVISO DE ATRASO*\n\n`;
  message += `Olá, *${data.tenantName}*!\n\n`;
  message += `Identificamos que a cobrança abaixo está em atraso:\n\n`;
  message += `📋 *${data.chargeDescription}*\n`;
  message += `🏡 Imóvel: ${data.propertyTitle}\n`;
  message += `💰 Valor original: ${formattedValue}\n`;
  message += `📅 Vencimento: ${formattedDate}\n`;
  message += `⏰ Dias em atraso: *${data.daysLate} dia(s)*\n`;

  if (data.totalValue && data.totalValue > data.value) {
    message += `\n💰 *Valor atualizado (com multa/juros): ${formattedTotal}*\n`;
  }

  if (data.pixKey) {
    message += `\n💳 *Chave PIX:* ${data.pixKey}\n`;
  }

  message += `\nPor favor, regularize o pagamento o mais breve possível.\n`;
  message += `Dúvidas? Entre em contato conosco.\n`;
  message += `\n_Mensagem automática - ${data.companyName || "ImobiERP"}_`;

  return message;
}

export function generateWelcomeMessage(data: {
  tenantName: string;
  propertyTitle: string;
  propertyAddress: string;
  startDate: Date;
  rentValue: number;
  paymentDay: number;
  companyName?: string;
}) {
  const formattedValue = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(data.rentValue);

  const formattedDate = new Intl.DateTimeFormat("pt-BR").format(new Date(data.startDate));

  let message = `🏠 *${data.companyName || "ImobiERP"}*\n\n`;
  message += `🎉 *Bem-vindo(a)!*\n\n`;
  message += `Olá, *${data.tenantName}*!\n\n`;
  message += `Seja bem-vindo(a) ao seu novo imóvel:\n\n`;
  message += `🏡 *${data.propertyTitle}*\n`;
  message += `📍 ${data.propertyAddress}\n`;
  message += `📅 Início: ${formattedDate}\n`;
  message += `💰 Aluguel: ${formattedValue}\n`;
  message += `📆 Dia de vencimento: dia ${data.paymentDay}\n`;

  message += `\nDesejamos uma ótima estadia! 🏡✨\n`;
  message += `\n_${data.companyName || "ImobiERP"}_`;

  return message;
}

// ─── Enviar cobrança por WhatsApp ─────────────────────────────────
export async function sendChargeWhatsapp(userId: string, chargeId: string) {
  // Buscar dados do usuário (config de WhatsApp)
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      whatsappEnabled: true,
      whatsappApiUrl: true,
      whatsappApiKey: true,
      whatsappInstanceName: true,
      companyName: true,
      lateFeePercentage: true,
      interestPercentage: true,
    },
  });

  if (!user || !user.whatsappEnabled || !user.whatsappApiUrl || !user.whatsappApiKey) {
    return { success: false, error: "WhatsApp não configurado" };
  }

  // Buscar dados da cobrança
  const charge = await db.charge.findFirst({
    where: { id: chargeId, userId },
    include: {
      tenant: { select: { name: true, whatsapp: true, phone: true } },
      property: { select: { title: true, street: true, city: true } },
      contract: {
        select: {
          owner: { select: { pixKey: true } },
        },
      },
    },
  });

  if (!charge) {
    return { success: false, error: "Cobrança não encontrada" };
  }

  const phone = charge.tenant.whatsapp || charge.tenant.phone;
  if (!phone) {
    return { success: false, error: "Inquilino sem número de telefone/WhatsApp" };
  }

  // Determinar template baseado no status
  const isOverdue = charge.status === "OVERDUE" ||
    (charge.status === "PENDING" && new Date(charge.dueDate) < new Date());

  let message: string;
  let templateName: string;

  if (isOverdue) {
    const daysLate = Math.floor(
      (new Date().getTime() - new Date(charge.dueDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    const penalty = charge.value * (user.lateFeePercentage / 100);
    const interest = charge.value * (user.interestPercentage / 100) * (daysLate / 30);

    message = generateOverdueMessage({
      tenantName: charge.tenant.name,
      propertyTitle: charge.property.title,
      chargeDescription: charge.description,
      value: charge.value,
      dueDate: charge.dueDate,
      daysLate,
      penaltyValue: penalty,
      totalValue: charge.value + penalty + interest,
      companyName: user.companyName || undefined,
      pixKey: charge.contract?.owner?.pixKey || undefined,
    });
    templateName = "overdue_charge";
  } else {
    message = generateChargeMessage({
      tenantName: charge.tenant.name,
      propertyTitle: charge.property.title,
      chargeDescription: charge.description,
      value: charge.value,
      dueDate: charge.dueDate,
      companyName: user.companyName || undefined,
      pixKey: charge.contract?.owner?.pixKey || undefined,
    });
    templateName = "charge_reminder";
  }

  const config: WhatsappConfig = {
    apiUrl: user.whatsappApiUrl,
    apiKey: user.whatsappApiKey,
    instanceName: user.whatsappInstanceName || "default",
  };

  const result = await sendWhatsappMessage(config, {
    phone,
    message,
    userId,
    chargeId,
    templateName,
  });

  // Atualizar cobrança com status do WhatsApp
  if (result.success) {
    await db.charge.update({
      where: { id: chargeId },
      data: {
        whatsappSent: true,
        whatsappSentAt: new Date(),
        whatsappMessageId: result.externalId,
      },
    });
  }

  return result;
}

// ─── Enviar cobranças em massa ────────────────────────────────────
export async function sendBulkChargeWhatsapp(userId: string, chargeIds: string[]) {
  const results: any[] = [];

  for (const chargeId of chargeIds) {
    const result = await sendChargeWhatsapp(userId, chargeId);
    results.push({ chargeId, ...result });

    // Delay entre mensagens para evitar bloqueio
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  return {
    total: results.length,
    sent: results.filter((r) => r.success).length,
    failed: results.filter((r) => !r.success).length,
    results,
  };
}
