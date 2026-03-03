// ─── Cliente HTTP com autenticação automática ────────────────────

const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  stats?: any;
  unreadCount?: number;
}

// ─── Token management ─────────────────────────────────────────────
let accessToken: string | null = null;
let refreshToken: string | null = null;

export function getTokens() {
  if (!accessToken && typeof window !== "undefined") {
    accessToken = localStorage.getItem("imobierp_access_token");
    refreshToken = localStorage.getItem("imobierp_refresh_token");
  }
  return { accessToken, refreshToken };
}

export function setTokens(access: string, refresh: string) {
  accessToken = access;
  refreshToken = refresh;
  if (typeof window !== "undefined") {
    localStorage.setItem("imobierp_access_token", access);
    localStorage.setItem("imobierp_refresh_token", refresh);
  }
}

export function clearTokens() {
  accessToken = null;
  refreshToken = null;
  if (typeof window !== "undefined") {
    localStorage.removeItem("imobierp_access_token");
    localStorage.removeItem("imobierp_refresh_token");
    localStorage.removeItem("imobierp_user");
  }
}

// ─── Refresh token logic ──────────────────────────────────────────
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

async function tryRefreshToken(): Promise<string | null> {
  const { refreshToken: rt } = getTokens();
  if (!rt) return null;

  if (isRefreshing) {
    return new Promise((resolve) => {
      subscribeTokenRefresh((token) => resolve(token));
    });
  }

  isRefreshing = true;

  try {
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: rt }),
    });

    if (!response.ok) {
      clearTokens();
      window.location.href = "/login";
      return null;
    }

    const data = await response.json();
    setTokens(data.data.accessToken, data.data.refreshToken);
    onTokenRefreshed(data.data.accessToken);
    return data.data.accessToken;
  } catch {
    clearTokens();
    window.location.href = "/login";
    return null;
  } finally {
    isRefreshing = false;
  }
}

// ─── Fetch wrapper ────────────────────────────────────────────────
async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const { accessToken: at } = getTokens();

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  // Não adicionar Content-Type se for FormData
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (at) {
    headers["Authorization"] = `Bearer ${at}`;
  }

  const url = endpoint.startsWith("http") ? endpoint : `${API_URL}${endpoint}`;

  let response = await fetch(url, {
    ...options,
    headers,
  });

  // Se 401, tentar refresh
  if (response.status === 401 && at) {
    const newToken = await tryRefreshToken();
    if (newToken) {
      headers["Authorization"] = `Bearer ${newToken}`;
      response = await fetch(url, {
        ...options,
        headers,
      });
    }
  }

  const data = await response.json();

  if (!response.ok) {
    throw new ApiError(data.error || "Erro desconhecido", response.status, data.errors);
  }

  return data;
}

// ─── Error class ──────────────────────────────────────────────────
export class ApiError extends Error {
  status: number;
  errors?: Record<string, string[]>;

  constructor(message: string, status: number, errors?: Record<string, string[]>) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }
}

// ─── Auth API ─────────────────────────────────────────────────────
export const authApi = {
  register: (data: { name: string; email: string; password: string; phone?: string; companyName?: string }) =>
    apiFetch("/auth/register", { method: "POST", body: JSON.stringify(data) }),

  login: (data: { email: string; password: string }) =>
    apiFetch("/auth/login", { method: "POST", body: JSON.stringify(data) }),

  me: () => apiFetch("/auth/me"),

  updateProfile: (data: any) =>
    apiFetch("/auth/me", { method: "PUT", body: JSON.stringify(data) }),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    apiFetch("/auth/me", { method: "PATCH", body: JSON.stringify(data) }),

  forgotPassword: (email: string) =>
    apiFetch("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) }),

  resetPassword: (token: string, password: string) =>
    apiFetch("/auth/forgot-password", { method: "PUT", body: JSON.stringify({ token, password }) }),

  logout: () => {
    clearTokens();
    window.location.href = "/login";
  },
};

// ─── Owners API ───────────────────────────────────────────────────
export const ownersApi = {
  list: (params?: Record<string, string>) => {
    const query = params ? "?" + new URLSearchParams(params).toString() : "";
    return apiFetch(`/owners${query}`);
  },
  get: (id: string) => apiFetch(`/owners/${id}`),
  create: (data: any) => apiFetch("/owners", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: any) => apiFetch(`/owners/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) => apiFetch(`/owners/${id}`, { method: "DELETE" }),
};

// ─── Properties API ──────────────────────────────────────────────
export const propertiesApi = {
  list: (params?: Record<string, string>) => {
    const query = params ? "?" + new URLSearchParams(params).toString() : "";
    return apiFetch(`/properties${query}`);
  },
  get: (id: string) => apiFetch(`/properties/${id}`),
  create: (data: any) => apiFetch("/properties", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: any) => apiFetch(`/properties/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) => apiFetch(`/properties/${id}`, { method: "DELETE" }),
};

// ─── Tenants API ─────────────────────────────────────────────────
export const tenantsApi = {
  list: (params?: Record<string, string>) => {
    const query = params ? "?" + new URLSearchParams(params).toString() : "";
    return apiFetch(`/tenants${query}`);
  },
  get: (id: string) => apiFetch(`/tenants/${id}`),
  create: (data: any) => apiFetch("/tenants", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: any) => apiFetch(`/tenants/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) => apiFetch(`/tenants/${id}`, { method: "DELETE" }),
};

// ─── Contracts API ───────────────────────────────────────────────
export const contractsApi = {
  list: (params?: Record<string, string>) => {
    const query = params ? "?" + new URLSearchParams(params).toString() : "";
    return apiFetch(`/contracts${query}`);
  },
  get: (id: string) => apiFetch(`/contracts/${id}`),
  create: (data: any) => apiFetch("/contracts", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: any) => apiFetch(`/contracts/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) => apiFetch(`/contracts/${id}`, { method: "DELETE" }),
};

// ─── Charges API ─────────────────────────────────────────────────
export const chargesApi = {
  list: (params?: Record<string, string>) => {
    const query = params ? "?" + new URLSearchParams(params).toString() : "";
    return apiFetch(`/charges${query}`);
  },
  get: (id: string) => apiFetch(`/charges/${id}`),
  create: (data: any) => apiFetch("/charges", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: any) => apiFetch(`/charges/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) => apiFetch(`/charges/${id}`, { method: "DELETE" }),
  bulkPay: (data: { chargeIds: string[]; paymentMethod?: string; paymentDate?: string }) =>
    apiFetch("/charges/bulk-pay", { method: "POST", body: JSON.stringify(data) }),
};

// ─── Documents API ───────────────────────────────────────────────
export const documentsApi = {
  list: (params?: Record<string, string>) => {
    const query = params ? "?" + new URLSearchParams(params).toString() : "";
    return apiFetch(`/documents${query}`);
  },
  get: (id: string) => apiFetch(`/documents/${id}`),
  create: (data: any) => apiFetch("/documents", { method: "POST", body: JSON.stringify(data) }),
  delete: (id: string) => apiFetch(`/documents/${id}`, { method: "DELETE" }),
  upload: async (file: File, meta?: { type?: string; category?: string; entityId?: string; description?: string }) => {
    const formData = new FormData();
    formData.append("file", file);
    if (meta?.type) formData.append("type", meta.type);
    if (meta?.category) formData.append("category", meta.category);
    if (meta?.entityId) formData.append("entityId", meta.entityId);
    if (meta?.description) formData.append("description", meta.description);
    return apiFetch("/documents/upload", { method: "POST", body: formData });
  },
};

// ─── History API ─────────────────────────────────────────────────
export const historyApi = {
  list: (params?: Record<string, string>) => {
    const query = params ? "?" + new URLSearchParams(params).toString() : "";
    return apiFetch(`/history${query}`);
  },
};

// ─── Notifications API ──────────────────────────────────────────
export const notificationsApi = {
  list: (params?: Record<string, string>) => {
    const query = params ? "?" + new URLSearchParams(params).toString() : "";
    return apiFetch(`/notifications${query}`);
  },
  markRead: (notificationIds?: string[]) =>
    apiFetch("/notifications", {
      method: "PUT",
      body: JSON.stringify(notificationIds ? { notificationIds } : { markAll: true }),
    }),
  deleteRead: () => apiFetch("/notifications", { method: "DELETE" }),
  deleteAll: () => apiFetch("/notifications?all=true", { method: "DELETE" }),
};

// ─── WhatsApp API ────────────────────────────────────────────────
export const whatsappApi = {
  send: (chargeId: string) =>
    apiFetch("/whatsapp/send", { method: "POST", body: JSON.stringify({ chargeId }) }),
  sendBulk: (chargeIds: string[]) =>
    apiFetch("/whatsapp/send", { method: "POST", body: JSON.stringify({ chargeIds }) }),
  messages: (params?: Record<string, string>) => {
    const query = params ? "?" + new URLSearchParams(params).toString() : "";
    return apiFetch(`/whatsapp/messages${query}`);
  },
};

// ─── Dashboard API ───────────────────────────────────────────────
export const dashboardApi = {
  get: () => apiFetch("/dashboard"),
};

// ─── Reports API ─────────────────────────────────────────────────
export const reportsApi = {
  get: (type: string, params?: Record<string, string>) => {
    const allParams = { type, ...params };
    const query = "?" + new URLSearchParams(allParams).toString();
    return apiFetch(`/reports${query}`);
  },
};

// ─── Cron API (admin only) ───────────────────────────────────────
export const cronApi = {
  run: (job?: string) =>
    apiFetch("/cron/run", { method: "POST", body: JSON.stringify({ job: job || "all" }) }),
};
