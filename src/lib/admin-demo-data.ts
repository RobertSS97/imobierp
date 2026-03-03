// ─── Dados de demonstração do Painel Administrativo ─────────────

export const ADMIN_USER = {
  id: "superadmin-1",
  name: "Admin Master",
  email: "admin@imobierp.com.br",
  role: "superadmin",
  avatar: null,
  createdAt: "2023-01-01T00:00:00.000Z",
};

// ─── Planos ──────────────────────────────────────────────────────
export const PLANS = [
  {
    id: "plan-starter",
    name: "Starter",
    slug: "starter",
    stripeProductId: "prod_starter_xxx",
    stripePriceIdMonthly: "price_starter_monthly_xxx",
    stripePriceIdYearly: "price_starter_yearly_xxx",
    priceMonthly: 9900, // centavos
    priceYearly: 99900,
    active: true,
    popular: false,
    trialDays: 14,
    limits: {
      properties: 10,
      tenants: 10,
      owners: 5,
      contracts: 10,
      users: 1,
      storageGB: 1,
      whatsapp: false,
      reports: false,
      api: false,
    },
    features: [
      "Até 10 imóveis",
      "Até 10 inquilinos",
      "Até 5 proprietários",
      "1 usuário",
      "1 GB de armazenamento",
      "Cobranças e boletos",
      "Suporte por e-mail",
    ],
    subscribersCount: 48,
    mrr: 475200,
    createdAt: "2023-01-01T00:00:00.000Z",
    updatedAt: "2026-01-15T00:00:00.000Z",
  },
  {
    id: "plan-professional",
    name: "Profissional",
    slug: "professional",
    stripeProductId: "prod_professional_xxx",
    stripePriceIdMonthly: "price_pro_monthly_xxx",
    stripePriceIdYearly: "price_pro_yearly_xxx",
    priceMonthly: 19900,
    priceYearly: 199900,
    active: true,
    popular: true,
    trialDays: 14,
    limits: {
      properties: 50,
      tenants: 50,
      owners: 20,
      contracts: 50,
      users: 3,
      storageGB: 5,
      whatsapp: true,
      reports: true,
      api: false,
    },
    features: [
      "Até 50 imóveis",
      "Até 50 inquilinos",
      "Até 20 proprietários",
      "3 usuários",
      "5 GB de armazenamento",
      "Integração WhatsApp",
      "Relatórios avançados",
      "Suporte prioritário",
    ],
    subscribersCount: 124,
    mrr: 2467600,
    createdAt: "2023-01-01T00:00:00.000Z",
    updatedAt: "2026-02-20T00:00:00.000Z",
  },
  {
    id: "plan-enterprise",
    name: "Enterprise",
    slug: "enterprise",
    stripeProductId: "prod_enterprise_xxx",
    stripePriceIdMonthly: "price_ent_monthly_xxx",
    stripePriceIdYearly: "price_ent_yearly_xxx",
    priceMonthly: 49900,
    priceYearly: 499900,
    active: true,
    popular: false,
    trialDays: 30,
    limits: {
      properties: -1,
      tenants: -1,
      owners: -1,
      contracts: -1,
      users: -1,
      storageGB: 50,
      whatsapp: true,
      reports: true,
      api: true,
    },
    features: [
      "Imóveis ilimitados",
      "Inquilinos ilimitados",
      "Proprietários ilimitados",
      "Usuários ilimitados",
      "50 GB de armazenamento",
      "Integração WhatsApp",
      "Relatórios avançados",
      "Acesso à API",
      "Suporte dedicado 24/7",
      "Onboarding personalizado",
    ],
    subscribersCount: 31,
    mrr: 1546900,
    createdAt: "2023-01-01T00:00:00.000Z",
    updatedAt: "2026-03-01T00:00:00.000Z",
  },
];

// ─── Clientes (usuários SaaS) ────────────────────────────────────
export const CUSTOMERS = [
  {
    id: "cust-1",
    name: "Roberto Almeida",
    email: "roberto@imobierp.com.br",
    phone: "(11) 99999-0001",
    companyName: "Almeida Imóveis",
    planId: "plan-professional",
    planName: "Profissional",
    status: "active" as const,
    stripeCustomerId: "cus_almeida_xxx",
    subscriptionStatus: "active" as const,
    currentPeriodEnd: "2026-04-01T00:00:00.000Z",
    propertiesCount: 18,
    tenantsCount: 14,
    usage: { properties: 18, tenants: 14, owners: 6, contracts: 12, storageUsedMB: 340 },
    totalPaid: 437800,
    lastPayment: "2026-03-01T00:00:00.000Z",
    createdAt: "2024-01-15T00:00:00.000Z",
  },
  {
    id: "cust-2",
    name: "Mariana Costa",
    email: "mariana@costaimoveis.com.br",
    phone: "(21) 98877-4455",
    companyName: "Costa Imóveis LTDA",
    planId: "plan-enterprise",
    planName: "Enterprise",
    status: "active" as const,
    stripeCustomerId: "cus_costa_xxx",
    subscriptionStatus: "active" as const,
    currentPeriodEnd: "2026-03-15T00:00:00.000Z",
    propertiesCount: 87,
    tenantsCount: 72,
    usage: { properties: 87, tenants: 72, owners: 15, contracts: 68, storageUsedMB: 2100 },
    totalPaid: 1098000,
    lastPayment: "2026-02-15T00:00:00.000Z",
    createdAt: "2023-06-20T00:00:00.000Z",
  },
  {
    id: "cust-3",
    name: "Felipe Rodrigues",
    email: "felipe@frimob.com.br",
    phone: "(31) 97766-3322",
    companyName: "FR Imobiliária",
    planId: "plan-starter",
    planName: "Starter",
    status: "active" as const,
    stripeCustomerId: "cus_fr_xxx",
    subscriptionStatus: "active" as const,
    currentPeriodEnd: "2026-03-20T00:00:00.000Z",
    propertiesCount: 8,
    tenantsCount: 6,
    usage: { properties: 8, tenants: 6, owners: 3, contracts: 5, storageUsedMB: 120 },
    totalPaid: 118800,
    lastPayment: "2026-02-20T00:00:00.000Z",
    createdAt: "2025-01-10T00:00:00.000Z",
  },
  {
    id: "cust-4",
    name: "Sandra Lima",
    email: "sandra@limaimob.com",
    phone: "(41) 96655-1100",
    companyName: "Lima Administradora",
    planId: "plan-professional",
    planName: "Profissional",
    status: "active" as const,
    stripeCustomerId: "cus_lima_xxx",
    subscriptionStatus: "past_due" as const,
    currentPeriodEnd: "2026-02-28T00:00:00.000Z",
    propertiesCount: 35,
    tenantsCount: 28,
    usage: { properties: 35, tenants: 28, owners: 10, contracts: 25, storageUsedMB: 890 },
    totalPaid: 358200,
    lastPayment: "2026-01-28T00:00:00.000Z",
    createdAt: "2024-05-01T00:00:00.000Z",
  },
  {
    id: "cust-5",
    name: "Eduardo Santos",
    email: "eduardo@esimob.com.br",
    phone: "(51) 99988-7766",
    companyName: "ES Gestão Imobiliária",
    planId: "plan-professional",
    planName: "Profissional",
    status: "active" as const,
    stripeCustomerId: "cus_es_xxx",
    subscriptionStatus: "active" as const,
    currentPeriodEnd: "2026-04-05T00:00:00.000Z",
    propertiesCount: 42,
    tenantsCount: 38,
    usage: { properties: 42, tenants: 38, owners: 12, contracts: 35, storageUsedMB: 1340 },
    totalPaid: 597000,
    lastPayment: "2026-03-01T00:00:00.000Z",
    createdAt: "2023-11-15T00:00:00.000Z",
  },
  {
    id: "cust-6",
    name: "Camila Torres",
    email: "camila@torresimob.com",
    phone: "(11) 95544-3322",
    companyName: "Torres Corretora",
    planId: "plan-starter",
    planName: "Starter",
    status: "inactive" as const,
    stripeCustomerId: "cus_torres_xxx",
    subscriptionStatus: "canceled" as const,
    currentPeriodEnd: "2026-01-15T00:00:00.000Z",
    propertiesCount: 5,
    tenantsCount: 3,
    usage: { properties: 5, tenants: 3, owners: 2, contracts: 3, storageUsedMB: 50 },
    totalPaid: 59400,
    lastPayment: "2025-12-15T00:00:00.000Z",
    createdAt: "2025-07-01T00:00:00.000Z",
  },
  {
    id: "cust-7",
    name: "André Moreira",
    email: "andre@amimob.com.br",
    phone: "(61) 98877-5533",
    companyName: "AM Imóveis Brasília",
    planId: "plan-enterprise",
    planName: "Enterprise",
    status: "active" as const,
    stripeCustomerId: "cus_am_xxx",
    subscriptionStatus: "active" as const,
    currentPeriodEnd: "2026-03-25T00:00:00.000Z",
    propertiesCount: 156,
    tenantsCount: 132,
    usage: { properties: 156, tenants: 132, owners: 28, contracts: 120, storageUsedMB: 8400 },
    totalPaid: 1497000,
    lastPayment: "2026-02-25T00:00:00.000Z",
    createdAt: "2023-03-10T00:00:00.000Z",
  },
  {
    id: "cust-8",
    name: "Juliana Peixoto",
    email: "juliana@jpgestao.com",
    phone: "(71) 97766-8899",
    companyName: "JP Gestão Imobiliária",
    planId: "plan-starter",
    planName: "Starter",
    status: "trialing" as const,
    stripeCustomerId: "cus_jp_xxx",
    subscriptionStatus: "trialing" as const,
    currentPeriodEnd: "2026-03-15T00:00:00.000Z",
    propertiesCount: 2,
    tenantsCount: 1,
    usage: { properties: 2, tenants: 1, owners: 1, contracts: 1, storageUsedMB: 15 },
    totalPaid: 0,
    lastPayment: null,
    createdAt: "2026-03-01T00:00:00.000Z",
  },
];

// ─── Pagamentos / Transações ─────────────────────────────────────
export const PAYMENTS = [
  { id: "pay-1", customerId: "cust-1", customerName: "Roberto Almeida", companyName: "Almeida Imóveis", planName: "Profissional", amount: 19900, currency: "brl", status: "succeeded" as const, stripeInvoiceId: "in_xxx1", stripePaymentIntentId: "pi_xxx1", method: "credit_card", cardLast4: "4242", createdAt: "2026-03-01T10:00:00.000Z" },
  { id: "pay-2", customerId: "cust-2", customerName: "Mariana Costa", companyName: "Costa Imóveis LTDA", planName: "Enterprise", amount: 49900, currency: "brl", status: "succeeded" as const, stripeInvoiceId: "in_xxx2", stripePaymentIntentId: "pi_xxx2", method: "credit_card", cardLast4: "1234", createdAt: "2026-02-15T10:00:00.000Z" },
  { id: "pay-3", customerId: "cust-5", customerName: "Eduardo Santos", companyName: "ES Gestão Imobiliária", planName: "Profissional", amount: 19900, currency: "brl", status: "succeeded" as const, stripeInvoiceId: "in_xxx3", stripePaymentIntentId: "pi_xxx3", method: "pix", cardLast4: null, createdAt: "2026-03-01T08:00:00.000Z" },
  { id: "pay-4", customerId: "cust-4", customerName: "Sandra Lima", companyName: "Lima Administradora", planName: "Profissional", amount: 19900, currency: "brl", status: "failed" as const, stripeInvoiceId: "in_xxx4", stripePaymentIntentId: "pi_xxx4", method: "credit_card", cardLast4: "5678", createdAt: "2026-02-28T10:00:00.000Z" },
  { id: "pay-5", customerId: "cust-7", customerName: "André Moreira", companyName: "AM Imóveis Brasília", planName: "Enterprise", amount: 49900, currency: "brl", status: "succeeded" as const, stripeInvoiceId: "in_xxx5", stripePaymentIntentId: "pi_xxx5", method: "credit_card", cardLast4: "9876", createdAt: "2026-02-25T10:00:00.000Z" },
  { id: "pay-6", customerId: "cust-3", customerName: "Felipe Rodrigues", companyName: "FR Imobiliária", planName: "Starter", amount: 9900, currency: "brl", status: "succeeded" as const, stripeInvoiceId: "in_xxx6", stripePaymentIntentId: "pi_xxx6", method: "boleto", cardLast4: null, createdAt: "2026-02-20T10:00:00.000Z" },
  { id: "pay-7", customerId: "cust-1", customerName: "Roberto Almeida", companyName: "Almeida Imóveis", planName: "Profissional", amount: 19900, currency: "brl", status: "succeeded" as const, stripeInvoiceId: "in_xxx7", stripePaymentIntentId: "pi_xxx7", method: "credit_card", cardLast4: "4242", createdAt: "2026-02-01T10:00:00.000Z" },
  { id: "pay-8", customerId: "cust-6", customerName: "Camila Torres", companyName: "Torres Corretora", planName: "Starter", amount: 9900, currency: "brl", status: "refunded" as const, stripeInvoiceId: "in_xxx8", stripePaymentIntentId: "pi_xxx8", method: "credit_card", cardLast4: "3333", createdAt: "2025-12-15T10:00:00.000Z" },
  { id: "pay-9", customerId: "cust-2", customerName: "Mariana Costa", companyName: "Costa Imóveis LTDA", planName: "Enterprise", amount: 49900, currency: "brl", status: "succeeded" as const, stripeInvoiceId: "in_xxx9", stripePaymentIntentId: "pi_xxx9", method: "pix", cardLast4: null, createdAt: "2026-01-15T10:00:00.000Z" },
  { id: "pay-10", customerId: "cust-5", customerName: "Eduardo Santos", companyName: "ES Gestão Imobiliária", planName: "Profissional", amount: 19900, currency: "brl", status: "succeeded" as const, stripeInvoiceId: "in_xxx10", stripePaymentIntentId: "pi_xxx10", method: "credit_card", cardLast4: "7777", createdAt: "2026-02-01T10:00:00.000Z" },
];

// ─── Dashboard stats ─────────────────────────────────────────────
export const ADMIN_DASHBOARD = {
  stats: {
    totalCustomers: 203,
    activeSubscribers: 189,
    trialUsers: 14,
    churned: 8,
    mrr: 4489700, // R$ 44.897,00
    arr: 53876400,
    avgRevenuePerUser: 23756,
    ltv: 570144,
    churnRate: 3.2,
    growthRate: 12.5,
    totalRevenue: 18940000,
    revenueThisMonth: 4489700,
  },
  mrrChart: [
    { month: "Set/25", mrr: 3850000 },
    { month: "Out/25", mrr: 3920000 },
    { month: "Nov/25", mrr: 4050000 },
    { month: "Dez/25", mrr: 4150000 },
    { month: "Jan/26", mrr: 4280000 },
    { month: "Fev/26", mrr: 4380000 },
    { month: "Mar/26", mrr: 4489700 },
  ],
  planDistribution: [
    { name: "Starter", value: 48, color: "#94a3b8" },
    { name: "Profissional", value: 124, color: "#2563eb" },
    { name: "Enterprise", value: 31, color: "#f59e0b" },
  ],
  recentSignups: [
    { id: "cust-8", name: "Juliana Peixoto", company: "JP Gestão Imobiliária", plan: "Starter", date: "2026-03-01T00:00:00.000Z" },
    { id: "cust-new-1", name: "Marcos Ribeiro", company: "Ribeiro Imóveis", plan: "Profissional", date: "2026-02-28T00:00:00.000Z" },
    { id: "cust-new-2", name: "Ana Paula Ferraz", company: "APF Administradora", plan: "Profissional", date: "2026-02-25T00:00:00.000Z" },
    { id: "cust-new-3", name: "Carlos Santos", company: "CS Imob", plan: "Starter", date: "2026-02-22T00:00:00.000Z" },
    { id: "cust-new-4", name: "Renata Oliveira", company: "RO Gestão", plan: "Enterprise", date: "2026-02-20T00:00:00.000Z" },
  ],
  recentPayments: PAYMENTS.slice(0, 5),
};

// ─── getDemoResponse para admin ──────────────────────────────────
export function getAdminDemoResponse(endpoint: string, method: string): unknown | null {
  const path = endpoint.split("?")[0].replace(/^\/api/, "");

  if (path === "/admin/auth/me") return { success: true, data: ADMIN_USER };
  if (path === "/admin/auth/login")
    return { success: true, data: { user: ADMIN_USER, accessToken: "admin-demo-token", refreshToken: "admin-demo-refresh" } };

  if (path === "/admin/dashboard") return { success: true, data: ADMIN_DASHBOARD };

  // Plans
  if (path === "/admin/plans" && method === "GET")
    return { success: true, data: PLANS, pagination: mkPag(PLANS.length) };
  if (path.match(/^\/admin\/plans\/[^/]+$/) && method === "GET")
    return { success: true, data: PLANS[0] };
  if (path === "/admin/plans" && method === "POST")
    return { success: true, data: { ...PLANS[0], id: "plan-new-" + Date.now() } };
  if (path.match(/^\/admin\/plans\/[^/]+$/) && (method === "PUT" || method === "DELETE"))
    return { success: true, data: {} };

  // Customers
  if (path === "/admin/customers" && method === "GET")
    return { success: true, data: CUSTOMERS, pagination: mkPag(CUSTOMERS.length), stats: { total: 203, active: 189, trialing: 14, churned: 8 } };
  if (path.match(/^\/admin\/customers\/[^/]+$/) && method === "GET")
    return { success: true, data: CUSTOMERS[0] };
  if (path.match(/^\/admin\/customers\/[^/]+$/) && (method === "PUT" || method === "DELETE"))
    return { success: true, data: {} };
  if (path.match(/^\/admin\/customers\/[^/]+\/subscription/) && method === "PUT")
    return { success: true, data: {} };

  // Payments
  if (path === "/admin/payments" && method === "GET")
    return {
      success: true, data: PAYMENTS, pagination: mkPag(PAYMENTS.length),
      stats: { totalRevenue: 18940000, thisMonth: 4489700, failed: 1, refunded: 1 },
    };

  // Settings
  if (path === "/admin/settings" && method === "GET")
    return {
      success: true,
      data: {
        stripeSecretKey: "sk_test_•••••••••••••••••",
        stripeWebhookSecret: "whsec_•••••••••••••••••",
        stripePublishableKey: "pk_test_abc123",
        appName: "ImobiERP",
        appUrl: "https://app.imobierp.com.br",
        supportEmail: "suporte@imobierp.com.br",
        fromEmail: "noreply@imobierp.com.br",
        smtpHost: "smtp.resend.com",
        smtpPort: 587,
        trialDays: 14,
        maintenanceMode: false,
      },
    };
  if (path === "/admin/settings" && method === "PUT")
    return { success: true, data: {} };

  // Stripe sync
  if (path === "/admin/stripe/sync")
    return { success: true, data: { synced: true, count: 203 } };

  return null;
}

function mkPag(total: number, page = 1, limit = 20) {
  const totalPages = Math.ceil(total / limit);
  return { total, page, limit, totalPages, hasNext: page < totalPages, hasPrev: page > 1 };
}
