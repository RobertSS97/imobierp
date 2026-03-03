"use client";

import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { cn } from "@/lib/utils";
import { SidebarProvider, useSidebar } from "@/contexts/sidebar-context";
import { TrialBanner } from "@/components/trial-banner";

interface AppLayoutProps {
  children: React.ReactNode;
}

function LayoutInner({ children }: AppLayoutProps) {
  const { collapsed } = useSidebar();
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <Header />
      <main
        className={cn(
          "pt-16 min-h-screen transition-all duration-300",
          collapsed ? "ml-16" : "ml-64"
        )}
      >
        <TrialBanner />
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <LayoutInner>{children}</LayoutInner>
    </SidebarProvider>
  );
}
