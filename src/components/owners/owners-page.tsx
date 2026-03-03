"use client";

import { useState, useCallback } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  UserCircle,
  Phone,
  Mail,
  MapPin,
  Building2,
  DollarSign,
  Download,
  Upload,
  CreditCard,
  Loader2,
} from "lucide-react";
import type { OwnerStatus } from "@/types";
import { ownersApi, ApiError } from "@/lib/api-client";
import { useApiList, useApiMutation } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";
import { RequireAuth } from "@/contexts/auth-context";
import { fetchAddressByCep, mapCepToAddressFields } from "@/lib/viacep";

const ownerStatusLabels: Record<OwnerStatus, string> = {
  active: "Ativo",
  inactive: "Inativo",
};

const ownerStatusColors: Record<OwnerStatus, string> = {
  active: "bg-green-500/10 text-green-500",
  inactive: "bg-gray-500/10 text-gray-500",
};

const emptyForm = {
  name: "", cpfCnpj: "", rg: "", creci: "", email: "", phone: "", whatsapp: "",
  addressStreet: "", addressNumber: "", addressComplement: "", addressNeighborhood: "",
  addressCity: "", addressState: "", addressZipCode: "",
  bankName: "", bankAccountType: "" as string, bankAgency: "", bankAccount: "", pixKey: "",
  notes: "",
};

export function OwnersPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [formData, setFormData] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [cepLoading, setCepLoading] = useState(false);

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

  const queryParams: Record<string, string> = { page: String(page), limit: "20" };
  if (search) queryParams.search = search;
  if (statusFilter !== "all") queryParams.status = statusFilter;

  const { items: owners, pagination, isLoading, refetch } = useApiList<any>(
    () => ownersApi.list(queryParams),
    [page, search, statusFilter]
  );

  const createMutation = useApiMutation(
    (data: any) => ownersApi.create(data),
    {
      onSuccess: () => {
        toast({ title: "Proprietário cadastrado com sucesso!" });
        setIsDialogOpen(false);
        setFormData(emptyForm);
        refetch();
      },
      onError: (err) => {
        toast({ title: "Erro ao cadastrar", description: err.message, variant: "destructive" });
      },
    }
  );

  const updateMutation = useApiMutation(
    ({ id, data }: { id: string; data: any }) => ownersApi.update(id, data),
    {
      onSuccess: () => {
        toast({ title: "Proprietário atualizado com sucesso!" });
        setIsDialogOpen(false);
        setFormData(emptyForm);
        setEditingId(null);
        refetch();
      },
      onError: (err) => {
        toast({ title: "Erro ao atualizar", description: err.message, variant: "destructive" });
      },
    }
  );

  const deleteMutation = useApiMutation(
    (id: string) => ownersApi.delete(id),
    {
      onSuccess: () => {
        toast({ title: "Proprietário excluído com sucesso!" });
        refetch();
      },
      onError: (err) => {
        toast({ title: "Erro ao excluir", description: err.message, variant: "destructive" });
      },
    }
  );

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    const payload = {
      name: formData.name,
      cpfCnpj: formData.cpfCnpj,
      rg: formData.rg || undefined,
      email: formData.email,
      phone: formData.phone,
      whatsapp: formData.whatsapp || undefined,
      street: formData.addressStreet || undefined,
      number: formData.addressNumber || undefined,
      complement: formData.addressComplement || undefined,
      neighborhood: formData.addressNeighborhood || undefined,
      city: formData.addressCity || undefined,
      state: formData.addressState || undefined,
      zipCode: formData.addressZipCode || undefined,
      bankName: formData.bankName || undefined,
      bankAccountType: formData.bankAccountType || undefined,
      bankAgency: formData.bankAgency || undefined,
      bankAccount: formData.bankAccount || undefined,
      pixKey: formData.pixKey || undefined,
      notes: formData.notes || undefined,
    };
    if (editingId) {
      await updateMutation.mutate({ id: editingId, data: payload });
    } else {
      await createMutation.mutate(payload);
    }
  };

  const handleEdit = async (id: string) => {
    try {
      const response = await ownersApi.get(id);
      const owner = response.data;
      setFormData({
        name: owner.name || "",
        cpfCnpj: owner.cpfCnpj || "",
        rg: owner.rg || "",
        creci: "",
        email: owner.email || "",
        phone: owner.phone || "",
        whatsapp: owner.whatsapp || "",
        addressStreet: owner.street || "",
        addressNumber: owner.number || "",
        addressComplement: owner.complement || "",
        addressNeighborhood: owner.neighborhood || "",
        addressCity: owner.city || "",
        addressState: owner.state || "",
        addressZipCode: owner.zipCode || "",
        bankName: owner.bankName || "",
        bankAccountType: owner.bankAccountType?.toLowerCase() || "",
        bankAgency: owner.bankAgency || "",
        bankAccount: owner.bankAccount || "",
        pixKey: owner.pixKey || "",
        notes: owner.notes || "",
      });
      setEditingId(id);
      setIsDialogOpen(true);
    } catch {
      toast({ title: "Erro ao carregar dados", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Deseja excluir o proprietário "${name}"?`)) {
      await deleteMutation.mutate(id);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  const isSaving = createMutation.isLoading || updateMutation.isLoading;

  return (
    <RequireAuth>
    <AppLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Proprietários</h1>
            <p className="text-muted-foreground">
              Gerencie todos os proprietários de imóveis
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) { setFormData(emptyForm); setEditingId(null); }
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Proprietário
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[95vw] w-fit min-w-[min(42rem,95vw)] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingId ? "Editar Proprietário" : "Cadastrar Novo Proprietário"}</DialogTitle>
                  <DialogDescription>
                    Preencha os dados do proprietário.
                  </DialogDescription>
                </DialogHeader>
                <Tabs defaultValue="personal" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="personal">Dados Pessoais</TabsTrigger>
                    <TabsTrigger value="address">Endereço</TabsTrigger>
                    <TabsTrigger value="banking">Dados Bancários</TabsTrigger>
                  </TabsList>
                  <TabsContent value="personal" className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Nome Completo / Razão Social *</Label>
                        <Input value={formData.name} onChange={(e) => updateField("name", e.target.value)} placeholder="Nome do proprietário" />
                      </div>
                      <div className="space-y-2">
                        <Label>CPF/CNPJ *</Label>
                        <Input value={formData.cpfCnpj} onChange={(e) => updateField("cpfCnpj", e.target.value)} placeholder="000.000.000-00" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>RG</Label>
                        <Input value={formData.rg} onChange={(e) => updateField("rg", e.target.value)} placeholder="RG" />
                      </div>
                      <div className="space-y-2">
                        <Label>CRECI</Label>
                        <Input value={formData.creci} onChange={(e) => updateField("creci", e.target.value)} placeholder="CRECI" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>E-mail *</Label>
                        <Input value={formData.email} onChange={(e) => updateField("email", e.target.value)} type="email" placeholder="email@exemplo.com" />
                      </div>
                      <div className="space-y-2">
                        <Label>Telefone *</Label>
                        <Input value={formData.phone} onChange={(e) => updateField("phone", e.target.value)} placeholder="(00) 00000-0000" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>WhatsApp</Label>
                      <Input value={formData.whatsapp} onChange={(e) => updateField("whatsapp", e.target.value)} placeholder="(00) 00000-0000" />
                    </div>
                  </TabsContent>
                  <TabsContent value="address" className="space-y-4 mt-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-2 space-y-2">
                        <Label>Rua</Label>
                        <Input value={formData.addressStreet} onChange={(e) => updateField("addressStreet", e.target.value)} placeholder="Rua" />
                      </div>
                      <div className="space-y-2">
                        <Label>Número</Label>
                        <Input value={formData.addressNumber} onChange={(e) => updateField("addressNumber", e.target.value)} placeholder="Número" />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Complemento</Label>
                        <Input value={formData.addressComplement} onChange={(e) => updateField("addressComplement", e.target.value)} placeholder="Complemento" />
                      </div>
                      <div className="space-y-2">
                        <Label>Bairro</Label>
                        <Input value={formData.addressNeighborhood} onChange={(e) => updateField("addressNeighborhood", e.target.value)} placeholder="Bairro" />
                      </div>
                      <div className="space-y-2">
                        <Label>CEP</Label>
                        <div className="flex gap-2">
                          <Input value={formData.addressZipCode} onChange={(e) => updateField("addressZipCode", e.target.value)} onBlur={handleCepBlur} placeholder="00000-000" />
                          {cepLoading && <Loader2 className="h-4 w-4 animate-spin mt-2 text-muted-foreground" />}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Cidade</Label>
                        <Input value={formData.addressCity} onChange={(e) => updateField("addressCity", e.target.value)} placeholder="Cidade" />
                      </div>
                      <div className="space-y-2">
                        <Label>Estado</Label>
                        <Input value={formData.addressState} onChange={(e) => updateField("addressState", e.target.value)} placeholder="Estado" />
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="banking" className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Banco</Label>
                        <Select value={formData.bankName} onValueChange={(v) => updateField("bankName", v)}>
                          <SelectTrigger><SelectValue placeholder="Selecione o banco" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Banco do Brasil">Banco do Brasil</SelectItem>
                            <SelectItem value="Santander">Santander</SelectItem>
                            <SelectItem value="Bradesco">Bradesco</SelectItem>
                            <SelectItem value="Itaú">Itaú</SelectItem>
                            <SelectItem value="Sicoob">Sicoob</SelectItem>
                            <SelectItem value="Caixa">Caixa</SelectItem>
                            <SelectItem value="Nubank">Nubank</SelectItem>
                            <SelectItem value="Inter">Inter</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Tipo de Conta</Label>
                        <Select value={formData.bankAccountType} onValueChange={(v) => updateField("bankAccountType", v)}>
                          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="checking">Corrente</SelectItem>
                            <SelectItem value="savings">Poupança</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Agência</Label>
                        <Input value={formData.bankAgency} onChange={(e) => updateField("bankAgency", e.target.value)} placeholder="0000" />
                      </div>
                      <div className="space-y-2">
                        <Label>Conta</Label>
                        <Input value={formData.bankAccount} onChange={(e) => updateField("bankAccount", e.target.value)} placeholder="00000-0" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Chave PIX</Label>
                      <Input value={formData.pixKey} onChange={(e) => updateField("pixKey", e.target.value)} placeholder="CPF, e-mail, telefone ou chave aleatória" />
                    </div>
                  </TabsContent>
                </Tabs>
                <div className="space-y-2 mt-4">
                  <Label>Observações</Label>
                  <Textarea value={formData.notes} onChange={(e) => updateField("notes", e.target.value)} placeholder="Observações sobre o proprietário..." rows={3} />
                </div>
                <DialogFooter className="mt-4">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSubmit} disabled={isSaving}>
                    {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {editingId ? "Salvar Alterações" : "Cadastrar Proprietário"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome, CPF/CNPJ..."
                    className="pl-9"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </form>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Proprietário</TableHead>
                  <TableHead>CPF/CNPJ</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Imóveis</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : owners.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <UserCircle className="h-12 w-12" />
                        <p className="font-medium">Nenhum proprietário cadastrado</p>
                        <p className="text-sm">Clique em "Novo Proprietário" para começar</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  owners.map((owner: any) => (
                    <TableRow key={owner.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {owner.name?.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{owner.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{owner.cpfCnpj}</TableCell>
                      <TableCell className="text-muted-foreground">{owner.phone}</TableCell>
                      <TableCell className="text-muted-foreground">{owner.email}</TableCell>
                      <TableCell>{owner._count?.properties || 0}</TableCell>
                      <TableCell>
                        <Badge className={ownerStatusColors[owner.status?.toLowerCase() as OwnerStatus] || ""} variant="secondary">
                          {ownerStatusLabels[owner.status?.toLowerCase() as OwnerStatus] || owner.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(owner.id)}>
                              <Edit className="mr-2 h-4 w-4" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDelete(owner.id, owner.name)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {pagination.total} proprietário(s) encontrado(s)
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={!pagination.hasPrev} onClick={() => setPage(page - 1)}>
                Anterior
              </Button>
              <span className="text-sm">Página {pagination.page} de {pagination.totalPages}</span>
              <Button variant="outline" size="sm" disabled={!pagination.hasNext} onClick={() => setPage(page + 1)}>
                Próxima
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
    </RequireAuth>
  );
}
