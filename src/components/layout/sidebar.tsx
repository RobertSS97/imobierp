"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Building2,
  Users,
  UserCircle,
  FileText,
  DollarSign,
  History,
  FolderOpen,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSidebar } from "@/contexts/sidebar-context";
import { useState, useEffect } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const menuItems = [
  {
    title: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Imóveis",
    href: "/imoveis",
    icon: Building2,
  },
  {
    title: "Inquilinos",
    href: "/inquilinos",
    icon: Users,
  },
  {
    title: "Proprietários",
    href: "/proprietarios",
    icon: UserCircle,
  },
  {
    title: "Contratos",
    href: "/contratos",
    icon: FileText,
  },
  {
    title: "Cobranças",
    href: "/cobrancas",
    icon: DollarSign,
  },
  {
    title: "Histórico",
    href: "/historico",
    icon: History,
  },
  {
    title: "Documentos",
    href: "/documentos",
    icon: FolderOpen,
  },
  {
    title: "Relatórios",
    href: "/relatorios",
    icon: BarChart3,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { collapsed, setCollapsed } = useSidebar();
  const [logo, setLogo] = useState<string | null>(null);

  useEffect(() => {
    try { const saved = localStorage.getItem("imobierp_company_logo"); if (saved) setLogo(saved); } catch {}
    const handler = () => { try { setLogo(localStorage.getItem("imobierp_company_logo")); } catch {} };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen border-r border-border bg-card transition-all duration-300",
          collapsed ? "w-16" : "w-64"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between border-b border-border px-4">
            {!collapsed && (
              <Link href="/" className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground overflow-hidden">
                  {logo ? <img src={logo} alt="Logo" className="h-full w-full object-contain" /> : <Building2 className="h-5 w-5" />}
                </div>
                <span className="text-lg font-bold text-foreground">
                  ImobiERP
                </span>
              </Link>
            )}
            {collapsed && (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground mx-auto overflow-hidden">
                {logo ? <img src={logo} alt="Logo" className="h-full w-full object-contain" /> : <Building2 className="h-5 w-5" />}
              </div>
            )}
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 px-3 py-4">
            <nav className="flex flex-col gap-1">
              {menuItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                if (collapsed) {
                  return (
                    <Tooltip key={item.href}>
                      <TooltipTrigger asChild>
                        <Link
                          href={item.href}
                          className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
                            isActive
                              ? "bg-primary text-primary-foreground"
                              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                          )}
                        >
                          <Icon className="h-5 w-5" />
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p>{item.title}</p>
                      </TooltipContent>
                    </Tooltip>
                  );
                }

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.title}</span>
                  </Link>
                );
              })}
            </nav>
          </ScrollArea>

          {/* Footer */}
          <div className="border-t border-border p-3">
            {collapsed ? (
              <div className="flex flex-col gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <a
                      href="https://wa.me/5547997739049"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-10 w-10 items-center justify-center rounded-lg text-green-500 hover:bg-green-500/10"
                    >
                      <MessageCircle className="h-5 w-5" />
                    </a>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>Suporte via WhatsApp</p>
                  </TooltipContent>
                </Tooltip>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setCollapsed(false)}
                  className="h-10 w-10"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <a
                  href="https://wa.me/5547997739049"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-green-500 hover:bg-green-500/10 transition-colors"
                >
                  <MessageCircle className="h-5 w-5" />
                  <span>Suporte</span>
                </a>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setCollapsed(true)}
                  className="h-8 w-8"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </aside>
    </TooltipProvider>
  );
}
