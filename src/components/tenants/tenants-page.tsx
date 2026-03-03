"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, MoreHorizontal, Edit, Trash2, Users, Loader2, Home } from "lucide-react";
import type { TenantStatus } from "@/types";
import { tenantsApi, propertiesApi, contractsApi } from "@/lib/api-client";
import { useApiList, useApiMutation } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";
import { RequireAuth } from "@/contexts/auth-context";
import { fetchAddressByCep, mapCepToAddressFields } from "@/lib/viacep";

const tenantStatusLabels: Record<TenantStatus, string> = { active: "Ativo", inactive: "Inativo", pending: "Pendente" };
const tenantStatusColors: Record<TenantStatus, string> = { active: "bg-green-500/10 text-green-500", inactive: "bg-gray-500/10 text-gray-500", pending: "bg-amber-500/10 text-amber-500" };
const maritalStatusLabels: Record<string, string> = { single: "Solteiro(a)", married: "Casado(a)", divorced: "Divorciado(a)", widowed: "Viúvo(a)" };

const emptyForm = {
  name: "", cpf: "", rg: "", birthDate: "", maritalStatus: "", profession: "",
  email: "", phone: "", whatsapp: "",
  addressStreet: "", addressNumber: "", addressComplement: "", addressNeighborhood: "",
  addressCity: "", addressState: "", addressZipCode: "",
  emergencyContactName: "", emergencyContactPhone: "", emergencyContactRelation: "",
  monthlyIncome: "", employer: "", notes: "",
};

export function TenantsPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [formData, setFormData] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [cepLoading, setCepLoading] = useState(false);
  const [propertiesList, setPropertiesList] = useState<any[]>([]);
  const [contractsList, setContractsList] = useState<any[]>([]);
  const [linkedPropertyId, setLinkedPropertyId] = useState<string>("");
  const [addressAutoFilled, setAddressAutoFilled] = useState(false);

  // Carregar imóveis e contratos para vincular endereço
  useEffect(() => {
    propertiesApi.list({ limit: "500" }).then((r: any) => setPropertiesList(r.data || [])).catch(() => {});
    contractsApi.list({ limit: "500" }).then((r: any) => setContractsList(r.data || [])).catch(() => {});
  }, []);

  const handleCepBlur = async () => {
    const cep = formData.addressZipCode;
    if (!cep || cep.replace(/\D/g, "").length !== 8) return;
    setCepLoading(true);
    const result = await fetchAddressByCep(cep);
    setCepLoading(false);
    if (result) {
      const addr = mapCepToAddressFields(result);
      setFormData((prev) => ({ ...prev, ...addr }));
      toast({ title: "Endereço preenchido via CEP!" });
    } else {
      toast({ title: "CEP não encontrado", variant: "destructive" });
    }
  };

  // Ao selecionar um imóvel, preenche o endereço do inquilino com o do imóvel
  const handlePropertyLink = (propertyId: string) => {
    setLinkedPropertyId(propertyId);
    if (!propertyId) return;
    const prop = propertiesList.find((p: any) => p.id === propertyId);
    if (prop) {
      setFormData((prev) => ({
        ...prev,
        addressStreet: prop.addressStreet || prev.addressStreet,
        addressNumber: prop.addressNumber || prev.addressNumber,
        addressComplement: prop.addressComplement || prev.addressComplement,
        addressNeighborhood: prop.addressNeighborhood || prev.addressNeighborhood,
        addressCity: prop.addressCity || prev.addressCity,
        addressState: prop.addressState || prev.addressState,
        addressZipCode: prop.addressZipCode || prev.addressZipCode,
      }));
      setAddressAutoFilled(true);
    }
  };

  const queryParams: Record<string, string> = { page: String(page), limit: "20" };
  if (search) queryParams.search = search;
  if (statusFilter !== "all") queryParams.status = statusFilter;

  const { items: tenants, pagination, isLoading, refetch } = useApiList<any>(() => tenantsApi.list(queryParams), [page, search, statusFilter]);

  const createMutation = useApiMutation((data: any) => tenantsApi.create(data), {
    onSuccess: () => { toast({ title: "Inquilino cadastrado!" }); setIsDialogOpen(false); setFormData(emptyForm); refetch(); },
    onError: (err) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });
  const updateMutation = useApiMutation(({ id, data }: { id: string; data: any }) => tenantsApi.update(id, data), {
    onSuccess: () => { toast({ title: "Inquilino atualizado!" }); setIsDialogOpen(false); setFormData(emptyForm); setEditingId(null); refetch(); },
    onError: (err) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });
  const deleteMutation = useApiMutation((id: string) => tenantsApi.delete(id), {
    onSuccess: () => { toast({ title: "Inquilino excluído!" }); refetch(); },
    onError: (err) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const updateField = (field: string, value: string) => setFormData((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async () => {
    const payload = { ...formData, monthlyIncome: formData.monthlyIncome ? Number(formData.monthlyIncome) : undefined, birthDate: formData.birthDate || undefined, maritalStatus: formData.maritalStatus || undefined };
    if (editingId) await updateMutation.mutate({ id: editingId, data: payload }); else await createMutation.mutate(payload);
  };

  const handleEdit = async (id: string) => {
    try {
      const response = await tenantsApi.get(id);
      const t = response.data;
      setFormData({
        name: t.name || "", cpf: t.cpf || "", rg: t.rg || "",
        birthDate: t.birthDate ? new Date(t.birthDate).toISOString().split("T")[0] : "",
        maritalStatus: t.maritalStatus || "", profession: t.profession || "",
        email: t.email || "", phone: t.phone || "", whatsapp: t.whatsapp || "",
        addressStreet: t.addressStreet || "", addressNumber: t.addressNumber || "",
        addressComplement: t.addressComplement || "", addressNeighborhood: t.addressNeighborhood || "",
        addressCity: t.addressCity || "", addressState: t.addressState || "", addressZipCode: t.addressZipCode || "",
        emergencyContactName: t.emergencyContactName || "", emergencyContactPhone: t.emergencyContactPhone || "",
        emergencyContactRelation: t.emergencyContactRelation || "",
        monthlyIncome: t.monthlyIncome?.toString() || "", employer: t.employer || "", notes: t.notes || "",
      });
      setEditingId(id); setIsDialogOpen(true);
      // Detectar imóvel vinculado via contrato ativo
      const activeContract = contractsList.find((c: any) => c.tenantId === id && c.status === "active");
      if (activeContract?.propertyId) {
        setLinkedPropertyId(activeContract.propertyId);
      }
    } catch { toast({ title: "Erro ao carregar dados", variant: "destructive" }); }
  };

  const handleDelete = async (id: string, name: string) => { if (confirm(`Excluir "${name}"?`)) await deleteMutation.mutate(id); };
  const isSaving = createMutation.isLoading || updateMutation.isLoading;

  return (
    <RequireAuth><AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div><h1 className="text-2xl font-bold">Inquilinos</h1><p className="text-muted-foreground">Gerencie todos os inquilinos</p></div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) { setFormData(emptyForm); setEditingId(null); setLinkedPropertyId(""); setAddressAutoFilled(false); } }}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Novo Inquilino</Button></DialogTrigger>
            <DialogContent className="max-w-[95vw] w-fit min-w-[min(42rem,95vw)] max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>{editingId ? "Editar" : "Novo"} Inquilino</DialogTitle><DialogDescription>Preencha os dados.</DialogDescription></DialogHeader>
              <Tabs defaultValue="personal" className="w-full">
                <TabsList className="grid w-full grid-cols-3"><TabsTrigger value="personal">Pessoal</TabsTrigger><TabsTrigger value="address">Endereço</TabsTrigger><TabsTrigger value="financial">Financeiro</TabsTrigger></TabsList>
                <TabsContent value="personal" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Nome *</Label><Input value={formData.name} onChange={(e) => updateField("name", e.target.value)} /></div>
                    <div className="space-y-2"><Label>CPF *</Label><Input value={formData.cpf} onChange={(e) => updateField("cpf", e.target.value)} /></div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2"><Label>RG</Label><Input value={formData.rg} onChange={(e) => updateField("rg", e.target.value)} /></div>
                    <div className="space-y-2"><Label>Nascimento</Label><Input type="date" value={formData.birthDate} onChange={(e) => updateField("birthDate", e.target.value)} /></div>
                    <div className="space-y-2"><Label>Estado Civil</Label>
                      <Select value={formData.maritalStatus} onValueChange={(v) => updateField("maritalStatus", v)}>
                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>{Object.entries(maritalStatusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>E-mail *</Label><Input type="email" value={formData.email} onChange={(e) => updateField("email", e.target.value)} /></div>
                    <div className="space-y-2"><Label>Telefone *</Label><Input value={formData.phone} onChange={(e) => updateField("phone", e.target.value)} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>WhatsApp</Label><Input value={formData.whatsapp} onChange={(e) => updateField("whatsapp", e.target.value)} /></div>
                    <div className="space-y-2"><Label>Profissão</Label><Input value={formData.profession} onChange={(e) => updateField("profession", e.target.value)} /></div>
                  </div>
                </TabsContent>
                <TabsContent value="address" className="space-y-4 mt-4">
                  {/* Vincular imóvel para preencher endereço */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2"><Home className="h-4 w-4" /> Preencher com endereço do imóvel</Label>
                    <Select value={linkedPropertyId} onValueChange={handlePropertyLink}>
                      <SelectTrigger className="w-full truncate"><SelectValue placeholder="Selecione um imóvel para copiar o endereço" /></SelectTrigger>
                      <SelectContent className="max-w-[min(36rem,90vw)]">
                        {propertiesList.map((p: any) => (
                          <SelectItem key={p.id} value={p.id} className="truncate">
                            {p.title || p.addressStreet} — {[p.addressStreet, p.addressNumber, p.addressCity].filter(Boolean).join(", ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {addressAutoFilled && (
                    <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-2 text-sm text-primary">
                      ✓ Endereço preenchido com base no imóvel vinculado.
                    </div>
                  )}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2 space-y-2"><Label>Rua</Label><Input value={formData.addressStreet} onChange={(e) => updateField("addressStreet", e.target.value)} /></div>
                    <div className="space-y-2"><Label>Número</Label><Input value={formData.addressNumber} onChange={(e) => updateField("addressNumber", e.target.value)} /></div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2"><Label>Complemento</Label><Input value={formData.addressComplement} onChange={(e) => updateField("addressComplement", e.target.value)} /></div>
                    <div className="space-y-2"><Label>Bairro</Label><Input value={formData.addressNeighborhood} onChange={(e) => updateField("addressNeighborhood", e.target.value)} /></div>
                    <div className="space-y-2"><Label>CEP</Label>
                      <div className="flex gap-2">
                        <Input value={formData.addressZipCode} onChange={(e) => updateField("addressZipCode", e.target.value)} onBlur={handleCepBlur} placeholder="00000-000" />
                        {cepLoading && <Loader2 className="h-4 w-4 animate-spin mt-2 text-muted-foreground" />}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Cidade</Label><Input value={formData.addressCity} onChange={(e) => updateField("addressCity", e.target.value)} /></div>
                    <div className="space-y-2"><Label>Estado</Label><Input value={formData.addressState} onChange={(e) => updateField("addressState", e.target.value)} /></div>
                  </div>
                  <div className="border-t pt-4 mt-4"><h4 className="font-medium mb-3">Contato de Emergência</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2"><Label>Nome</Label><Input value={formData.emergencyContactName} onChange={(e) => updateField("emergencyContactName", e.target.value)} /></div>
                      <div className="space-y-2"><Label>Telefone</Label><Input value={formData.emergencyContactPhone} onChange={(e) => updateField("emergencyContactPhone", e.target.value)} /></div>
                      <div className="space-y-2"><Label>Parentesco</Label><Input value={formData.emergencyContactRelation} onChange={(e) => updateField("emergencyContactRelation", e.target.value)} /></div>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="financial" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Renda Mensal</Label><Input type="number" value={formData.monthlyIncome} onChange={(e) => updateField("monthlyIncome", e.target.value)} /></div>
                    <div className="space-y-2"><Label>Empregador</Label><Input value={formData.employer} onChange={(e) => updateField("employer", e.target.value)} /></div>
                  </div>
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

        <Card><CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Buscar..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} /></div></div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}><SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="all">Todos</SelectItem><SelectItem value="active">Ativo</SelectItem><SelectItem value="inactive">Inativo</SelectItem><SelectItem value="pending">Pendente</SelectItem></SelectContent></Select>
          </div>
        </CardContent></Card>

        <Card><CardContent className="p-0"><Table>
          <TableHeader><TableRow><TableHead>Inquilino</TableHead><TableHead>CPF</TableHead><TableHead>Telefone</TableHead><TableHead>E-mail</TableHead><TableHead>Status</TableHead><TableHead className="w-10"></TableHead></TableRow></TableHeader>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={6} className="text-center py-12"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
            : tenants.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-12"><div className="flex flex-col items-center gap-2 text-muted-foreground"><Users className="h-12 w-12" /><p className="font-medium">Nenhum inquilino cadastrado</p></div></TableCell></TableRow>
            : tenants.map((t: any) => (
              <TableRow key={t.id}>
                <TableCell><div className="flex items-center gap-3"><Avatar className="h-8 w-8"><AvatarFallback className="text-xs">{t.name?.slice(0,2).toUpperCase()}</AvatarFallback></Avatar><span className="font-medium">{t.name}</span></div></TableCell>
                <TableCell className="text-muted-foreground">{t.cpf}</TableCell>
                <TableCell className="text-muted-foreground">{t.phone}</TableCell>
                <TableCell className="text-muted-foreground">{t.email}</TableCell>
                <TableCell><Badge className={tenantStatusColors[t.status as TenantStatus] || ""} variant="secondary">{tenantStatusLabels[t.status as TenantStatus] || t.status}</Badge></TableCell>
                <TableCell>
                  <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(t.id)}><Edit className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(t.id, t.name)}><Trash2 className="mr-2 h-4 w-4" /> Excluir</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table></CardContent></Card>

        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{pagination.total} inquilino(s)</p>
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
