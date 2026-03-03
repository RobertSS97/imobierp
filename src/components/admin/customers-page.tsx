"use client";

import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Search,
  MoreHorizontal,
  Eye,
  Pencil,
  UserMinus,
  CreditCard,
  Users,
  UserCheck,
  UserX,
  Clock,
  Building2,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  HardDrive,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

interface CustomerUsage {
  properties: number;
  tenants: number;
  owners: number;
  contracts: number;
  storageUsedMB: number;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  companyName: string;
  planId: string;
  planName: string;
  status: string;
  stripeCustomerId: string;
  subscriptionStatus: string;
  currentPeriodEnd: string;
  propertiesCount: number;
  tenantsCount: number;
  usage: CustomerUsage;
  totalPaid: number;
  lastPayment: string | null;
  createdAt: string;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: typeof UserCheck }> = {
  active: { label: "Ativo", variant: "default", icon: UserCheck },
  trialing: { label: "Em Trial", variant: "outline", icon: Clock },
  inactive: { label: "Inativo", variant: "secondary", icon: UserX },
};

const subStatusConfig: Record<string, { label: string; color: string }> = {
  active: { label: "Ativa", color: "text-green-500" },
  trialing: { label: "Trial", color: "text-blue-500" },
  past_due: { label: "Pagamento Pendente", color: "text-amber-500" },
  canceled: { label: "Cancelada", color: "text-red-500" },
  unpaid: { label: "Não Pago", color: "text-red-500" },
};

export function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [detailCustomer, setDetailCustomer] = useState<Customer | null>(null);
  const [changePlanDialogOpen, setChangePlanDialogOpen] = useState(false);
  const [changePlanCustomer, setChangePlanCustomer] = useState<Customer | null>(null);
  const [newPlanId, setNewPlanId] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/customers", { credentials: "include" }).then(r => r.json()),
      fetch("/api/admin/plans", { credentials: "include" }).then(r => r.json()),
    ]).then(([cj, pj]) => {
      if (cj.data) setCustomers(cj.data);
      if (pj.data) setPlans(pj.data);
    }).catch(e => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return customers.filter((c) => {
      const matchSearch =
        !search ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase()) ||
        c.companyName.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || c.status === statusFilter;
      const matchPlan = planFilter === "all" || c.planId === planFilter;
      return matchSearch && matchStatus && matchPlan;
    });
  }, [customers, search, statusFilter, planFilter]);

  const stats = useMemo(() => ({
    total: customers.length,
    active: customers.filter((c) => c.status === "active").length,
    trialing: customers.filter((c) => c.status === "trialing").length,
    inactive: customers.filter((c) => c.status === "inactive").length,
  }), [customers]);

  const handleChangePlan = () => {
    if (!changePlanCustomer || !newPlanId) return;
    const plan = plans.find((p: any) => p.id === newPlanId);
    if (!plan) return;

    setCustomers((prev) =>
      prev.map((c) =>
        c.id === changePlanCustomer.id ? { ...c, planId: plan.id, planName: plan.name } : c
      )
    );
    toast.success(`Plano de ${changePlanCustomer.name} alterado para ${plan.name}`);
    setChangePlanDialogOpen(false);
    setChangePlanCustomer(null);
    setNewPlanId("");
  };

  const handleCancelSubscription = (customer: Customer) => {
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === customer.id
          ? { ...c, status: "inactive" as const, subscriptionStatus: "canceled" as const }
          : c
      )
    );
    toast.success(`Assinatura de ${customer.name} cancelada`);
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground">Gerencie todos os clientes e suas assinaturas</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ativos</p>
                <p className="text-2xl font-bold text-green-500">{stats.active}</p>
              </div>
              <UserCheck className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Em Trial</p>
                <p className="text-2xl font-bold text-blue-500">{stats.trialing}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Inativos</p>
                <p className="text-2xl font-bold text-red-500">{stats.inactive}</p>
              </div>
              <UserX className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, e-mail ou empresa..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="trialing">Em Trial</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
              </SelectContent>
            </Select>
            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Plano" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {plans.map((plan: any) => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {plan.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Assinatura</TableHead>
                <TableHead>Imóveis</TableHead>
                <TableHead>Total Pago</TableHead>
                <TableHead>Cliente desde</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((customer) => {
                const st = statusConfig[customer.status] || statusConfig.active;
                const sub = subStatusConfig[customer.subscriptionStatus] || subStatusConfig.active;

                return (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{customer.name}</p>
                        <p className="text-xs text-muted-foreground">{customer.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>{customer.companyName}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{customer.planName}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className={`text-sm font-medium ${sub.color}`}>{sub.label}</span>
                    </TableCell>
                    <TableCell>{customer.propertiesCount}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(customer.totalPaid)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(customer.createdAt).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setDetailCustomer(customer)}>
                            <Eye className="mr-2 h-4 w-4" /> Ver Detalhes
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setChangePlanCustomer(customer);
                              setNewPlanId(customer.planId);
                              setChangePlanDialogOpen(true);
                            }}
                          >
                            <CreditCard className="mr-2 h-4 w-4" /> Alterar Plano
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              window.open(
                                `https://dashboard.stripe.com/customers/${customer.stripeCustomerId}`,
                                "_blank"
                              )
                            }
                          >
                            <ExternalLink className="mr-2 h-4 w-4" /> Ver no Stripe
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {customer.status !== "inactive" && (
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleCancelSubscription(customer)}
                            >
                              <UserMinus className="mr-2 h-4 w-4" /> Cancelar Assinatura
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Nenhum cliente encontrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!detailCustomer} onOpenChange={(v) => !v && setDetailCustomer(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {detailCustomer && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {detailCustomer.name}
                  <Badge variant={statusConfig[detailCustomer.status]?.variant || "default"}>
                    {statusConfig[detailCustomer.status]?.label}
                  </Badge>
                </DialogTitle>
                <DialogDescription>{detailCustomer.companyName}</DialogDescription>
              </DialogHeader>

              <Tabs defaultValue="info" className="mt-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="info">Informações</TabsTrigger>
                  <TabsTrigger value="usage">Uso</TabsTrigger>
                  <TabsTrigger value="billing">Faturamento</TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{detailCustomer.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{detailCustomer.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span>{detailCustomer.companyName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>
                        Cliente desde{" "}
                        {new Date(detailCustomer.createdAt).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Stripe</h4>
                    <div className="grid grid-cols-1 gap-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Customer ID:</span>
                        <code className="bg-muted px-2 py-0.5 rounded text-xs">
                          {detailCustomer.stripeCustomerId}
                        </code>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Status assinatura:</span>
                        <span
                          className={`font-medium ${
                            subStatusConfig[detailCustomer.subscriptionStatus]?.color
                          }`}
                        >
                          {subStatusConfig[detailCustomer.subscriptionStatus]?.label}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Próxima cobrança:</span>
                        <span>
                          {new Date(detailCustomer.currentPeriodEnd).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="usage" className="space-y-4 pt-4">
                  {(() => {
                    const plan = plans.find((p: any) => p.id === detailCustomer.planId);
                    if (!plan) return null;
                    const usage = detailCustomer.usage;
                    const items = [
                      { label: "Imóveis", used: usage.properties, limit: plan.limits.properties },
                      { label: "Inquilinos", used: usage.tenants, limit: plan.limits.tenants },
                      { label: "Proprietários", used: usage.owners, limit: plan.limits.owners },
                      { label: "Contratos", used: usage.contracts, limit: plan.limits.contracts },
                    ];

                    return (
                      <div className="space-y-4">
                        {items.map((item) => {
                          const unlimited = item.limit === -1;
                          const pct = unlimited ? (item.used > 0 ? 20 : 0) : Math.min(100, (item.used / item.limit) * 100);
                          const warn = !unlimited && pct >= 80;
                          return (
                            <div key={item.label} className="space-y-1">
                              <div className="flex items-center justify-between text-sm">
                                <span>{item.label}</span>
                                <span className={warn ? "text-amber-500 font-medium" : ""}>
                                  {item.used} / {unlimited ? "∞" : item.limit}
                                </span>
                              </div>
                              <Progress value={pct} className={warn ? "[&>div]:bg-amber-500" : ""} />
                            </div>
                          );
                        })}

                        <Separator />

                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-1.5">
                              <HardDrive className="h-4 w-4" /> Armazenamento
                            </span>
                            <span>
                              {(usage.storageUsedMB / 1024).toFixed(2)} GB / {plan.limits.storageGB} GB
                            </span>
                          </div>
                          <Progress
                            value={Math.min(
                              100,
                              (usage.storageUsedMB / (plan.limits.storageGB * 1024)) * 100
                            )}
                          />
                        </div>
                      </div>
                    );
                  })()}
                </TabsContent>

                <TabsContent value="billing" className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="pt-4">
                        <p className="text-sm text-muted-foreground">Plano Atual</p>
                        <p className="text-xl font-bold">{detailCustomer.planName}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <p className="text-sm text-muted-foreground">Total Pago</p>
                        <p className="text-xl font-bold">{formatCurrency(detailCustomer.totalPaid)}</p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="text-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Último pagamento:</span>
                      <span>
                        {detailCustomer.lastPayment
                          ? new Date(detailCustomer.lastPayment).toLocaleDateString("pt-BR")
                          : "—"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Próxima cobrança:</span>
                      <span>
                        {new Date(detailCustomer.currentPeriodEnd).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setDetailCustomer(null);
                        setChangePlanCustomer(detailCustomer);
                        setNewPlanId(detailCustomer.planId);
                        setChangePlanDialogOpen(true);
                      }}
                    >
                      <CreditCard className="h-4 w-4 mr-2" /> Alterar Plano
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() =>
                        window.open(
                          `https://dashboard.stripe.com/customers/${detailCustomer.stripeCustomerId}`,
                          "_blank"
                        )
                      }
                    >
                      <ExternalLink className="h-4 w-4 mr-2" /> Stripe
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Change plan dialog */}
      <Dialog open={changePlanDialogOpen} onOpenChange={setChangePlanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Plano</DialogTitle>
            <DialogDescription>
              Alterar o plano de {changePlanCustomer?.name} ({changePlanCustomer?.companyName})
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Plano atual</Label>
              <p className="text-sm font-medium">{changePlanCustomer?.planName}</p>
            </div>
            <div className="space-y-2">
              <Label>Novo plano</Label>
              <Select value={newPlanId} onValueChange={setNewPlanId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o plano" />
                </SelectTrigger>
                <SelectContent>
                  {plans.filter((p: any) => p.active).map((plan: any) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name} — {formatCurrency(plan.priceMonthly)}/mês
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setChangePlanDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleChangePlan}>Confirmar Alteração</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
