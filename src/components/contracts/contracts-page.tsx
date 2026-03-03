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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, MoreHorizontal, Edit, Trash2, FileText, Loader2 } from "lucide-react";
import type { ContractStatus } from "@/types";
import { contractsApi, ownersApi, tenantsApi, propertiesApi } from "@/lib/api-client";
import { useApiList, useApiMutation } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";
import { RequireAuth } from "@/contexts/auth-context";

const contractStatusLabels: Record<ContractStatus, string> = { active: "Ativo", expired: "Expirado", cancelled: "Cancelado", pending: "Pendente" };
const contractStatusColors: Record<ContractStatus, string> = { active: "bg-green-500/10 text-green-500", expired: "bg-gray-500/10 text-gray-500", cancelled: "bg-red-500/10 text-red-500", pending: "bg-amber-500/10 text-amber-500" };

function formatCurrency(v: number | null | undefined) { return v != null ? `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "-"; }
function formatDate(d: string | null | undefined) { return d ? new Date(d).toLocaleDateString("pt-BR") : "-"; }

const emptyForm = {
  ownerId: "", tenantId: "", propertyId: "",
  startDate: "", endDate: "",
  rentValue: "", condoFee: "", iptuValue: "",
  depositValue: "", depositType: "",
  paymentDay: "", readjustmentIndex: "", readjustmentMonth: "",
  guarantor1: "", guarantor2: "", clauses: "", notes: "",
};

export function ContractsPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [formData, setFormData] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Related lists for selects
  const [owners, setOwners] = useState<any[]>([]);
  const [tenantsList, setTenantsList] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);

  useEffect(() => {
    ownersApi.list({ limit: "500" }).then((r: any) => setOwners(r.data || [])).catch(() => {});
    tenantsApi.list({ limit: "500" }).then((r: any) => setTenantsList(r.data || [])).catch(() => {});
    propertiesApi.list({ limit: "500" }).then((r: any) => setProperties(r.data || [])).catch(() => {});
  }, []);

  const queryParams: Record<string, string> = { page: String(page), limit: "20" };
  if (search) queryParams.search = search;
  if (statusFilter !== "all") queryParams.status = statusFilter;

  const { items: contracts, pagination, isLoading, refetch } = useApiList<any>(() => contractsApi.list(queryParams), [page, search, statusFilter]);

  const createMutation = useApiMutation((data: any) => contractsApi.create(data), {
    onSuccess: () => { toast({ title: "Contrato cadastrado!" }); setIsDialogOpen(false); setFormData(emptyForm); refetch(); },
    onError: (err) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });
  const updateMutation = useApiMutation(({ id, data }: { id: string; data: any }) => contractsApi.update(id, data), {
    onSuccess: () => { toast({ title: "Contrato atualizado!" }); setIsDialogOpen(false); setFormData(emptyForm); setEditingId(null); refetch(); },
    onError: (err) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });
  const deleteMutation = useApiMutation((id: string) => contractsApi.delete(id), {
    onSuccess: () => { toast({ title: "Contrato excluído!" }); refetch(); },
    onError: (err) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const updateField = (field: string, value: string) => setFormData((p) => ({ ...p, [field]: value }));

  // Ao selecionar proprietário, filtra imóveis apenas daquele proprietário
  const handleOwnerChange = (ownerId: string) => {
    setFormData((prev) => ({ ...prev, ownerId, propertyId: "" }));
  };

  // Ao selecionar imóvel, preenche valor aluguel, condomínio e proprietário
  const handlePropertyChange = (propertyId: string) => {
    const prop = properties.find((p: any) => p.id === propertyId);
    if (prop) {
      setFormData((prev) => ({
        ...prev,
        propertyId,
        ownerId: prev.ownerId || prop.ownerId || "",
        rentValue: prev.rentValue || (prop.rentValue?.toString() || ""),
        condoFee: prev.condoFee || (prop.condoFee?.toString() || ""),
        iptuValue: prev.iptuValue || (prop.iptuValue?.toString() || ""),
      }));
    } else {
      setFormData((prev) => ({ ...prev, propertyId }));
    }
  };

  // Imóveis filtrados pelo proprietário selecionado
  const filteredProperties = formData.ownerId
    ? properties.filter((p: any) => p.ownerId === formData.ownerId)
    : properties;

  const handleSubmit = async () => {
    const payload = {
      ...formData,
      rentValue: formData.rentValue ? Number(formData.rentValue) : undefined,
      condoFee: formData.condoFee ? Number(formData.condoFee) : undefined,
      iptuValue: formData.iptuValue ? Number(formData.iptuValue) : undefined,
      depositValue: formData.depositValue ? Number(formData.depositValue) : undefined,
      paymentDay: formData.paymentDay ? Number(formData.paymentDay) : undefined,
      readjustmentMonth: formData.readjustmentMonth ? Number(formData.readjustmentMonth) : undefined,
      startDate: formData.startDate || undefined,
      endDate: formData.endDate || undefined,
      ownerId: formData.ownerId || undefined,
      tenantId: formData.tenantId || undefined,
      propertyId: formData.propertyId || undefined,
    };
    if (editingId) await updateMutation.mutate({ id: editingId, data: payload }); else await createMutation.mutate(payload);
  };

  const handleEdit = async (id: string) => {
    try {
      const response = await contractsApi.get(id);
      const c = response.data;
      setFormData({
        ownerId: c.ownerId || "", tenantId: c.tenantId || "", propertyId: c.propertyId || "",
        startDate: c.startDate ? new Date(c.startDate).toISOString().split("T")[0] : "",
        endDate: c.endDate ? new Date(c.endDate).toISOString().split("T")[0] : "",
        rentValue: c.rentValue?.toString() || "", condoFee: c.condoFee?.toString() || "",
        iptuValue: c.iptuValue?.toString() || "", depositValue: c.depositValue?.toString() || "",
        depositType: c.depositType || "", paymentDay: c.paymentDay?.toString() || "",
        readjustmentIndex: c.readjustmentIndex || "", readjustmentMonth: c.readjustmentMonth?.toString() || "",
        guarantor1: c.guarantor1 || "", guarantor2: c.guarantor2 || "",
        clauses: c.clauses?.map((cl: any) => cl.content).join("\n\n") || "",
        notes: c.notes || "",
      });
      setEditingId(id); setIsDialogOpen(true);
    } catch { toast({ title: "Erro ao carregar contrato", variant: "destructive" }); }
  };

  const handleDelete = async (id: string) => { if (confirm("Excluir este contrato?")) await deleteMutation.mutate(id); };
  const isSaving = createMutation.isLoading || updateMutation.isLoading;

  return (
    <RequireAuth><AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div><h1 className="text-2xl font-bold">Contratos</h1><p className="text-muted-foreground">Gerencie todos os contratos de locação</p></div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) { setFormData(emptyForm); setEditingId(null); } }}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Novo Contrato</Button></DialogTrigger>
            <DialogContent className="max-w-[95vw] w-fit min-w-[min(48rem,95vw)] max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>{editingId ? "Editar" : "Novo"} Contrato</DialogTitle><DialogDescription>Preencha os dados do contrato de locação.</DialogDescription></DialogHeader>
              <Tabs defaultValue="parties" className="w-full">
                <TabsList className="grid w-full grid-cols-4"><TabsTrigger value="parties">Partes</TabsTrigger><TabsTrigger value="property">Imóvel</TabsTrigger><TabsTrigger value="financial">Financeiro</TabsTrigger><TabsTrigger value="clauses">Cláusulas</TabsTrigger></TabsList>

                <TabsContent value="parties" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Proprietário *</Label>
                      <Select value={formData.ownerId} onValueChange={handleOwnerChange}>
                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>{owners.map((o: any) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2"><Label>Inquilino *</Label>
                      <Select value={formData.tenantId} onValueChange={(v) => updateField("tenantId", v)}>
                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>{tenantsList.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Fiador 1</Label><Input value={formData.guarantor1} onChange={(e) => updateField("guarantor1", e.target.value)} /></div>
                    <div className="space-y-2"><Label>Fiador 2</Label><Input value={formData.guarantor2} onChange={(e) => updateField("guarantor2", e.target.value)} /></div>
                  </div>
                </TabsContent>

                <TabsContent value="property" className="space-y-4 mt-4">
                  <div className="space-y-2"><Label>Imóvel * {formData.ownerId ? `(filtrado por ${owners.find((o: any) => o.id === formData.ownerId)?.name || "proprietário"})` : ""}</Label>
                    <Select value={formData.propertyId} onValueChange={handlePropertyChange}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {filteredProperties.length === 0 ? (
                          <SelectItem value="none" disabled>Nenhum imóvel encontrado</SelectItem>
                        ) : (
                          filteredProperties.map((p: any) => (
                            <SelectItem key={p.id} value={p.id}>
                              <span className="flex items-center gap-2">
                                <span className={`inline-block h-2 w-2 rounded-full flex-shrink-0 ${
                                  p.status === "rented" ? "bg-red-500" :
                                  p.status === "available" ? "bg-green-500" :
                                  p.status === "maintenance" ? "bg-amber-500" : "bg-gray-400"
                                }`} />
                                {p.title || p.addressStreet}{p.owner ? ` — ${p.owner.name}` : ""}
                                <span className={`text-xs ml-1 ${
                                  p.status === "rented" ? "text-red-500" :
                                  p.status === "available" ? "text-green-500" :
                                  p.status === "maintenance" ? "text-amber-500" : "text-gray-400"
                                }`}>({p.status === "rented" ? "Alugado" : p.status === "available" ? "Disponível" : p.status === "maintenance" ? "Manutenção" : "Inativo"})</span>
                              </span>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    {formData.propertyId && (() => { const sp = filteredProperties.find((p: any) => p.id === formData.propertyId); return sp?.status === "rented" ? (
                      <p className="text-xs text-amber-600 flex items-center gap-1">⚠️ Este imóvel já está alugado. Verifique se há um contrato ativo antes de prosseguir.</p>
                    ) : sp?.status === "maintenance" ? (
                      <p className="text-xs text-amber-600 flex items-center gap-1">⚠️ Este imóvel está em manutenção.</p>
                    ) : null; })()}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Data de Início *</Label><Input type="date" value={formData.startDate} onChange={(e) => updateField("startDate", e.target.value)} /></div>
                    <div className="space-y-2"><Label>Data de Término *</Label><Input type="date" value={formData.endDate} onChange={(e) => updateField("endDate", e.target.value)} /></div>
                  </div>
                </TabsContent>

                <TabsContent value="financial" className="space-y-4 mt-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2"><Label>Aluguel *</Label><Input type="number" value={formData.rentValue} onChange={(e) => updateField("rentValue", e.target.value)} placeholder="R$ 0,00" /></div>
                    <div className="space-y-2"><Label>Condomínio</Label><Input type="number" value={formData.condoFee} onChange={(e) => updateField("condoFee", e.target.value)} placeholder="R$ 0,00" /></div>
                    <div className="space-y-2"><Label>IPTU</Label><Input type="number" value={formData.iptuValue} onChange={(e) => updateField("iptuValue", e.target.value)} placeholder="R$ 0,00" /></div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2"><Label>Depósito</Label><Input type="number" value={formData.depositValue} onChange={(e) => updateField("depositValue", e.target.value)} placeholder="R$ 0,00" /></div>
                    <div className="space-y-2"><Label>Tipo Garantia</Label>
                      <Select value={formData.depositType} onValueChange={(v) => updateField("depositType", v)}>
                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent><SelectItem value="cash">Caução em Dinheiro</SelectItem><SelectItem value="bank_guarantee">Fiança Bancária</SelectItem><SelectItem value="insurance">Seguro Fiança</SelectItem></SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2"><Label>Dia Pgto</Label>
                      <Select value={formData.paymentDay} onValueChange={(v) => updateField("paymentDay", v)}>
                        <SelectTrigger><SelectValue placeholder="Dia" /></SelectTrigger>
                        <SelectContent>{[1,5,10,15,20,25].map(d => <SelectItem key={d} value={d.toString()}>{d}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Índice Reajuste</Label>
                      <Select value={formData.readjustmentIndex} onValueChange={(v) => updateField("readjustmentIndex", v)}>
                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent><SelectItem value="igpm">IGP-M</SelectItem><SelectItem value="ipca">IPCA</SelectItem><SelectItem value="inpc">INPC</SelectItem></SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2"><Label>Mês Reajuste</Label>
                      <Select value={formData.readjustmentMonth} onValueChange={(v) => updateField("readjustmentMonth", v)}>
                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>{["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"].map((m,i) => <SelectItem key={i} value={(i+1).toString()}>{m}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="clauses" className="space-y-4 mt-4">
                  <div className="space-y-2"><Label>Cláusulas</Label><Textarea value={formData.clauses} onChange={(e) => updateField("clauses", e.target.value)} rows={8} placeholder="Uma cláusula por parágrafo..." /></div>
                  <div className="space-y-2"><Label>Observações</Label><Textarea value={formData.notes} onChange={(e) => updateField("notes", e.target.value)} rows={3} /></div>
                </TabsContent>
              </Tabs>
              <DialogFooter className="mt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleSubmit} disabled={isSaving}>{isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}{editingId ? "Salvar" : "Cadastrar"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <Card><CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Buscar..." className="pl-9" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} /></div></div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}><SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="all">Todos</SelectItem><SelectItem value="active">Ativo</SelectItem><SelectItem value="expired">Expirado</SelectItem><SelectItem value="cancelled">Cancelado</SelectItem><SelectItem value="pending">Pendente</SelectItem></SelectContent></Select>
          </div>
        </CardContent></Card>

        {/* Table */}
        <Card><CardContent className="p-0"><Table>
          <TableHeader><TableRow><TableHead>Contrato</TableHead><TableHead>Inquilino</TableHead><TableHead>Imóvel</TableHead><TableHead>Vigência</TableHead><TableHead>Valor</TableHead><TableHead>Status</TableHead><TableHead className="w-10"></TableHead></TableRow></TableHeader>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={7} className="text-center py-12"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
            : contracts.length === 0 ? <TableRow><TableCell colSpan={7} className="text-center py-12"><div className="flex flex-col items-center gap-2 text-muted-foreground"><FileText className="h-12 w-12" /><p className="font-medium">Nenhum contrato cadastrado</p></div></TableCell></TableRow>
            : contracts.map((c: any) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">#{c.id.slice(-6).toUpperCase()}</TableCell>
                <TableCell>{c.tenant?.name || "-"}</TableCell>
                <TableCell>{c.property?.title || c.property?.addressStreet || "-"}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{formatDate(c.startDate)} - {formatDate(c.endDate)}</TableCell>
                <TableCell className="font-medium">{formatCurrency(c.rentValue)}</TableCell>
                <TableCell><Badge className={contractStatusColors[c.status as ContractStatus] || ""} variant="secondary">{contractStatusLabels[c.status as ContractStatus] || c.status}</Badge></TableCell>
                <TableCell>
                  <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(c.id)}><Edit className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem>
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
            <p className="text-sm text-muted-foreground">{pagination.total} contrato(s)</p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={!pagination.hasPrev} onClick={() => setPage(page - 1)}>Anterior</Button>
              <span className="text-sm">Página {pagination.page} de {pagination.totalPages}</span>
              <Button variant="outline" size="sm" disabled={!pagination.hasNext} onClick={() => setPage(page + 1)}>Próxima</Button>
            </div>
          </div>
        )}
      </div>
    </AppLayout></RequireAuth>
  );
}
