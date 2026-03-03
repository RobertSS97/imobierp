"use client";

import { AdminSidebar } from "./admin-sidebar";
import { AdminHeader } from "./admin-header";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const STORAGE_KEY = "imobierp_admin_sidebar_collapsed";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [verified, setVerified] = useState(false);

  // Verificar autenticação admin via API
  useEffect(() => {
    const verify = async () => {
      try {
        const res = await fetch("/api/admin/auth/me", { credentials: "include" });
        if (res.status === 401) {
          router.replace("/admin/login");
          return;
        }
        if (!res.ok) {
          // Erro de banco (503) ou outro — não redirecionar, tentar novamente
          setTimeout(verify, 3000);
          return;
        }
        setVerified(true);
      } catch {
        router.replace("/admin/login");
      }
    };
    verify();
  }, [router]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "true") setCollapsed(true);
    } catch {}

    const handler = () => {
      try {
        setCollapsed(localStorage.getItem(STORAGE_KEY) === "true");
      } catch {}
    };
    window.addEventListener("storage", handler);

    const interval = setInterval(() => {
      try {
        const v = localStorage.getItem(STORAGE_KEY) === "true";
        setCollapsed((prev) => (prev !== v ? v : prev));
      } catch {}
    }, 200);

    return () => {
      window.removeEventListener("storage", handler);
      clearInterval(interval);
    };
  }, []);

  if (!verified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      <AdminHeader sidebarCollapsed={collapsed} />
      <main
        className={cn(
          "pt-16 min-h-screen transition-all duration-300",
          collapsed ? "ml-16" : "ml-64"
        )}
      >
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
