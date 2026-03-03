// Tipos principais do ERP Imobiliário

// Status do imóvel
export type PropertyStatus = 'available' | 'rented' | 'maintenance' | 'inactive';

// Tipo do imóvel
export type PropertyType = 'apartment' | 'house' | 'commercial' | 'land' | 'studio';

// Status do inquilino
export type TenantStatus = 'active' | 'inactive' | 'pending';

// Status do proprietário
export type OwnerStatus = 'active' | 'inactive';

// Status do contrato
export type ContractStatus = 'active' | 'expired' | 'cancelled' | 'pending';

// Status da cobrança
export type ChargeStatus = 'pending' | 'paid' | 'overdue' | 'cancelled';

// Tipo de cobrança
export type ChargeType = 'rent' | 'condo_fee' | 'iptu' | 'water' | 'electricity' | 'gas' | 'other';

// Status do pagamento
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

// Plano da assinatura
export type PlanType = 'starter' | 'professional' | 'enterprise';

// Imóvel
export interface Property {
  id: string;
  title: string;
  type: PropertyType;
  status: PropertyStatus;
  address: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
  bedrooms: number;
  bathrooms: number;
  parkingSpaces: number;
  area: number;
  rentValue: number;
  condoFee?: number;
  iptu?: number;
  description?: string;
  amenities: string[];
  images: string[];
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Proprietário
export interface Owner {
  id: string;
  name: string;
  email: string;
  phone: string;
  whatsapp?: string;
  cpfCnpj: string;
  rg?: string;
  address: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
  bankAccount?: {
    bank: string;
    agency: string;
    account: string;
    accountType: 'checking' | 'savings';
    pixKey?: string;
  };
  status: OwnerStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Inquilino
export interface Tenant {
  id: string;
  name: string;
  email: string;
  phone: string;
  whatsapp?: string;
  cpf: string;
  rg?: string;
  dateOfBirth?: Date;
  maritalStatus?: 'single' | 'married' | 'divorced' | 'widowed';
  profession?: string;
  income?: number;
  address: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
  emergencyContact?: {
    name: string;
    phone: string;
    relationship?: string;
  };
  status: TenantStatus;
  notes?: string;
  documents: Document[];
  createdAt: Date;
  updatedAt: Date;
}

// Contrato
export interface Contract {
  id: string;
  propertyId: string;
  tenantId: string;
  ownerId: string;
  startDate: Date;
  endDate: Date;
  rentValue: number;
  condoFee?: number;
  iptu?: number;
  depositValue: number;
  depositType: 'cash' | 'bank_guarantee' | 'insurance';
  paymentDay: number;
  readjustmentIndex: 'igpm' | 'ipca' | 'inpc';
  readjustmentMonth: number;
  clauses: ContractClause[];
  status: ContractStatus;
  documents: Document[];
  createdAt: Date;
  updatedAt: Date;
}

// Cláusula do contrato
export interface ContractClause {
  id: string;
  title: string;
  content: string;
  order: number;
}

// Cobrança
export interface Charge {
  id: string;
  contractId: string;
  tenantId: string;
  propertyId: string;
  type: ChargeType;
  description: string;
  value: number;
  dueDate: Date;
  paymentDate?: Date;
  status: ChargeStatus;
  paymentMethod?: 'pix' | 'boleto' | 'transfer' | 'cash' | 'credit_card';
  penaltyValue?: number;
  interestValue?: number;
  discountValue?: number;
  notes?: string;
  whatsappSent: boolean;
  whatsappSentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Documento
export interface Document {
  id: string;
  name: string;
  type: 'contract' | 'id_document' | 'proof_income' | 'proof_address' | 'photo' | 'other';
  url: string;
  size: number;
  mimeType: string;
  uploadedAt: Date;
}

// Notificação
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  read: boolean;
  link?: string;
  createdAt: Date;
}

// Usuário do sistema
export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: 'admin' | 'manager' | 'employee';
  plan: PlanType;
  planExpiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Configurações do sistema
export interface SystemSettings {
  companyName: string;
  companyEmail: string;
  companyPhone: string;
  companyAddress: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
  creciNumber?: string;
  creciState?: string;
  logo?: string;
  primaryColor?: string;
  whatsappEnabled: boolean;
  whatsappNumber?: string;
  emailNotifications: boolean;
  autoChargeEnabled: boolean;
  autoChargeDay: number;
  lateFeePercentage: number;
  interestPercentage: number;
  createdAt: Date;
  updatedAt: Date;
}

// Histórico/Log
export interface HistoryLog {
  id: string;
  entityType: 'property' | 'tenant' | 'owner' | 'contract' | 'charge';
  entityId: string;
  action: 'create' | 'update' | 'delete' | 'status_change';
  description: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  userId: string;
  createdAt: Date;
}

// Dashboard stats
export interface DashboardStats {
  totalProperties: number;
  rentedProperties: number;
  availableProperties: number;
  totalTenants: number;
  activeTenants: number;
  totalOwners: number;
  activeContracts: number;
  pendingCharges: number;
  overdueCharges: number;
  totalRevenue: number;
  pendingRevenue: number;
  occupancyRate: number;
}

// Filtros de busca
export interface PropertyFilters {
  status?: PropertyStatus;
  type?: PropertyType;
  city?: string;
  state?: string;
  minRent?: number;
  maxRent?: number;
  bedrooms?: number;
  ownerId?: string;
}

export interface TenantFilters {
  status?: TenantStatus;
  search?: string;
}

export interface OwnerFilters {
  status?: OwnerStatus;
  search?: string;
}

export interface ContractFilters {
  status?: ContractStatus;
  propertyId?: string;
  tenantId?: string;
  ownerId?: string;
}

export interface ChargeFilters {
  status?: ChargeStatus;
  type?: ChargeType;
  tenantId?: string;
  propertyId?: string;
  startDate?: Date;
  endDate?: Date;
}
