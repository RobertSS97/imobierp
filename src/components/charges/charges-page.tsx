"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus, Search, MoreHorizontal, Edit, Trash2, DollarSign, Send, MessageCircle,
  CheckCircle2, Clock, AlertTriangle, Receipt, Loader2,
} from "lucide-react";
import type { ChargeStatus, ChargeType } from "@/types";
import { chargesApi, tenantsApi, contractsApi, propertiesApi, whatsappApi } from "@/lib/api-client";
import { useApiList, useApiMutation } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";
import { RequireAuth } from "@/contexts/auth-context";

const chargeStatusLabels: Record<ChargeStatus, string> = { pending: "Pendente", paid: "Pago", overdue: "Vencido", cancelled: "Cancelado" };
const chargeStatusColors: Record<ChargeStatus, string> = { pending: "bg-amber-500/10 text-amber-500", paid: "bg-green-500/10 text-green-500", overdue: "bg-red-500/10 text-red-500", cancelled: "bg-gray-500/10 text-gray-500" };
const chargeTypeLabels: Record<ChargeType, string> = { rent: "Aluguel", condo_fee: "Condomínio", iptu: "IPTU", water: "Água", electricity: "Energia", gas: "Gás", other: "Outros" };

function formatCurrency(v: number | null | undefined) { return v != null ? `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "-"; }
function formatDate(d: string | null | undefined) { return d ? new Date(d).toLocaleDateString("pt-BR") : "-"; }

const emptyForm = {
  tenantId: "", contractId: "", propertyId: "", type: "",
  value: "", dueDate: "", penaltyPercent: "", interestPercent: "", description: "",
};

export function ChargesPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isWhatsAppDialogOpen, setIsWhatsAppDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [formData, setFormData] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [whatsappFilter, setWhatsappFilter] = useState("pending");
  const [whatsappMessage, setWhatsappMessage] = useState("Olá {nome}, sua cobrança no valor de R$ {valor} vence em {data}.");

  const [tenantsList, setTenantsList] = useState<any[]>([]);
  const [contractsList, setContractsList] = useState<any[]>([]);
  const [propertiesList, setPropertiesList] = useState<any[]>([]);
  const [autoFilled, setAutoFilled] = useState(false);

  useEffect(() => {
    tenantsApi.list({ limit: "500" }).then((r: any) => setTenantsList(r.data || [])).catch(() => {});
    contractsApi.list({ limit: "500" }).then((r: any) => setContractsList(r.data || [])).catch(() => {});
    propertiesApi.list({ limit: "500" }).then((r: any) => setPropertiesList(r.data || [])).catch(() => {});
  }, []);

  // Auto-preencher contrato, imóvel e valor ao selecionar inquilino
  const handleTenantChange = (tenantId: string) => {
    setFormData((prev) => ({ ...prev, tenantId }));
    if (!tenantId || editingId) return;

    // Buscar contrato ativo deste inquilino
    const activeContract = contractsList.find(
      (c: any) => c.tenantId === tenantId && c.status === "active"
    );
    if (activeContract) {
      setFormData((prev) => ({
        ...prev,
        tenantId,
        contractId: activeContract.id,
        propertyId: activeContract.propertyId || "",
        value: prev.value || (activeContract.rentValue?.toString() || ""),
        type: prev.type || "rent",
      }));
      setAutoFilled(true);
    }
  };

  // Auto-preencher imóvel e valor ao selecionar contrato manualmente
  const handleContractChange = (contractId: string) => {
    setFormData((prev) => ({ ...prev, contractId }));
    if (!contractId || editingId) return;

    const contract = contractsList.find((c: any) => c.id === contractId);
    if (contract) {
      setFormData((prev) => ({
        ...prev,
        contractId,
        tenantId: prev.tenantId || contract.tenantId || "",
        propertyId: contract.propertyId || "",
        value: prev.value || (contract.rentValue?.toString() || ""),
        type: prev.type || "rent",
      }));
      setAutoFilled(true);
    }
  };

  const queryParams: Record<string, string> = { page: String(page), limit: "20" };
  if (search) queryParams.search = search;
  if (statusFilter !== "all") queryParams.status = statusFilter;
  if (typeFilter !== "all") queryParams.type = typeFilter;

  const { items: charges, pagination, stats, isLoading, refetch } = useApiList<any>(() => chargesApi.list(queryParams), [page, search, statusFilter, typeFilter]);

  const createMutation = useApiMutation((data: any) => chargesApi.create(data), {
    onSuccess: () => { toast({ title: "Cobrança criada!" }); setIsDialogOpen(false); setFormData(emptyForm); refetch(); },
    onError: (err) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });
  const updateMutation = useApiMutation(({ id, data }: { id: string; data: any }) => chargesApi.update(id, data), {
    onSuccess: () => { toast({ title: "Cobrança atualizada!" }); setIsDialogOpen(false); setFormData(emptyForm); setEditingId(null); refetch(); },
    onError: (err) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });
  const deleteMutation = useApiMutation((id: string) => chargesApi.delete(id), {
    onSuccess: () => { toast({ title: "Cobrança excluída!" }); refetch(); },
    onError: (err) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const updateField = (field: string, value: string) => setFormData((p) => ({ ...p, [field]: value }));

  const handleSubmit = async () => {
    const payload = {
      ...formData,
      value: formData.value ? Number(formData.value) : undefined,
      penaltyPercent: formData.penaltyPercent ? Number(formData.penaltyPercent) : undefined,
      interestPercent: formData.interestPercent ? Number(formData.interestPercent) : undefined,
      dueDate: formData.dueDate || undefined,
      tenantId: formData.tenantId || undefined,
      contractId: formData.contractId || undefined,
      propertyId: formData.propertyId || undefined,
      type: formData.type || undefined,
    };
    if (editingId) await updateMutation.mutate({ id: editingId, data: payload }); else await createMutation.mutate(payload);
  };

  const handleEdit = async (id: string) => {
    try {
      const response = await chargesApi.get(id);
      const c = response.data;
      setFormData({
        tenantId: c.tenantId || "", contractId: c.contractId || "", propertyId: c.propertyId || "",
        type: c.type || "", value: c.value?.toString() || "", dueDate: c.dueDate ? new Date(c.dueDate).toISOString().split("T")[0] : "",
        penaltyPercent: c.penaltyPercent?.toString() || "", interestPercent: c.interestPercent?.toString() || "",
        description: c.description || "",
      });
      setEditingId(id); setIsDialogOpen(true);
    } catch { toast({ title: "Erro ao carregar", variant: "destructive" }); }
  };

  const handleDelete = async (id: string) => { if (confirm("Excluir esta cobrança?")) await deleteMutation.mutate(id); };

  const handleMarkPaid = async (id: string) => {
    try { await chargesApi.update(id, { status: "paid", paidAt: new Date().toISOString() }); toast({ title: "Marcado como pago!" }); refetch(); }
    catch { toast({ title: "Erro", variant: "destructive" }); }
  };

  const handleSendWhatsApp = async (chargeId: string) => {
    try { await whatsappApi.send(chargeId); toast({ title: "WhatsApp enviado!" }); }
    catch { toast({ title: "Erro ao enviar WhatsApp", variant: "destructive" }); }
  };

  const handleBulkWhatsApp = async () => {
    const filtered = charges.filter((c: any) => whatsappFilter === "both" ? ["pending", "overdue"].includes(c.status) : c.status === whatsappFilter);
    if (filtered.length === 0) { toast({ title: "Nenhuma cobrança encontrada", variant: "destructive" }); return; }
    try { await whatsappApi.sendBulk(filtered.map((c: any) => c.id)); toast({ title: `${filtered.length} mensagens enviadas!` }); setIsWhatsAppDialogOpen(false); }
    catch { toast({ title: "Erro ao enviar", variant: "destructive" }); }
  };

  const isSaving = createMutation.isLoading || updateMutation.isLoading;
  const pendingTotal = stats?.totalPending ?? 0;
  const overdueTotal = stats?.totalOverdue ?? 0;
  const paidTotal = stats?.totalPaidMonth ?? 0;
  const totalCharges = stats?.totalChargesMonth ?? charges.length;

  return (
    <RequireAuth><AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div><h1 className="text-2xl font-bold">Cobranças</h1><p className="text-muted-foreground">Gerencie todas as cobranças e pagamentos</p></div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setIsWhatsAppDialogOpen(true)}><MessageCircle className="h-4 w-4 mr-2" />WhatsApp em Massa</Button>
            <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) { setFormData(emptyForm); setEditingId(null); setAutoFilled(false); } }}>
              <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Nova Cobrança</Button></DialogTrigger>
              <DialogContent className="max-w-[95vw] w-fit min-w-[min(42rem,95vw)] max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle>{editingId ? "Editar" : "Nova"} Cobrança</DialogTitle><DialogDescription>Preencha os dados. Ao selecionar um inquilino, o contrato, imóvel e valor serão preenchidos automaticamente.</DialogDescription></DialogHeader>
                <div className="grid gap-4 py-4">
                  {autoFilled && !editingId && (
                    <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-primary">
                      ✓ Contrato, imóvel e valor preenchidos automaticamente com base no inquilino selecionado.
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Inquilino *</Label>
                      <Select value={formData.tenantId} onValueChange={handleTenantChange}>
                        <SelectTrigger><SelectValue placeholder="Selecione o inquilino" /></SelectTrigger>
                        <SelectContent>{tenantsList.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2"><Label>Contrato {autoFilled && !editingId ? "(auto)" : ""}</Label>
                      <Select value={formData.contractId} onValueChange={handleContractChange}>
                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>
                          {(formData.tenantId
                            ? contractsList.filter((c: any) => c.tenantId === formData.tenantId)
                            : contractsList
                          ).map((c: any) => (
                            <SelectItem key={c.id} value={c.id}>
                              #{c.id.slice(-6)} — {c.tenant?.name || ""} — {c.property?.title || ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Imóvel {autoFilled && !editingId ? "(auto)" : ""}</Label>
                      <Select value={formData.propertyId} onValueChange={(v) => updateField("propertyId", v)}>
                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>{propertiesList.map((p: any) => (
                          <SelectItem key={p.id} value={p.id}>
                            <span className="flex items-center gap-2">
                              <span className={`inline-block h-2 w-2 rounded-full flex-shrink-0 ${
                                p.status === "rented" ? "bg-red-500" :
                                p.status === "available" ? "bg-green-500" :
                                p.status === "maintenance" ? "bg-amber-500" : "bg-gray-400"
                              }`} />
                              {p.title || p.addressStreet}
                              <span className={`text-xs ${
                                p.status === "rented" ? "text-red-500" :
                                p.status === "available" ? "text-green-500" :
                                p.status === "maintenance" ? "text-amber-500" : "text-gray-400"
                              }`}>({p.status === "rented" ? "Alugado" : p.status === "available" ? "Disponível" : p.status === "maintenance" ? "Manutenção" : "Inativo"})</span>
                            </span>
                          </SelectItem>
                        ))}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2"><Label>Tipo *</Label>
                      <Select value={formData.type} onValueChange={(v) => updateField("type", v)}>
                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>{Object.entries(chargeTypeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Valor * {autoFilled && !editingId ? "(auto)" : ""}</Label><Input type="number" value={formData.value} onChange={(e) => updateField("value", e.target.value)} placeholder="R$ 0,00" /></div>
                    <div className="space-y-2"><Label>Vencimento *</Label><Input type="date" value={formData.dueDate} onChange={(e) => updateField("dueDate", e.target.value)} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Multa (%)</Label><Input type="number" value={formData.penaltyPercent} onChange={(e) => updateField("penaltyPercent", e.target.value)} /></div>
                    <div className="space-y-2"><Label>Juros (%/mês)</Label><Input type="number" value={formData.interestPercent} onChange={(e) => updateField("interestPercent", e.target.value)} /></div>
                  </div>
                  <div className="space-y-2"><Label>Descrição</Label><Textarea value={formData.description} onChange={(e) => updateField("description", e.target.value)} rows={3} /></div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                  <Button onClick={handleSubmit} disabled={isSaving}>{isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}{editingId ? "Salvar" : "Criar Cobrança"}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Total Pendente</p><p className="text-2xl font-bold">{formatCurrency(pendingTotal)}</p></div><Clock className="h-8 w-8 text-amber-500" /></div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Total Vencido</p><p className="text-2xl font-bold">{formatCurrency(overdueTotal)}</p></div><AlertTriangle className="h-8 w-8 text-red-500" /></div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Total Pago (Mês)</p><p className="text-2xl font-bold">{formatCurrency(paidTotal)}</p></div><CheckCircle2 className="h-8 w-8 text-green-500" /></div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Cobranças do Mês</p><p className="text-2xl font-bold">{totalCharges}</p></div><Receipt className="h-8 w-8 text-primary" /></div></CardContent></Card>
        </div>

        {/* Filters */}
        <Card><CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Buscar..." className="pl-9" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} /></div></div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}><SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="all">Todos</SelectItem><SelectItem value="pending">Pendente</SelectItem><SelectItem value="paid">Pago</SelectItem><SelectItem value="overdue">Vencido</SelectItem><SelectItem value="cancelled">Cancelado</SelectItem></SelectContent></Select>
            <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}><SelectTrigger className="w-40"><SelectValue placeholder="Tipo" /></SelectTrigger><SelectContent><SelectItem value="all">Todos</SelectItem>{Object.entries(chargeTypeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select>
          </div>
        </CardContent></Card>

        {/* Table */}
        <Card><CardContent className="p-0"><Table>
          <TableHeader><TableRow><TableHead>Cobrança</TableHead><TableHead>Inquilino</TableHead><TableHead>Imóvel</TableHead><TableHead>Tipo</TableHead><TableHead className="text-right">Valor</TableHead><TableHead>Vencimento</TableHead><TableHead>Status</TableHead><TableHead className="w-10"></TableHead></TableRow></TableHeader>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={8} className="text-center py-12"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
            : charges.length === 0 ? <TableRow><TableCell colSpan={8} className="text-center py-12"><div className="flex flex-col items-center gap-2 text-muted-foreground"><DollarSign className="h-12 w-12" /><p className="font-medium">Nenhuma cobrança cadastrada</p></div></TableCell></TableRow>
            : charges.map((c: any) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">#{c.id.slice(-6).toUpperCase()}</TableCell>
                <TableCell>{c.tenant?.name || "-"}</TableCell>
                <TableCell className="text-muted-foreground text-sm">{c.property?.title || "-"}</TableCell>
                <TableCell>{chargeTypeLabels[c.type as ChargeType] || c.type}</TableCell>
                <TableCell className="text-right font-medium">{formatCurrency(c.value)}</TableCell>
                <TableCell>{formatDate(c.dueDate)}</TableCell>
                <TableCell><Badge className={chargeStatusColors[c.status as ChargeStatus] || ""} variant="secondary">{chargeStatusLabels[c.status as ChargeStatus] || c.status}</Badge></TableCell>
                <TableCell>
                  <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(c.id)}><Edit className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem>
                      {c.status !== "paid" && <DropdownMenuItem onClick={() => handleMarkPaid(c.id)}><CheckCircle2 className="mr-2 h-4 w-4" /> Marcar Pago</DropdownMenuItem>}
                      <DropdownMenuItem onClick={() => handleSendWhatsApp(c.id)}><Send className="mr-2 h-4 w-4" /> Enviar WhatsApp</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(c.id)}><Trash2 className="mr-2 h-4 w-4" /> Excluir</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table></CardContent></Card>

        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{pagination.total} cobrança(s)</p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={!pagination.hasPrev} onClick={() => setPage(page - 1)}>Anterior</Button>
              <span className="text-sm">Página {pagination.page} de {pagination.totalPages}</span>
              <Button variant="outline" size="sm" disabled={!pagination.hasNext} onClick={() => setPage(page + 1)}>Próxima</Button>
            </div>
          </div>
        )}
      </div>

      {/* WhatsApp Bulk Dialog */}
      <Dialog open={isWhatsAppDialogOpen} onOpenChange={setIsWhatsAppDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><MessageCircle className="h-5 w-5" /> Envio via WhatsApp</DialogTitle>
            <DialogDescription>Envie cobranças em massa via WhatsApp.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Filtrar Cobranças</Label>
              <Select value={whatsappFilter} onValueChange={setWhatsappFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="pending">Pendentes</SelectItem><SelectItem value="overdue">Vencidas</SelectItem><SelectItem value="both">Pendentes e Vencidas</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Modelo de Mensagem</Label>
              <Textarea value={whatsappMessage} onChange={(e) => setWhatsappMessage(e.target.value)} rows={4} />
              <p className="text-xs text-muted-foreground">Variáveis: {"{nome}"}, {"{valor}"}, {"{data}"}, {"{codigo}"}, {"{link}"}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsWhatsAppDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleBulkWhatsApp}><Send className="h-4 w-4 mr-2" />Enviar Mensagens</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout></RequireAuth>
  );
}
