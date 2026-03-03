"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { authApi, setTokens, clearTokens, getTokens, ApiError } from "@/lib/api-client";

// ─── Types ────────────────────────────────────────────────────────
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  plan: string;
  planExpiresAt: string | null;
  trialDaysLeft: number | null;
  trialExpired: boolean;
  companyName: string | null;
  companyEmail: string | null;
  companyPhone: string | null;
  // endereço da empresa (campos do schema Prisma)
  companyStreet: string | null;
  companyNumber: string | null;
  companyComplement: string | null;
  companyNeighborhood: string | null;
  companyCity: string | null;
  companyState: string | null;
  companyZipCode: string | null;
  creciNumber: string | null;
  creciState: string | null;
  creci: string | null;
  logo: string | null;
  primaryColor: string | null;
  // WhatsApp
  whatsappEnabled: boolean;
  whatsappApiUrl: string | null;
  whatsappApiKey: string | null;
  whatsappInstanceName: string | null;
  // aliases para compatibilidade com componentes existentes
  whatsappNumber: string | null;
  whatsappApiToken: string | null;
  whatsappMessageTemplate: string | null;
  companyLogo: string | null;
  // Financeiro
  emailNotifications: boolean;
  notifyNewRegister: boolean;
  notifyPayment: boolean;
  notifyOverdue: boolean;
  notifyExpiring: boolean;
  autoChargeEnabled: boolean;
  autoChargeDay: number;
  lateFeePercentage: number;
  interestPercentage: number;
  createdAt: string;
  [key: string]: unknown;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { name: string; email: string; password: string; phone?: string; companyName?: string }) => Promise<void>;
  logout: () => void;
  updateUser: (data: Partial<AuthUser>) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar usuário na inicialização
  useEffect(() => {
    const loadUser = async () => {
      const { accessToken } = getTokens();
      if (!accessToken) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await authApi.me();
        setUser(response.data);
        if (typeof window !== "undefined") {
          localStorage.setItem("imobierp_user", JSON.stringify(response.data));
        }
      } catch {
        // Token inválido, tentar refresh é feito automaticamente pelo api-client
        // Se falhar, o usuário será redirecionado para login
        const cached = typeof window !== "undefined" ? localStorage.getItem("imobierp_user") : null;
        if (cached) {
          try {
            setUser(JSON.parse(cached));
          } catch {
            clearTokens();
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await authApi.login({ email, password });
    const { user: userData, accessToken, refreshToken } = response.data;
    setTokens(accessToken, refreshToken);
    setUser(userData);
    if (typeof window !== "undefined") {
      localStorage.setItem("imobierp_user", JSON.stringify(userData));
    }
  }, []);

  const register = useCallback(async (data: { name: string; email: string; password: string; phone?: string; companyName?: string }) => {
    const response = await authApi.register(data);
    const { user: userData, accessToken, refreshToken } = response.data;
    setTokens(accessToken, refreshToken);
    setUser(userData);
    if (typeof window !== "undefined") {
      localStorage.setItem("imobierp_user", JSON.stringify(userData));
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    clearTokens();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  }, []);

  const updateUser = useCallback((data: Partial<AuthUser>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...data };
      if (typeof window !== "undefined") {
        localStorage.setItem("imobierp_user", JSON.stringify(updated));
      }
      return updated;
    });
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const response = await authApi.me();
      setUser(response.data);
      if (typeof window !== "undefined") {
        localStorage.setItem("imobierp_user", JSON.stringify(response.data));
      }
    } catch {
      // Silenciar erro
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        updateUser,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}

// ─── Componente de proteção de rota ──────────────────────────────
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = "/login";
    }
  }, [isLoading, isAuthenticated]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
