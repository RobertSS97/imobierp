"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { StatsCard } from "@/components/dashboard/stats-card";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { OccupancyChart } from "@/components/dashboard/occupancy-chart";
import { RecentChargesTable } from "@/components/dashboard/recent-charges-table";
import { ExpiringContractsCard } from "@/components/dashboard/expiring-contracts-card";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { RequireAuth } from "@/contexts/auth-context";
import { dashboardApi } from "@/lib/api-client";
import { useApiQuery } from "@/hooks/use-api";
import { Button } from "@/components/ui/button";
import {
  Building2,
  Users,
  UserCircle,
  FileText,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Percent,
  Eye,
  EyeOff,
} from "lucide-react";

export default function DashboardPage() {
  const { data, isLoading } = useApiQuery(
    () => dashboardApi.get(),
    [],
    { refetchInterval: 60000 } // refetch a cada 1 min
  );

  const [privacyMode, setPrivacyMode] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("imobierp_privacy_mode");
    if (stored === "true") setPrivacyMode(true);
  }, []);

  const togglePrivacy = () => {
    setPrivacyMode((prev) => {
      const next = !prev;
      localStorage.setItem("imobierp_privacy_mode", String(next));
      return next;
    });
  };

  const stats = data?.stats || {};
  const revenueChart = data?.revenueData || [];
  const occupancyChart = {
    rented: stats.rentedProperties ?? 0,
    available: stats.availableProperties ?? 0,
    maintenance: stats.maintenanceProperties ?? 0,
  };
  const overdueCharges = data?.recentOverdueCharges || [];
  const pendingCharges = data?.recentPendingCharges || [];
  const expiringContracts = data?.expiringContracts || [];
  const recentActivity = data?.recentActivity || [];

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);

  return (
    <RequireAuth>
      <AppLayout>
        <div className="space-y-6">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
              <p className="text-muted-foreground">
                Visão geral do seu negócio imobiliário
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={togglePrivacy}
              className="flex items-center gap-2"
              title={privacyMode ? "Exibir valores" : "Ocultar valores"}
            >
              {privacyMode ? (
                <><EyeOff className="h-4 w-4" /> Exibir valores</>
              ) : (
                <><Eye className="h-4 w-4" /> Ocultar valores</>
              )}
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Total de Imóveis"
              value={stats.totalProperties || 0}
              description={`${stats.rentedProperties || 0} alugados, ${stats.availableProperties || 0} disponíveis`}
              icon={Building2}
              privacyMode={privacyMode}
            />
            <StatsCard
              title="Inquilinos Ativos"
              value={stats.activeTenants || 0}
              description={`${stats.totalTenants || 0} inquilinos cadastrados`}
              icon={Users}
              privacyMode={privacyMode}
            />
            <StatsCard
              title="Proprietários"
              value={stats.activeOwners || 0}
              description={`${stats.totalOwners || 0} no total`}
              icon={UserCircle}
              privacyMode={privacyMode}
            />
            <StatsCard
              title="Contratos Ativos"
              value={stats.activeContracts || 0}
              description={`${stats.totalContracts || 0} contratos no total`}
              icon={FileText}
              privacyMode={privacyMode}
            />
          </div>

          {/* Secondary Stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Receita Mensal"
              value={formatCurrency(stats.monthlyRevenue || 0)}
              icon={DollarSign}
              trend={stats.revenueTrend ? { value: stats.revenueTrend, isPositive: stats.revenueTrend >= 0 } : undefined}
              privacyMode={privacyMode}
            />
            <StatsCard
              title="Cobranças Pendentes"
              value={stats.pendingCharges || 0}
              description={`${formatCurrency(stats.pendingChargesValue || 0)} em valores pendentes`}
              icon={TrendingUp}
              privacyMode={privacyMode}
            />
            <StatsCard
              title="Cobranças Vencidas"
              value={stats.overdueCharges || 0}
              description={`${formatCurrency(stats.overdueChargesValue || 0)} em atraso`}
              icon={AlertTriangle}
              privacyMode={privacyMode}
            />
            <StatsCard
              title="Taxa de Ocupação"
              value={`${stats.occupancyRate || 0}%`}
              icon={Percent}
              trend={stats.occupancyTrend ? { value: stats.occupancyTrend, isPositive: stats.occupancyTrend >= 0 } : undefined}
              privacyMode={privacyMode}
            />
          </div>

          {/* Charts */}
          <div className="grid gap-4 lg:grid-cols-3">
            <RevenueChart data={revenueChart} privacyMode={privacyMode} />
            <OccupancyChart data={occupancyChart} privacyMode={privacyMode} />
          </div>

          {/* Tables */}
          <div className="grid gap-4 lg:grid-cols-2">
            <RecentChargesTable type="overdue" charges={overdueCharges} privacyMode={privacyMode} />
            <RecentChargesTable type="pending" charges={pendingCharges} privacyMode={privacyMode} />
          </div>

          {/* Expiring Contracts and Activity */}
          <div className="grid gap-4 lg:grid-cols-3">
            <ExpiringContractsCard contracts={expiringContracts} />
            <RecentActivity activities={recentActivity} />
          </div>
        </div>
      </AppLayout>
    </RequireAuth>
  );
}
