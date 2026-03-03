"use client";

import { useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  BarChart3, Download, FileText, DollarSign, Building2, Users, TrendingUp,
  PieChart, Calendar, FileSpreadsheet, FileDown, Loader2,
} from "lucide-react";
import { reportsApi, dashboardApi } from "@/lib/api-client";
import { useApiQuery } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";
import { RequireAuth } from "@/contexts/auth-context";

interface ReportCardProps {
  title: string; description: string; icon: React.ElementType; color: string;
  reportType: string; onGenerate: (type: string) => void; loading: boolean;
}

function ReportCard({ title, description, icon: Icon, color, reportType, onGenerate, loading }: ReportCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-lg ${color}`}><Icon className="h-6 w-6" /></div>
          <div className="flex-1">
            <h3 className="font-semibold mb-1">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => onGenerate(reportType)} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileDown className="h-4 w-4 mr-2" />} Gerar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function formatCurrency(v: number | null | undefined) { return v != null ? `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "R$ 0"; }

export function ReportsPage() {
  const { toast } = useToast();
  const [period, setPeriod] = useState("month");
  const [loadingReport, setLoadingReport] = useState<string | null>(null);
  const [reportData, setReportData] = useState<any>(null);
  const [customType, setCustomType] = useState("properties");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [customFormat, setCustomFormat] = useState("pdf");

  // Dashboard stats for quick overview
  const { data: dashData } = useApiQuery<any>(() => dashboardApi.get(), []);

  const stats = dashData?.data?.stats;

  const handleGenerate = async (type: string) => {
    setLoadingReport(type);
    try {
      const params: Record<string, string> = { period };
      if (customStartDate) params.startDate = customStartDate;
      if (customEndDate) params.endDate = customEndDate;
      const result = await reportsApi.get(type, params);
      setReportData({ type, ...(result.data || result) });
      toast({ title: "Relatório gerado!", description: `Relatório de ${type} gerado com sucesso.` });
    } catch {
      toast({ title: "Erro ao gerar relatório", variant: "destructive" });
    }
    setLoadingReport(null);
  };

  const handleCustomReport = async () => {
    const params: Record<string, string> = { format: customFormat };
    if (customStartDate) params.startDate = customStartDate;
    if (customEndDate) params.endDate = customEndDate;
    setLoadingReport("custom");
    try {
      const result = await reportsApi.get(customType, params);
      setReportData({ type: customType, ...(result.data || result) });
      toast({ title: "Relatório gerado!" });
    } catch {
      toast({ title: "Erro ao gerar relatório", variant: "destructive" });
    }
    setLoadingReport(null);
  };

  return (
    <RequireAuth><AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div><h1 className="text-2xl font-bold">Relatórios</h1><p className="text-muted-foreground">Gere relatórios e análises do seu negócio</p></div>
          <Select value={period} onValueChange={setPeriod}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="week">Esta semana</SelectItem><SelectItem value="month">Este mês</SelectItem><SelectItem value="quarter">Este trimestre</SelectItem><SelectItem value="year">Este ano</SelectItem></SelectContent>
          </Select>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Receita Total</p><p className="text-2xl font-bold">{formatCurrency(stats?.totalRevenue)}</p></div><DollarSign className="h-8 w-8 text-green-500" /></div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Imóveis Ativos</p><p className="text-2xl font-bold">{stats?.totalProperties ?? 0}</p></div><Building2 className="h-8 w-8 text-primary" /></div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Taxa de Ocupação</p><p className="text-2xl font-bold">{stats?.occupancyRate ?? 0}%</p></div><PieChart className="h-8 w-8 text-blue-500" /></div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Inadimplência</p><p className="text-2xl font-bold">{stats?.overdueRate ?? 0}%</p></div><TrendingUp className="h-8 w-8 text-amber-500" /></div></CardContent></Card>
        </div>

        {/* Financial Reports */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Relatórios Financeiros</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <ReportCard title="Receita por Período" description="Análise detalhada de receitas e despesas" icon={DollarSign} color="bg-green-500/10 text-green-500" reportType="revenue" onGenerate={handleGenerate} loading={loadingReport === "revenue"} />
            <ReportCard title="Fluxo de Caixa" description="Entradas e saídas de recursos financeiros" icon={TrendingUp} color="bg-blue-500/10 text-blue-500" reportType="cashflow" onGenerate={handleGenerate} loading={loadingReport === "cashflow"} />
            <ReportCard title="Cobranças Pendentes" description="Relatório de cobranças pendentes e vencidas" icon={FileText} color="bg-amber-500/10 text-amber-500" reportType="pending_charges" onGenerate={handleGenerate} loading={loadingReport === "pending_charges"} />
            <ReportCard title="Inadimplência" description="Inquilinos em atraso e valores devidos" icon={BarChart3} color="bg-red-500/10 text-red-500" reportType="delinquency" onGenerate={handleGenerate} loading={loadingReport === "delinquency"} />
          </div>
        </div>

        {/* Property Reports */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Relatórios de Imóveis</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <ReportCard title="Ocupação de Imóveis" description="Taxa de ocupação por tipo e região" icon={Building2} color="bg-primary/10 text-primary" reportType="occupancy" onGenerate={handleGenerate} loading={loadingReport === "occupancy"} />
            <ReportCard title="Performance por Imóvel" description="Rendimento e histórico de cada imóvel" icon={PieChart} color="bg-purple-500/10 text-purple-500" reportType="property_performance" onGenerate={handleGenerate} loading={loadingReport === "property_performance"} />
            <ReportCard title="Manutenções" description="Histórico de manutenções e custos" icon={FileText} color="bg-gray-500/10 text-gray-500" reportType="maintenance" onGenerate={handleGenerate} loading={loadingReport === "maintenance"} />
            <ReportCard title="Vencimento de Contratos" description="Contratos próximos do vencimento" icon={Calendar} color="bg-amber-500/10 text-amber-500" reportType="expiring_contracts" onGenerate={handleGenerate} loading={loadingReport === "expiring_contracts"} />
          </div>
        </div>

        {/* People Reports */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Relatórios de Pessoas</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <ReportCard title="Cadastro de Inquilinos" description="Lista completa de inquilinos" icon={Users} color="bg-blue-500/10 text-blue-500" reportType="tenants_list" onGenerate={handleGenerate} loading={loadingReport === "tenants_list"} />
            <ReportCard title="Cadastro de Proprietários" description="Lista completa de proprietários" icon={Users} color="bg-green-500/10 text-green-500" reportType="owners_list" onGenerate={handleGenerate} loading={loadingReport === "owners_list"} />
            <ReportCard title="Histórico de Locação" description="Histórico de locação por inquilino" icon={FileText} color="bg-amber-500/10 text-amber-500" reportType="rental_history" onGenerate={handleGenerate} loading={loadingReport === "rental_history"} />
            <ReportCard title="Repasse a Proprietários" description="Valores a repassar para cada proprietário" icon={DollarSign} color="bg-primary/10 text-primary" reportType="owner_payments" onGenerate={handleGenerate} loading={loadingReport === "owner_payments"} />
          </div>
        </div>

        {/* Custom Report */}
        <Card>
          <CardHeader><CardTitle className="text-base">Relatório Personalizado</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-4">
              <Select value={customType} onValueChange={setCustomType}><SelectTrigger className="w-48"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="properties">Imóveis</SelectItem><SelectItem value="tenants">Inquilinos</SelectItem><SelectItem value="owners">Proprietários</SelectItem><SelectItem value="contracts">Contratos</SelectItem><SelectItem value="charges">Cobranças</SelectItem></SelectContent></Select>
              <Input type="date" className="w-36" value={customStartDate} onChange={(e) => setCustomStartDate(e.target.value)} />
              <Input type="date" className="w-36" value={customEndDate} onChange={(e) => setCustomEndDate(e.target.value)} />
              <Select value={customFormat} onValueChange={setCustomFormat}><SelectTrigger className="w-32"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="pdf">PDF</SelectItem><SelectItem value="xlsx">Excel</SelectItem><SelectItem value="csv">CSV</SelectItem></SelectContent></Select>
              <Button onClick={handleCustomReport} disabled={loadingReport === "custom"}>
                {loadingReport === "custom" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileSpreadsheet className="h-4 w-4 mr-2" />}Gerar Relatório
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Report Result Preview */}
        {reportData && (
          <Card>
            <CardHeader><CardTitle className="text-base">Resultado: {reportData.type}</CardTitle></CardHeader>
            <CardContent>
              {reportData.rows ? (
                <Table>
                  <TableHeader><TableRow>{reportData.columns?.map((col: string) => <TableHead key={col}>{col}</TableHead>)}</TableRow></TableHeader>
                  <TableBody>{reportData.rows.map((row: any, i: number) => <TableRow key={i}>{reportData.columns?.map((col: string) => <TableCell key={col}>{row[col] ?? "-"}</TableCell>)}</TableRow>)}</TableBody>
                </Table>
              ) : reportData.summary ? (
                <div className="grid gap-4 md:grid-cols-3">
                  {Object.entries(reportData.summary).map(([key, value]) => (
                    <div key={key} className="p-4 bg-muted rounded-lg"><p className="text-sm text-muted-foreground">{key}</p><p className="text-xl font-bold">{String(value)}</p></div>
                  ))}
                </div>
              ) : (
                <pre className="text-sm p-4 bg-muted rounded-lg overflow-auto max-h-96">{JSON.stringify(reportData, null, 2)}</pre>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout></RequireAuth>
  );
}
