import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...\n");

  // ─── Admin User ──────────────────────────────────────────────────
  const adminEmail = process.env.ADMIN_EMAIL || "admin@imobierp.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin@2024!";
  const adminName = process.env.ADMIN_NAME || "Robert";

  const existingAdmin = await prisma.adminUser.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    await prisma.adminUser.create({
      data: {
        email: adminEmail,
        name: adminName,
        passwordHash,
        isActive: true,
      },
    });
    console.log(`✅ Admin criado: ${adminEmail}`);
    console.log(`   Senha: ${adminPassword}`);
  } else {
    console.log(`⏭️  Admin já existe: ${adminEmail}`);
  }

  // ─── Planos padrão ──────────────────────────────────────────────
  const plans = [
    {
      name: "Starter",
      slug: "starter",
      description: "Para corretores autônomos e pequenas imobiliárias",
      price: 49.90,
      billingCycle: "MONTHLY" as const,
      isActive: true,
      isPopular: false,
      sortOrder: 1,
      maxProperties: 15,
      maxTenants: 15,
      maxOwners: 10,
      maxContracts: 15,
      maxUsers: 1,
      features: [
        "Até 15 imóveis",
        "Até 15 inquilinos",
        "Contratos digitais",
        "Cobranças automáticas",
        "Relatórios básicos",
        "Suporte por email",
      ],
    },
    {
      name: "Professional",
      slug: "professional",
      description: "Para imobiliárias em crescimento",
      price: 99.90,
      billingCycle: "MONTHLY" as const,
      isActive: true,
      isPopular: true,
      sortOrder: 2,
      maxProperties: 50,
      maxTenants: 50,
      maxOwners: 30,
      maxContracts: 50,
      maxUsers: 3,
      features: [
        "Até 50 imóveis",
        "Até 50 inquilinos",
        "Contratos digitais",
        "Cobranças automáticas",
        "Relatórios avançados",
        "WhatsApp integrado",
        "Documentos ilimitados",
        "Suporte prioritário",
      ],
    },
    {
      name: "Enterprise",
      slug: "enterprise",
      description: "Para grandes imobiliárias e redes",
      price: 199.90,
      billingCycle: "MONTHLY" as const,
      isActive: true,
      isPopular: false,
      sortOrder: 3,
      maxProperties: 999,
      maxTenants: 999,
      maxOwners: 999,
      maxContracts: 999,
      maxUsers: 10,
      features: [
        "Imóveis ilimitados",
        "Inquilinos ilimitados",
        "Contratos digitais",
        "Cobranças automáticas",
        "Relatórios avançados",
        "WhatsApp integrado",
        "Documentos ilimitados",
        "API personalizada",
        "Multi-usuários",
        "Suporte dedicado 24/7",
      ],
    },
  ];

  for (const plan of plans) {
    const existing = await prisma.subscriptionPlan.findUnique({
      where: { slug: plan.slug },
    });
    if (!existing) {
      await prisma.subscriptionPlan.create({ data: plan });
      console.log(`✅ Plano criado: ${plan.name} - R$ ${plan.price}/mês`);
    } else {
      console.log(`⏭️  Plano já existe: ${plan.name}`);
    }
  }

  // ─── Configurações do sistema ─────────────────────────────────
  const settings = [
    { key: "trial_days", value: "7", type: "number" },
    { key: "app_name", value: "ImobiERP", type: "string" },
    { key: "support_email", value: "suporte@imobierp.com", type: "string" },
    { key: "require_email_verification", value: "false", type: "boolean" },
    { key: "maintenance_mode", value: "false", type: "boolean" },
    { key: "stripe_enabled", value: "false", type: "boolean" },
  ];

  for (const setting of settings) {
    await prisma.systemSettings.upsert({
      where: { key: setting.key },
      update: { value: setting.value, type: setting.type },
      create: { key: setting.key, value: setting.value, type: setting.type },
    });
    console.log(`✅ Configuração: ${setting.key} = ${setting.value}`);
  }

  console.log("\n🎉 Seed concluído com sucesso!");
  console.log("\n📋 Resumo:");
  console.log(`   Admin: ${adminEmail}`);
  console.log(`   Planos: ${plans.length} criados`);
  console.log(`   Configurações: ${settings.length} definidas`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Erro no seed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
