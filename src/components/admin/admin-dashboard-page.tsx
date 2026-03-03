"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  UserPlus,
  UserMinus,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  RefreshCw,
  Crown,
  Clock,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

function formatNumber(n: number) {
  return new Intl.NumberFormat("pt-BR").format(n);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-card p-3 shadow-lg">
      <p className="text-sm font-medium">{label}</p>
      {payload.map((entry: { name: string; value: number; color: string }, i: number) => (
        <p key={i} className="text-sm" style={{ color: entry.color }}>
          {entry.name}: {formatCurrency(entry.value)}
        </p>
      ))}
    </div>
  );
}

export function AdminDashboardPage() {
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      const res = await fetch("/api/admin/dashboard", { credentials: "include" });
      if (res.ok) {
        const json = await res.json();
        setData(json.data);
      }
    } catch (e) {
      console.error("Erro ao carregar dashboard admin:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDashboard(); }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboard().finally(() => setRefreshing(false));
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" />
      </div>
    );
  }

  const stats = [
    {
      title: "MRR",
      value: formatCurrency(data.stats.mrr),
      description: "Receita Mensal Recorrente",
      icon: DollarSign,
      trend: `+${data.stats.growthRate}%`,
      trendUp: true,
      color: "text-green-500",
    },
    {
      title: "ARR",
      value: formatCurrency(data.stats.arr),
      description: "Receita Anual Recorrente",
      icon: TrendingUp,
      trend: `+${data.stats.growthRate}%`,
      trendUp: true,
      color: "text-blue-500",
    },
    {
      title: "Assinantes Ativos",
      value: formatNumber(data.stats.activeSubscribers),
      description: `de ${formatNumber(data.stats.totalCustomers)} clientes totais`,
      icon: Users,
      trend: `+${data.stats.trialUsers} em trial`,
      trendUp: true,
      color: "text-primary",
    },
    {
      title: "Churn Rate",
      value: `${data.stats.churnRate}%`,
      description: `${data.stats.churned} clientes cancelaram`,
      icon: UserMinus,
      trend: "-0.3% vs mês anterior",
      trendUp: false,
      color: "text-red-500",
    },
    {
      title: "ARPU",
      value: formatCurrency(data.stats.avgRevenuePerUser),
      description: "Receita média por usuário",
      icon: CreditCard,
      trend: "+R$ 12,50",
      trendUp: true,
      color: "text-amber-500",
    },
    {
      title: "LTV",
      value: formatCurrency(data.stats.ltv),
      description: "Lifetime Value médio",
      icon: Crown,
      trend: "+5.2%",
      trendUp: true,
      color: "text-purple-500",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Administrativo</h1>
          <p className="text-muted-foreground">Visão geral do SaaS ImobiERP</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`flex items-center text-xs font-medium ${
                      stat.trendUp ? "text-green-500" : "text-red-500"
                    }`}
                  >
                    {stat.trendUp ? (
                      <ArrowUpRight className="h-3 w-3 mr-0.5" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3 mr-0.5" />
                    )}
                    {stat.trend}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* MRR Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Evolução do MRR
            </CardTitle>
            <CardDescription>Receita Mensal Recorrente dos últimos 7 meses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.mrrChart}>
                  <defs>
                    <linearGradient id="mrrGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563eb" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickFormatter={(v) => `R$ ${(v / 100000).toFixed(0)}k`}
                    className="text-muted-foreground"
                  />
                  <RTooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="mrr"
                    name="MRR"
                    stroke="#2563eb"
                    fill="url(#mrrGradient)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Plan Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Distribuição de Planos
            </CardTitle>
            <CardDescription>Assinantes por plano</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.planDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, value }) => `${name}: ${value}`}
                    labelLine={false}
                  >
                    {data.planDistribution.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Pie>
                  <RTooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-4">
              {data.planDistribution.map((plan) => (
                <div key={plan.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: plan.color }} />
                    <span>{plan.name}</span>
                  </div>
                  <span className="font-medium">{plan.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue by Plan */}
      <Card>
        <CardHeader>
          <CardTitle>Receita por Plano (MRR)</CardTitle>
          <CardDescription>Contribuição de cada plano para a receita recorrente mensal</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.planDistribution.map((p: any) => ({
                  name: p.name,
                  mrr: 0,
                  subscribers: p.value,
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickFormatter={(v) => `R$ ${(v / 100000).toFixed(0)}k`}
                />
                <RTooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div className="rounded-lg border bg-card p-3 shadow-lg">
                        <p className="text-sm font-medium mb-1">{label}</p>
                        <p className="text-sm text-blue-500">
                          MRR: {formatCurrency(payload[0].value as number)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Assinantes: {(payload[0].payload as { subscribers: number }).subscribers}
                        </p>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="mrr" name="MRR" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Bottom row: Recent signups + Recent payments */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Signups */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Cadastros Recentes
            </CardTitle>
            <CardDescription>Últimos clientes cadastrados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.recentSignups.map((signup) => (
                <div key={signup.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">{signup.name}</p>
                    <p className="text-xs text-muted-foreground">{signup.company}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="text-xs">
                      {signup.plan}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(signup.date).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Payments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Pagamentos Recentes
            </CardTitle>
            <CardDescription>Últimas transações processadas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.recentPayments.map((payment) => {
                const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
                  succeeded: { label: "Sucesso", variant: "default" },
                  failed: { label: "Falhou", variant: "destructive" },
                  refunded: { label: "Reembolsado", variant: "secondary" },
                  pending: { label: "Pendente", variant: "outline" },
                };
                const st = statusMap[payment.status] || statusMap.pending;

                return (
                  <div key={payment.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="text-sm font-medium">{payment.customerName}</p>
                      <p className="text-xs text-muted-foreground">{payment.companyName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">{formatCurrency(payment.amount)}</p>
                      <Badge variant={st.variant} className="text-xs mt-1">
                        {st.label}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
