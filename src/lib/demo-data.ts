// ─── Dados de demonstração do ImobiERP ──────────────────────────

export const DEMO_USER = {
  id: "demo-user-1",
  name: "Roberto Almeida",
  email: "roberto@imobierp.com.br",
  phone: "(11) 99999-0001",
  role: "admin",
  plan: "professional",
  companyName: "ImobiERP Gestão Imobiliária",
  companyLogo: null,
  companyCRECI: "12345-J",
  creci: "12345-J",
  companyEmail: "contato@imobierp.com.br",
  companyPhone: "(11) 3333-4444",
  companyAddress: "Av. Paulista, 1000 - Sala 201, Bela Vista, São Paulo/SP",
  addressStreet: "Av. Paulista",
  addressNumber: "1000",
  addressComplement: "Sala 201",
  addressNeighborhood: "Bela Vista",
  addressCity: "São Paulo",
  addressState: "SP",
  addressZipCode: "01310-100",
  whatsappEnabled: false,
  whatsappNumber: null,
  whatsappApiUrl: null,
  whatsappApiToken: null,
  whatsappInstanceName: null,
  autoChargeEnabled: true,
  chargeGenerationDay: 5,
  defaultLateFeePercent: 2,
  defaultInterestPercent: 1,
  billingAutoCharge: true,
  billingDayGenerate: 5,
  billingLateFeePercent: 2,
  billingInterestPercent: 1,
  billingMessageTemplate: null,
  createdAt: "2024-01-01T00:00:00.000Z",
};

export const OWNERS = [
  { id: "own-1", name: "Carlos Mendes", email: "carlos@email.com", phone: "(11) 98888-1111", cpf: "123.456.789-00", status: "active", city: "São Paulo", state: "SP", propertiesCount: 3 },
  { id: "own-2", name: "Ana Lima", email: "ana@email.com", phone: "(11) 97777-2222", cpf: "987.654.321-00", status: "active", city: "Campinas", state: "SP", propertiesCount: 2 },
  { id: "own-3", name: "Pedro Santos", email: "pedro@email.com", phone: "(21) 96666-3333", cpf: "456.123.789-00", status: "active", city: "Rio de Janeiro", state: "RJ", propertiesCount: 1 },
  { id: "own-4", name: "Mariana Costa", email: "mariana@email.com", phone: "(31) 95555-4444", cpf: "789.654.321-00", status: "inactive", city: "Belo Horizonte", state: "MG", propertiesCount: 0 },
];

export const PROPERTIES = [
  { id: "prop-1", title: "Apto 2 Quartos - Vila Madalena", type: "apartment", status: "rented", addressStreet: "Rua Fradique Coutinho", addressNumber: "520", addressNeighborhood: "Vila Madalena", addressCity: "São Paulo", addressState: "SP", addressZipCode: "05416-001", bedrooms: 2, bathrooms: 1, area: 72, rentValue: 3500, ownerId: "own-1", owner: { name: "Carlos Mendes" } },
  { id: "prop-2", title: "Casa 3 Quartos - Jardins", type: "house", status: "available", addressStreet: "Rua Oscar Freire", addressNumber: "800", addressNeighborhood: "Jardins", addressCity: "São Paulo", addressState: "SP", addressZipCode: "01426-001", bedrooms: 3, bathrooms: 2, area: 150, rentValue: 8000, ownerId: "own-1", owner: { name: "Carlos Mendes" } },
  { id: "prop-3", title: "Studio - Itaim Bibi", type: "studio", status: "rented", addressStreet: "Rua Leopoldo Couto de Magalhães Júnior", addressNumber: "110", addressNeighborhood: "Itaim Bibi", addressCity: "São Paulo", addressState: "SP", addressZipCode: "04542-001", bedrooms: 1, bathrooms: 1, area: 38, rentValue: 2800, ownerId: "own-2", owner: { name: "Ana Lima" } },
  { id: "prop-4", title: "Sala Comercial - Centro", type: "commercial", status: "rented", addressStreet: "Av. Brigadeiro Luís Antônio", addressNumber: "2020", addressNeighborhood: "Bela Vista", addressCity: "São Paulo", addressState: "SP", addressZipCode: "01318-002", bedrooms: 0, bathrooms: 1, area: 55, rentValue: 4200, ownerId: "own-2", owner: { name: "Ana Lima" } },
  { id: "prop-5", title: "Apto 3 Quartos - Copacabana", type: "apartment", status: "maintenance", addressStreet: "Av. Atlântica", addressNumber: "3500", addressNeighborhood: "Copacabana", addressCity: "Rio de Janeiro", addressState: "RJ", addressZipCode: "22070-003", bedrooms: 3, bathrooms: 2, area: 110, rentValue: 7500, ownerId: "own-3", owner: { name: "Pedro Santos" } },
];

export const TENANTS = [
  { id: "ten-1", name: "Lucas Ferreira", cpf: "111.222.333-44", email: "lucas@email.com", phone: "(11) 99111-2222", status: "active", profession: "Engenheiro", monthlyIncome: 12000, addressCity: "São Paulo", addressState: "SP" },
  { id: "ten-2", name: "Beatriz Oliveira", cpf: "555.666.777-88", email: "beatriz@email.com", phone: "(11) 98222-3333", status: "active", profession: "Advogada", monthlyIncome: 15000, addressCity: "São Paulo", addressState: "SP" },
  { id: "ten-3", name: "Rafael Souza", cpf: "999.000.111-22", email: "rafael@email.com", phone: "(21) 97333-4444", status: "active", profession: "Designer", monthlyIncome: 8000, addressCity: "Rio de Janeiro", addressState: "RJ" },
  { id: "ten-4", name: "Camila Torres", cpf: "333.444.555-66", email: "camila@email.com", phone: "(11) 96444-5555", status: "pending", profession: "Médica", monthlyIncome: 25000, addressCity: "São Paulo", addressState: "SP" },
];

export const CONTRACTS = [
  {
    id: "con-1", status: "active",
    startDate: "2024-01-01T00:00:00.000Z", endDate: "2025-12-31T00:00:00.000Z",
    rentValue: 3500, condoFee: 450, paymentDay: 5, depositType: "cash", depositValue: 7000,
    readjustmentIndex: "ipca",
    ownerId: "own-1", owner: { name: "Carlos Mendes" },
    tenantId: "ten-1", tenant: { name: "Lucas Ferreira" },
    propertyId: "prop-1", property: { title: "Apto 2 Quartos - Vila Madalena", addressStreet: "Rua Fradique Coutinho" },
  },
  {
    id: "con-2", status: "active",
    startDate: "2024-03-01T00:00:00.000Z", endDate: "2025-02-28T00:00:00.000Z",
    rentValue: 2800, condoFee: 0, paymentDay: 10, depositType: "insurance", depositValue: 5600,
    readjustmentIndex: "igpm",
    ownerId: "own-2", owner: { name: "Ana Lima" },
    tenantId: "ten-2", tenant: { name: "Beatriz Oliveira" },
    propertyId: "prop-3", property: { title: "Studio - Itaim Bibi", addressStreet: "Rua Leopoldo Couto" },
  },
  {
    id: "con-3", status: "active",
    startDate: "2023-07-01T00:00:00.000Z", endDate: "2025-06-30T00:00:00.000Z",
    rentValue: 4200, condoFee: 600, paymentDay: 15, depositType: "bank_guarantee", depositValue: 0,
    readjustmentIndex: "ipca",
    ownerId: "own-2", owner: { name: "Ana Lima" },
    tenantId: "ten-3", tenant: { name: "Rafael Souza" },
    propertyId: "prop-4", property: { title: "Sala Comercial - Centro", addressStreet: "Av. Brigadeiro" },
  },
  {
    id: "con-4", status: "expired",
    startDate: "2022-01-01T00:00:00.000Z", endDate: "2024-12-31T00:00:00.000Z",
    rentValue: 3200, condoFee: 300, paymentDay: 5, depositType: "cash", depositValue: 6400,
    readjustmentIndex: "inpc",
    ownerId: "own-1", owner: { name: "Carlos Mendes" },
    tenantId: "ten-4", tenant: { name: "Camila Torres" },
    propertyId: "prop-2", property: { title: "Casa 3 Quartos - Jardins", addressStreet: "Rua Oscar Freire" },
  },
];

export const CHARGES = [
  { id: "chg-1", type: "rent", value: 3500, dueDate: "2026-03-05T00:00:00.000Z", status: "paid", paidAt: "2026-03-03T10:00:00.000Z", description: "Aluguel março/2026", contractId: "con-1", tenantId: "ten-1", tenant: { name: "Lucas Ferreira" }, propertyId: "prop-1", property: { title: "Apto 2 Quartos - Vila Madalena" } },
  { id: "chg-2", type: "rent", value: 2800, dueDate: "2026-03-10T00:00:00.000Z", status: "pending", description: "Aluguel março/2026", contractId: "con-2", tenantId: "ten-2", tenant: { name: "Beatriz Oliveira" }, propertyId: "prop-3", property: { title: "Studio - Itaim Bibi" } },
  { id: "chg-3", type: "rent", value: 4200, dueDate: "2026-03-15T00:00:00.000Z", status: "pending", description: "Aluguel março/2026", contractId: "con-3", tenantId: "ten-3", tenant: { name: "Rafael Souza" }, propertyId: "prop-4", property: { title: "Sala Comercial - Centro" } },
  { id: "chg-4", type: "rent", value: 3500, dueDate: "2026-02-05T00:00:00.000Z", status: "overdue", description: "Aluguel fevereiro/2026", contractId: "con-1", tenantId: "ten-1", tenant: { name: "Lucas Ferreira" }, propertyId: "prop-1", property: { title: "Apto 2 Quartos - Vila Madalena" } },
  { id: "chg-5", type: "condo_fee", value: 450, dueDate: "2026-03-05T00:00:00.000Z", status: "paid", paidAt: "2026-03-03T10:00:00.000Z", description: "Condomínio março/2026", contractId: "con-1", tenantId: "ten-1", tenant: { name: "Lucas Ferreira" }, propertyId: "prop-1", property: { title: "Apto 2 Quartos - Vila Madalena" } },
  { id: "chg-6", type: "iptu", value: 1200, dueDate: "2026-01-31T00:00:00.000Z", status: "overdue", description: "IPTU 2026 - Cota única", tenantId: "ten-2", tenant: { name: "Beatriz Oliveira" }, propertyId: "prop-3", property: { title: "Studio - Itaim Bibi" } },
];

const DOCUMENTS = [
  // Inquilino: Lucas Ferreira
  { id: "doc-1", name: "Contrato de Locação - Lucas Ferreira.pdf", type: "contract", size: 524288, url: null, linkedTo: "Lucas Ferreira", linkedToType: "tenant", linkedEntityId: "ten-1", description: "Contrato de locação residencial 2024-2025", createdAt: "2024-01-01T00:00:00.000Z" },
  { id: "doc-2", name: "RG - Lucas Ferreira.jpg", type: "id_document", size: 204800, url: null, linkedTo: "Lucas Ferreira", linkedToType: "tenant", linkedEntityId: "ten-1", description: "Documento de identidade", createdAt: "2024-01-01T00:00:00.000Z" },
  { id: "doc-3", name: "CPF - Lucas Ferreira.jpg", type: "id_document", size: 153600, url: null, linkedTo: "Lucas Ferreira", linkedToType: "tenant", linkedEntityId: "ten-1", description: "Cadastro de Pessoa Física", createdAt: "2024-01-01T00:00:00.000Z" },
  { id: "doc-4", name: "Comprovante de Renda - Lucas.pdf", type: "proof_income", size: 286720, url: null, linkedTo: "Lucas Ferreira", linkedToType: "tenant", linkedEntityId: "ten-1", description: "Holerite de dezembro/2023", createdAt: "2024-01-02T00:00:00.000Z" },
  // Inquilino: Beatriz Oliveira
  { id: "doc-5", name: "Contrato de Locação - Beatriz Oliveira.pdf", type: "contract", size: 516096, url: null, linkedTo: "Beatriz Oliveira", linkedToType: "tenant", linkedEntityId: "ten-2", description: "Contrato de locação residencial 2024-2025", createdAt: "2024-03-01T00:00:00.000Z" },
  { id: "doc-6", name: "Comprovante de Renda - Beatriz.pdf", type: "proof_income", size: 329728, url: null, linkedTo: "Beatriz Oliveira", linkedToType: "tenant", linkedEntityId: "ten-2", description: "Declaração de IR 2023", createdAt: "2024-03-01T00:00:00.000Z" },
  { id: "doc-7", name: "RG - Beatriz Oliveira.jpg", type: "id_document", size: 198656, url: null, linkedTo: "Beatriz Oliveira", linkedToType: "tenant", linkedEntityId: "ten-2", createdAt: "2024-03-01T00:00:00.000Z" },
  // Inquilino: Rafael Souza
  { id: "doc-8", name: "Contrato de Locação - Rafael Souza.pdf", type: "contract", size: 491520, url: null, linkedTo: "Rafael Souza", linkedToType: "tenant", linkedEntityId: "ten-3", description: "Contrato sala comercial 2025-2027", createdAt: "2025-01-10T00:00:00.000Z" },
  { id: "doc-9", name: "Comprovante Endereço - Rafael.pdf", type: "proof_address", size: 184320, url: null, linkedTo: "Rafael Souza", linkedToType: "tenant", linkedEntityId: "ten-3", description: "Conta de luz dezembro/2024", createdAt: "2025-01-10T00:00:00.000Z" },
  // Proprietário: Carlos Mendes
  { id: "doc-10", name: "CNH - Carlos Mendes.jpg", type: "id_document", size: 225280, url: null, linkedTo: "Carlos Mendes", linkedToType: "owner", linkedEntityId: "own-1", description: "Carteira Nacional de Habilitação", createdAt: "2023-06-15T00:00:00.000Z" },
  { id: "doc-11", name: "Contrato Social - Carlos Mendes.pdf", type: "contract", size: 614400, url: null, linkedTo: "Carlos Mendes", linkedToType: "owner", linkedEntityId: "own-1", description: "Contrato social da empresa", createdAt: "2023-06-15T00:00:00.000Z" },
  // Proprietário: Ana Lima
  { id: "doc-12", name: "RG - Ana Lima.jpg", type: "id_document", size: 189440, url: null, linkedTo: "Ana Lima", linkedToType: "owner", linkedEntityId: "own-2", createdAt: "2023-09-20T00:00:00.000Z" },
  { id: "doc-13", name: "Procuração - Ana Lima.pdf", type: "contract", size: 348160, url: null, linkedTo: "Ana Lima", linkedToType: "owner", linkedEntityId: "own-2", description: "Procuração para administração dos imóveis", createdAt: "2023-09-20T00:00:00.000Z" },
  // Imóvel: Apto Vila Madalena
  { id: "doc-14", name: "Foto Fachada - Apto Vila Madalena.jpg", type: "photo", size: 2097152, url: null, linkedTo: "Apto 2 Quartos - Vila Madalena", linkedToType: "property", linkedEntityId: "prop-1", description: "Foto da fachada do prédio", createdAt: "2023-12-15T00:00:00.000Z" },
  { id: "doc-15", name: "Laudo Vistoria Entrada - Vila Madalena.pdf", type: "report", size: 1048576, url: null, linkedTo: "Apto 2 Quartos - Vila Madalena", linkedToType: "property", linkedEntityId: "prop-1", description: "Vistoria de entrada - Jan/2024", createdAt: "2024-01-05T00:00:00.000Z" },
  { id: "doc-16", name: "Matrícula Imóvel - Vila Madalena.pdf", type: "other", size: 430080, url: null, linkedTo: "Apto 2 Quartos - Vila Madalena", linkedToType: "property", linkedEntityId: "prop-1", description: "Certidão de matrícula atualizada", createdAt: "2023-11-01T00:00:00.000Z" },
  // Imóvel: Studio Itaim
  { id: "doc-17", name: "Foto Interior - Studio Itaim.jpg", type: "photo", size: 1843200, url: null, linkedTo: "Studio - Itaim Bibi", linkedToType: "property", linkedEntityId: "prop-3", createdAt: "2024-02-10T00:00:00.000Z" },
  { id: "doc-18", name: "Seguro Incêndio - Studio Itaim.pdf", type: "insurance", size: 262144, url: null, linkedTo: "Studio - Itaim Bibi", linkedToType: "property", linkedEntityId: "prop-3", description: "Apólice vigência 2024-2025", createdAt: "2024-02-15T00:00:00.000Z" },
  // Imóvel: Sala Comercial
  { id: "doc-19", name: "Planta Baixa - Sala Comercial.pdf", type: "other", size: 716800, url: null, linkedTo: "Sala Comercial - Centro", linkedToType: "property", linkedEntityId: "prop-4", description: "Planta baixa aprovada", createdAt: "2023-10-01T00:00:00.000Z" },
  // Geral
  { id: "doc-20", name: "Tabela de Reajuste IGPM 2025.xlsx", type: "other", size: 102400, url: null, linkedTo: null, linkedToType: "general", linkedEntityId: null, description: "Referência para reajustes contratuais", createdAt: "2025-01-05T00:00:00.000Z" },
  { id: "doc-21", name: "Modelo de Recibo de Aluguel.docx", type: "receipt", size: 81920, url: null, linkedTo: null, linkedToType: "general", linkedEntityId: null, description: "Template padrão de recibo", createdAt: "2025-02-01T00:00:00.000Z" },
];

const HISTORY = [
  { id: "his-1", entityType: "charge", action: "update", entityName: "Aluguel março/2026 - Lucas Ferreira", description: "Cobrança marcada como paga - R$ 3.500,00", changes: { status: { from: "pending", to: "paid" } }, createdAt: "2026-03-03T10:00:00.000Z" },
  { id: "his-2", entityType: "charge", action: "create", entityName: "Aluguel março/2026 - Rafael Souza", description: "Nova cobrança gerada automaticamente - R$ 4.200,00", changes: null, createdAt: "2026-03-01T08:00:00.000Z" },
  { id: "his-3", entityType: "tenant", action: "create", entityName: "Camila Torres", description: "Novo inquilino cadastrado", changes: null, createdAt: "2026-02-28T14:30:00.000Z" },
  { id: "his-4", entityType: "contract", action: "update", entityName: "Contrato #con-4", description: "Status do contrato alterado para Expirado", changes: { status: { from: "active", to: "expired" } }, createdAt: "2025-01-01T00:00:00.000Z" },
  { id: "his-5", entityType: "property", action: "update", entityName: "Apto 3 Quartos - Copacabana", description: "Imóvel em manutenção", changes: { status: { from: "available", to: "maintenance" } }, createdAt: "2026-02-20T09:00:00.000Z" },
  { id: "his-6", entityType: "owner", action: "create", entityName: "Mariana Costa", description: "Novo proprietário cadastrado", changes: null, createdAt: "2026-01-15T11:00:00.000Z" },
  { id: "his-7", entityType: "charge", action: "create", entityName: "Aluguel fevereiro/2026 - Lucas Ferreira", description: "Nova cobrança gerada automaticamente - R$ 3.500,00", changes: null, createdAt: "2026-02-01T08:00:00.000Z" },
];

const NOTIFICATIONS = [
  { id: "not-1", type: "charge_overdue", title: "Cobrança vencida", message: "Aluguel fev/2026 de Lucas Ferreira venceu (R$ 3.500,00)", read: false, createdAt: "2026-02-06T08:00:00.000Z" },
  { id: "not-2", type: "charge_overdue", title: "Cobrança vencida", message: "IPTU 2026 de Beatriz Oliveira venceu (R$ 1.200,00)", read: false, createdAt: "2026-02-01T08:00:00.000Z" },
  { id: "not-3", type: "contract_expiring", title: "Contrato próximo do vencimento", message: "Contrato de Beatriz Oliveira vence em 28/02/2025", read: true, createdAt: "2025-01-29T08:00:00.000Z" },
];

const DASHBOARD = {
  stats: {
    totalProperties: 5,
    activeTenants: 3,
    activeOwners: 3,
    totalRevenue: 17950,
    pendingCharges: 7000,
    overdueCharges: 4700,
    occupancyRate: 80,
    overdueRate: 8,
  },
  revenueChart: [
    { month: "Set/25", receita: 14200, pendente: 0 },
    { month: "Out/25", receita: 14200, pendente: 450 },
    { month: "Nov/25", receita: 15700, pendente: 0 },
    { month: "Dez/25", receita: 15700, pendente: 1200 },
    { month: "Jan/26", receita: 17950, pendente: 0 },
    { month: "Fev/26", receita: 10500, pendente: 3500 },
    { month: "Mar/26", receita: 3950, pendente: 7000 },
  ],
  occupancyChart: { rented: 3, available: 1, maintenance: 1 },
  recentCharges: CHARGES.slice(0, 5),
  expiringContracts: [
    { ...CONTRACTS[1], daysUntilExpiry: 25 },
    { ...CONTRACTS[2], daysUntilExpiry: 119 },
  ],
  recentActivity: HISTORY.slice(0, 5),
};

// ─── Função que retorna dados mockados baseado no endpoint ────────
export function getDemoResponse(endpoint: string, method: string): unknown | null {
  const path = endpoint.split("?")[0].replace(/^\/api/, "");

  // Auth endpoints
  if (path === "/auth/me") return { success: true, data: DEMO_USER };
  if (path === "/auth/login" || path === "/auth/register")
    return { success: true, data: { user: DEMO_USER, accessToken: "demo-token", refreshToken: "demo-refresh" } };
  if (path === "/auth/refresh")
    return { success: true, data: { accessToken: "demo-token", refreshToken: "demo-refresh" } };
  if (path.startsWith("/auth/")) return { success: true, data: {} };

  // Dashboard
  if (path === "/dashboard") return { success: true, data: DASHBOARD };

  // Owners
  if (path === "/owners" && method === "GET")
    return { success: true, data: OWNERS, pagination: mkPagination(OWNERS.length), stats: {} };
  if (path.match(/^\/owners\/[^/]+$/) && method === "GET")
    return { success: true, data: OWNERS[0] };
  if (path === "/owners" && (method === "POST"))
    return { success: true, data: { ...OWNERS[0], id: "own-new-" + Date.now() } };
  if (path.match(/^\/owners\/[^/]+$/) && (method === "PUT" || method === "DELETE"))
    return { success: true, data: {} };

  // Properties
  if (path === "/properties" && method === "GET")
    return { success: true, data: PROPERTIES, pagination: mkPagination(PROPERTIES.length), stats: {} };
  if (path.match(/^\/properties\/[^/]+$/) && method === "GET")
    return { success: true, data: PROPERTIES[0] };
  if (path === "/properties" && method === "POST")
    return { success: true, data: { ...PROPERTIES[0], id: "prop-new-" + Date.now() } };
  if (path.match(/^\/properties\/[^/]+$/) && (method === "PUT" || method === "DELETE"))
    return { success: true, data: {} };

  // Tenants
  if (path === "/tenants" && method === "GET")
    return { success: true, data: TENANTS, pagination: mkPagination(TENANTS.length), stats: {} };
  if (path.match(/^\/tenants\/[^/]+$/) && method === "GET")
    return { success: true, data: TENANTS[0] };
  if (path === "/tenants" && method === "POST")
    return { success: true, data: { ...TENANTS[0], id: "ten-new-" + Date.now() } };
  if (path.match(/^\/tenants\/[^/]+$/) && (method === "PUT" || method === "DELETE"))
    return { success: true, data: {} };

  // Contracts
  if (path === "/contracts" && method === "GET")
    return { success: true, data: CONTRACTS, pagination: mkPagination(CONTRACTS.length), stats: {} };
  if (path.match(/^\/contracts\/[^/]+$/) && method === "GET")
    return { success: true, data: CONTRACTS[0] };
  if (path === "/contracts" && method === "POST")
    return { success: true, data: { ...CONTRACTS[0], id: "con-new-" + Date.now() } };
  if (path.match(/^\/contracts\/[^/]+$/) && (method === "PUT" || method === "DELETE"))
    return { success: true, data: {} };

  // Charges
  if (path === "/charges" && method === "GET")
    return {
      success: true, data: CHARGES, pagination: mkPagination(CHARGES.length),
      stats: { totalPending: 7000, totalOverdue: 4700, totalPaidMonth: 3950, totalChargesMonth: 6 },
    };
  if (path.match(/^\/charges\/[^/]+$/) && method === "GET")
    return { success: true, data: CHARGES[0] };
  if (path === "/charges" && method === "POST")
    return { success: true, data: { ...CHARGES[0], id: "chg-new-" + Date.now() } };
  if (path.match(/^\/charges\/[^/]+$/) && (method === "PUT" || method === "DELETE"))
    return { success: true, data: {} };
  if (path === "/charges/bulk-pay")
    return { success: true, data: {} };

  // Documents
  if (path === "/documents" && method === "GET") {
    // Parse category filter from query string
    const urlParams = new URLSearchParams(endpoint.split("?")[1] || "");
    const catFilter = urlParams.get("category");
    const filtered = catFilter ? DOCUMENTS.filter((d) => d.linkedToType === catFilter) : DOCUMENTS;
    const byCategory = {
      tenant: DOCUMENTS.filter((d) => d.linkedToType === "tenant").length,
      owner: DOCUMENTS.filter((d) => d.linkedToType === "owner").length,
      property: DOCUMENTS.filter((d) => d.linkedToType === "property").length,
      contract: 0,
      general: DOCUMENTS.filter((d) => d.linkedToType === "general").length,
    };
    return {
      success: true, data: filtered, pagination: mkPagination(filtered.length),
      stats: {
        totalFiles: DOCUMENTS.length,
        contracts: DOCUMENTS.filter((d) => d.type === "contract").length,
        idDocuments: DOCUMENTS.filter((d) => d.type === "id_document").length,
        totalSize: DOCUMENTS.reduce((s, d) => s + d.size, 0),
        byCategory,
        recentUploads: 3,
      },
    };
  }
  if (path.match(/^\/documents\/[^/]+$/) && method === "DELETE")
    return { success: true, data: {} };
  if (path === "/documents" && method === "POST")
    return { success: true, data: { ...DOCUMENTS[0], id: "doc-new-" + Date.now() } };
  if (path === "/documents/upload")
    return { success: true, data: { ...DOCUMENTS[0], id: "doc-up-" + Date.now() } };

  // History
  if (path === "/history")
    return { success: true, data: HISTORY, pagination: mkPagination(HISTORY.length) };

  // Notifications
  if (path === "/notifications")
    return { success: true, data: NOTIFICATIONS, unreadCount: 2, pagination: mkPagination(NOTIFICATIONS.length) };
  if (path === "/notifications" && (method === "PUT" || method === "DELETE"))
    return { success: true, data: {} };

  // WhatsApp
  if (path.startsWith("/whatsapp"))
    return { success: true, data: {} };

  // Reports
  if (path === "/reports")
    return {
      success: true,
      data: {
        summary: {
          "Receita Total": "R$ 17.950,00",
          "Imóveis Ativos": "5",
          "Taxa de Ocupação": "80%",
          "Cobranças Pendentes": "R$ 7.000,00",
          "Total Inadimplente": "R$ 4.700,00",
        },
      },
    };

  // Profile update
  if (path === "/auth/profile" || path === "/auth/me")
    return { success: true, data: DEMO_USER };

  return null;
}

function mkPagination(total: number, page = 1, limit = 20) {
  const totalPages = Math.ceil(total / limit);
  return { total, page, limit, totalPages, hasNext: page < totalPages, hasPrev: page > 1 };
}
