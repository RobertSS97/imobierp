"use client";

import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import {
  Search,
  DollarSign,
  TrendingUp,
  AlertCircle,
  RotateCcw,
  CreditCard,
  Eye,
  ExternalLink,
  Copy,
  Wallet,
  QrCode,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { toast } from "sonner";

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

interface Payment {
  id: string;
  customerId: string;
  customerName: string;
  companyName: string;
  planName: string;
  amount: number;
  currency: string;
  status: string;
  stripeInvoiceId: string;
  stripePaymentIntentId: string;
  method: string;
  cardLast4: string | null;
  createdAt: string;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: typeof CheckCircle2 }> = {
  succeeded: { label: "Sucesso", variant: "default", icon: CheckCircle2 },
  failed: { label: "Falhou", variant: "destructive", icon: XCircle },
  refunded: { label: "Reembolsado", variant: "secondary", icon: RotateCcw },
  pending: { label: "Pendente", variant: "outline", icon: Clock },
};

const methodConfig: Record<string, { label: string; icon: typeof CreditCard }> = {
  credit_card: { label: "Cartão de Crédito", icon: CreditCard },
  pix: { label: "Pix", icon: QrCode },
  boleto: { label: "Boleto", icon: FileText },
};

export function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [methodFilter, setMethodFilter] = useState<string>("all");
  const [detailPayment, setDetailPayment] = useState<Payment | null>(null);

  useEffect(() => {
    fetch("/api/admin/payments", { credentials: "include" })
      .then(r => r.json())
      .then(j => { if (j.data) setPayments(j.data); })
      .catch(e => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return payments.filter((p) => {
      const matchSearch =
        !search ||
        p.customerName.toLowerCase().includes(search.toLowerCase()) ||
        p.companyName.toLowerCase().includes(search.toLowerCase()) ||
        p.stripeInvoiceId.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || p.status === statusFilter;
      const matchMethod = methodFilter === "all" || p.method === methodFilter;
      return matchSearch && matchStatus && matchMethod;
    });
  }, [payments, search, statusFilter, methodFilter]);

  const stats = useMemo(() => {
    const succeeded = payments.filter((p) => p.status === "succeeded");
    const failed = payments.filter((p) => p.status === "failed");
    const refunded = payments.filter((p) => p.status === "refunded");
    return {
      totalRevenue: succeeded.reduce((sum, p) => sum + p.amount, 0),
      succeededCount: succeeded.length,
      failedCount: failed.length,
      failedAmount: failed.reduce((sum, p) => sum + p.amount, 0),
      refundedCount: refunded.length,
      refundedAmount: refunded.reduce((sum, p) => sum + p.amount, 0),
    };
  }, [payments]);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pagamentos</h1>
          <p className="text-muted-foreground">Todas as transações e cobranças processadas via Stripe</p>
        </div>
        <Button
          variant="outline"
          onClick={() =>
            window.open("https://dashboard.stripe.com/payments", "_blank")
          }
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          Abrir Stripe
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Receita Total</p>
                <p className="text-2xl font-bold text-green-500">{formatCurrency(stats.totalRevenue)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pagamentos</p>
                <p className="text-2xl font-bold">{stats.succeededCount}</p>
                <p className="text-xs text-muted-foreground">com sucesso</p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Falhas</p>
                <p className="text-2xl font-bold text-red-500">{stats.failedCount}</p>
                <p className="text-xs text-muted-foreground">{formatCurrency(stats.failedAmount)}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Reembolsos</p>
                <p className="text-2xl font-bold text-amber-500">{stats.refundedCount}</p>
                <p className="text-xs text-muted-foreground">{formatCurrency(stats.refundedAmount)}</p>
              </div>
              <RotateCcw className="h-8 w-8 text-amber-500" />
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
                placeholder="Buscar por cliente, empresa ou ID da invoice..."
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
                <SelectItem value="succeeded">Sucesso</SelectItem>
                <SelectItem value="failed">Falha</SelectItem>
                <SelectItem value="refunded">Reembolsado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={methodFilter} onValueChange={setMethodFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Método" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="credit_card">Cartão</SelectItem>
                <SelectItem value="pix">Pix</SelectItem>
                <SelectItem value="boleto">Boleto</SelectItem>
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
                <TableHead>Data</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Invoice</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((payment) => {
                const st = statusConfig[payment.status] || statusConfig.pending;
                const method = methodConfig[payment.method] || methodConfig.credit_card;
                const MethodIcon = method.icon;
                return (
                  <TableRow key={payment.id}>
                    <TableCell className="text-sm">
                      {new Date(payment.createdAt).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{payment.customerName}</p>
                        <p className="text-xs text-muted-foreground">{payment.companyName}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{payment.planName}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm">
                        <MethodIcon className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{method.label}</span>
                        {payment.cardLast4 && (
                          <span className="text-xs text-muted-foreground">
                            •••• {payment.cardLast4}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-bold">{formatCurrency(payment.amount)}</TableCell>
                    <TableCell>
                      <Badge variant={st.variant}>{st.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                        {payment.stripeInvoiceId}
                      </code>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setDetailPayment(payment)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Nenhum pagamento encontrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detail dialog */}
      <Dialog open={!!detailPayment} onOpenChange={(v) => !v && setDetailPayment(null)}>
        <DialogContent className="max-w-lg">
          {detailPayment && (() => {
            const st = statusConfig[detailPayment.status] || statusConfig.pending;
            const method = methodConfig[detailPayment.method] || methodConfig.credit_card;
            const MethodIcon = method.icon;
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    Detalhes do Pagamento
                    <Badge variant={st.variant}>{st.label}</Badge>
                  </DialogTitle>
                  <DialogDescription>
                    {new Date(detailPayment.createdAt).toLocaleString("pt-BR")}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="text-center">
                    <p className="text-4xl font-bold">{formatCurrency(detailPayment.amount)}</p>
                  </div>

                  <Separator />

                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Cliente</span>
                      <span className="font-medium">{detailPayment.customerName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Empresa</span>
                      <span>{detailPayment.companyName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Plano</span>
                      <Badge variant="outline">{detailPayment.planName}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Método</span>
                      <span className="flex items-center gap-1.5">
                        <MethodIcon className="h-4 w-4" />
                        {method.label}
                        {detailPayment.cardLast4 && ` •••• ${detailPayment.cardLast4}`}
                      </span>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Invoice ID</span>
                      <div className="flex items-center gap-1">
                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                          {detailPayment.stripeInvoiceId}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => {
                            navigator.clipboard.writeText(detailPayment.stripeInvoiceId);
                            toast.success("Copiado!");
                          }}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Payment Intent</span>
                      <div className="flex items-center gap-1">
                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                          {detailPayment.stripePaymentIntentId}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => {
                            navigator.clipboard.writeText(detailPayment.stripePaymentIntentId);
                            toast.success("Copiado!");
                          }}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() =>
                        window.open(
                          `https://dashboard.stripe.com/invoices/${detailPayment.stripeInvoiceId}`,
                          "_blank"
                        )
                      }
                    >
                      <ExternalLink className="h-4 w-4 mr-2" /> Ver no Stripe
                    </Button>
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
