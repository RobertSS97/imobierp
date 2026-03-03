"use client";

import { useState, useMemo, useCallback } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus, Search, MoreHorizontal, Edit, Trash2, Building2, Loader2, MapPin, LayoutList, Map,
  ExternalLink,
} from "lucide-react";
import type { PropertyStatus, PropertyType } from "@/types";
import { propertiesApi, ownersApi, ApiError } from "@/lib/api-client";
import { useApiList, useApiMutation } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";
import { RequireAuth } from "@/contexts/auth-context";
import { fetchAddressByCep, mapCepToAddressFields } from "@/lib/viacep";

const propertyTypeLabels: Record<PropertyType, string> = {
  apartment: "Apartamento", house: "Casa", commercial: "Comercial", land: "Terreno", studio: "Studio",
};

const propertyStatusLabels: Record<PropertyStatus, string> = {
  available: "Disponível", rented: "Alugado", maintenance: "Manutenção", inactive: "Inativo",
};

const propertyStatusColors: Record<PropertyStatus, string> = {
  available: "bg-green-500/10 text-green-500",
  rented: "bg-primary/10 text-primary",
  maintenance: "bg-amber-500/10 text-amber-500",
  inactive: "bg-gray-500/10 text-gray-500",
};

const emptyForm = {
  title: "", type: "apartment" as string, addressStreet: "", addressNumber: "", addressComplement: "",
  addressNeighborhood: "", addressCity: "", addressState: "", addressZipCode: "",
  bedrooms: "", bathrooms: "", parkingSpaces: "", area: "",
  rentValue: "", condoFee: "", iptuValue: "", ownerId: "", description: "",
};

// Constrói o endereço completo para usar no Google Maps
function buildFullAddress(p: any): string {
  const parts = [
    p.addressStreet,
    p.addressNumber,
    p.addressNeighborhood,
    p.addressCity,
    p.addressState,
  ].filter(Boolean);
  return parts.join(", ") + (p.addressZipCode ? ` - ${p.addressZipCode}` : "");
}

// URL do embed do Google Maps para um endereço
function getMapEmbedUrl(address: string): string {
  const encoded = encodeURIComponent(address);
  return `https://maps.google.com/maps?q=${encoded}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
}

// URL para abrir no Google Maps externamente
function getGoogleMapsUrl(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

export function PropertiesPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [formData, setFormData] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "map">("table");
  const [selectedMapProperty, setSelectedMapProperty] = useState<any>(null);
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
  if (typeFilter !== "all") queryParams.type = typeFilter;

  const { items: properties, pagination, isLoading, refetch } = useApiList<any>(
    () => propertiesApi.list(queryParams),
    [page, search, statusFilter, typeFilter]
  );

  // Carregar proprietários para o select
  const { items: ownersList } = useApiList<any>(
    () => ownersApi.list({ limit: "100", status: "active" }),
    []
  );

  const createMutation = useApiMutation(
    (data: any) => propertiesApi.create(data),
    {
      onSuccess: () => {
        toast({ title: "Imóvel cadastrado com sucesso!" });
        setIsDialogOpen(false); setFormData(emptyForm); refetch();
      },
      onError: (err) => toast({ title: "Erro ao cadastrar", description: err.message, variant: "destructive" }),
    }
  );

  const updateMutation = useApiMutation(
    ({ id, data }: { id: string; data: any }) => propertiesApi.update(id, data),
    {
      onSuccess: () => {
        toast({ title: "Imóvel atualizado com sucesso!" });
        setIsDialogOpen(false); setFormData(emptyForm); setEditingId(null); refetch();
      },
      onError: (err) => toast({ title: "Erro ao atualizar", description: err.message, variant: "destructive" }),
    }
  );

  const deleteMutation = useApiMutation(
    (id: string) => propertiesApi.delete(id),
    {
      onSuccess: () => { toast({ title: "Imóvel excluído com sucesso!" }); refetch(); },
      onError: (err) => toast({ title: "Erro ao excluir", description: err.message, variant: "destructive" }),
    }
  );

  const updateField = (field: string, value: string) => setFormData((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async () => {
    const payload = {
      ...formData,
      bedrooms: formData.bedrooms ? Number(formData.bedrooms) : undefined,
      bathrooms: formData.bathrooms ? Number(formData.bathrooms) : undefined,
      parkingSpaces: formData.parkingSpaces ? Number(formData.parkingSpaces) : undefined,
      area: formData.area ? Number(formData.area) : undefined,
      rentValue: formData.rentValue ? Number(formData.rentValue) : undefined,
      condoFee: formData.condoFee ? Number(formData.condoFee) : undefined,
      iptuValue: formData.iptuValue ? Number(formData.iptuValue) : undefined,
      ownerId: formData.ownerId || undefined,
    };
    if (editingId) {
      await updateMutation.mutate({ id: editingId, data: payload });
    } else {
      await createMutation.mutate(payload);
    }
  };

  const handleEdit = async (id: string) => {
    try {
      const response = await propertiesApi.get(id);
      const p = response.data;
      setFormData({
        title: p.title || "", type: p.type || "apartment",
        addressStreet: p.addressStreet || "", addressNumber: p.addressNumber || "",
        addressComplement: p.addressComplement || "", addressNeighborhood: p.addressNeighborhood || "",
        addressCity: p.addressCity || "", addressState: p.addressState || "",
        addressZipCode: p.addressZipCode || "",
        bedrooms: p.bedrooms?.toString() || "", bathrooms: p.bathrooms?.toString() || "",
        parkingSpaces: p.parkingSpaces?.toString() || "", area: p.area?.toString() || "",
        rentValue: p.rentValue?.toString() || "", condoFee: p.condoFee?.toString() || "",
        iptuValue: p.iptuValue?.toString() || "", ownerId: p.ownerId || "", description: p.description || "",
      });
      setEditingId(id);
      setIsDialogOpen(true);
    } catch {
      toast({ title: "Erro ao carregar dados", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (confirm(`Deseja excluir o imóvel "${title}"?`)) {
      await deleteMutation.mutate(id);
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);

  const isSaving = createMutation.isLoading || updateMutation.isLoading;

  // Endereço montado a partir do formulário para preview do mapa
  const formAddress = useMemo(() => {
    const parts = [formData.addressStreet, formData.addressNumber, formData.addressNeighborhood, formData.addressCity, formData.addressState].filter(Boolean);
    return parts.length >= 2 ? parts.join(", ") : "";
  }, [formData.addressStreet, formData.addressNumber, formData.addressNeighborhood, formData.addressCity, formData.addressState]);

  return (
    <RequireAuth>
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Imóveis</h1>
            <p className="text-muted-foreground">Gerencie todos os imóveis cadastrados</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) { setFormData(emptyForm); setEditingId(null); }
          }}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Novo Imóvel</Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] w-fit min-w-[min(42rem,95vw)] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingId ? "Editar Imóvel" : "Cadastrar Novo Imóvel"}</DialogTitle>
                <DialogDescription>Preencha os dados do imóvel.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Título do Anúncio *</Label>
                    <Input value={formData.title} onChange={(e) => updateField("title", e.target.value)} placeholder="Ex: Apartamento 2 quartos - Centro" />
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo de Imóvel *</Label>
                    <Select value={formData.type} onValueChange={(v) => updateField("type", v)}>
                      <SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(propertyTypeLabels).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Endereço</Label>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2">
                      <Input value={formData.addressStreet} onChange={(e) => updateField("addressStreet", e.target.value)} placeholder="Rua" />
                    </div>
                    <Input value={formData.addressNumber} onChange={(e) => updateField("addressNumber", e.target.value)} placeholder="Número" />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <Input value={formData.addressComplement} onChange={(e) => updateField("addressComplement", e.target.value)} placeholder="Complemento" />
                    <Input value={formData.addressNeighborhood} onChange={(e) => updateField("addressNeighborhood", e.target.value)} placeholder="Bairro" />
                    <div className="flex gap-2">
                      <Input value={formData.addressZipCode} onChange={(e) => updateField("addressZipCode", e.target.value)} onBlur={handleCepBlur} placeholder="CEP" />
                      {cepLoading && <Loader2 className="h-4 w-4 animate-spin mt-2 text-muted-foreground" />}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input value={formData.addressCity} onChange={(e) => updateField("addressCity", e.target.value)} placeholder="Cidade" />
                    <Input value={formData.addressState} onChange={(e) => updateField("addressState", e.target.value)} placeholder="Estado" />
                  </div>
                  {/* Mini-mapa preview do endereço */}
                  {formAddress && (
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" /> Pré-visualização do endereço</p>
                        <a href={getGoogleMapsUrl(formAddress)} target="_blank" rel="noopener noreferrer" className="text-xs text-primary flex items-center gap-1 hover:underline">
                          Abrir no Google Maps <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                      <div className="rounded-lg overflow-hidden border h-[200px]">
                        <iframe
                          title="Localização do imóvel"
                          width="100%"
                          height="100%"
                          style={{ border: 0 }}
                          loading="lazy"
                          allowFullScreen
                          referrerPolicy="no-referrer-when-downgrade"
                          src={getMapEmbedUrl(formAddress)}
                        />
                      </div>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-4 gap-4">
                  <div className="space-y-2"><Label>Quartos</Label><Input value={formData.bedrooms} onChange={(e) => updateField("bedrooms", e.target.value)} type="number" min={0} /></div>
                  <div className="space-y-2"><Label>Banheiros</Label><Input value={formData.bathrooms} onChange={(e) => updateField("bathrooms", e.target.value)} type="number" min={0} /></div>
                  <div className="space-y-2"><Label>Vagas</Label><Input value={formData.parkingSpaces} onChange={(e) => updateField("parkingSpaces", e.target.value)} type="number" min={0} /></div>
                  <div className="space-y-2"><Label>Área (m²)</Label><Input value={formData.area} onChange={(e) => updateField("area", e.target.value)} type="number" min={0} /></div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2"><Label>Valor do Aluguel *</Label><Input value={formData.rentValue} onChange={(e) => updateField("rentValue", e.target.value)} type="number" placeholder="0.00" /></div>
                  <div className="space-y-2"><Label>Condomínio</Label><Input value={formData.condoFee} onChange={(e) => updateField("condoFee", e.target.value)} type="number" placeholder="0.00" /></div>
                  <div className="space-y-2"><Label>IPTU</Label><Input value={formData.iptuValue} onChange={(e) => updateField("iptuValue", e.target.value)} type="number" placeholder="0.00" /></div>
                </div>
                <div className="space-y-2">
                  <Label>Proprietário</Label>
                  <Select value={formData.ownerId} onValueChange={(v) => updateField("ownerId", v)}>
                    <SelectTrigger><SelectValue placeholder="Selecione o proprietário" /></SelectTrigger>
                    <SelectContent>
                      {ownersList.length === 0 ? (
                        <SelectItem value="none" disabled>Nenhum proprietário cadastrado</SelectItem>
                      ) : (
                        ownersList.map((o: any) => (
                          <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Textarea value={formData.description} onChange={(e) => updateField("description", e.target.value)} placeholder="Descreva o imóvel..." rows={3} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleSubmit} disabled={isSaving}>
                  {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingId ? "Salvar" : "Cadastrar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Buscar por endereço, título..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="available">Disponível</SelectItem>
                  <SelectItem value="rented">Alugado</SelectItem>
                  <SelectItem value="maintenance">Manutenção</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
                <SelectTrigger className="w-40"><SelectValue placeholder="Tipo" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {Object.entries(propertyTypeLabels).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center rounded-md border">
                <Button
                  variant={viewMode === "table" ? "default" : "ghost"}
                  size="sm"
                  className="rounded-r-none"
                  onClick={() => setViewMode("table")}
                >
                  <LayoutList className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "map" ? "default" : "ghost"}
                  size="sm"
                  className="rounded-l-none"
                  onClick={() => setViewMode("map")}
                >
                  <Map className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table / Map View */}
        {viewMode === "map" ? (
          /* ────── Map View ────── */
          <div className="grid gap-4 lg:grid-cols-3">
            {/* Sidebar list */}
            <div className="lg:col-span-1 space-y-2 max-h-[600px] overflow-y-auto">
              {isLoading ? (
                <Card><CardContent className="py-12 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></CardContent></Card>
              ) : properties.length === 0 ? (
                <Card><CardContent className="py-12 text-center text-muted-foreground"><Building2 className="h-8 w-8 mx-auto mb-2" /><p>Nenhum imóvel</p></CardContent></Card>
              ) : (
                properties.map((p: any) => {
                  const isSelected = selectedMapProperty?.id === p.id;
                  return (
                    <Card
                      key={p.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${isSelected ? "ring-2 ring-primary" : ""}`}
                      onClick={() => setSelectedMapProperty(p)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{p.title}</p>
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                              <MapPin className="inline h-3 w-3 mr-1" />
                              {[p.addressStreet, p.addressNumber, p.addressNeighborhood].filter(Boolean).join(", ")}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge className={`text-xs ${propertyStatusColors[p.status as PropertyStatus] || ""}`} variant="secondary">
                                {propertyStatusLabels[p.status as PropertyStatus] || p.status}
                              </Badge>
                              <span className="text-xs font-medium">{formatCurrency(p.rentValue)}</span>
                            </div>
                          </div>
                          <div className="flex flex-col gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); handleEdit(p.id); }}>
                              <Edit className="h-3 w-3" />
                            </Button>
                            <a
                              href={getGoogleMapsUrl(buildFullAddress(p))}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center h-7 w-7 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>

            {/* Map embed */}
            <Card className="lg:col-span-2">
              <CardContent className="p-0 h-[600px]">
                {selectedMapProperty ? (
                  <div className="h-full flex flex-col">
                    <div className="flex items-center justify-between p-3 border-b bg-muted/30">
                      <div>
                        <p className="font-medium text-sm">{selectedMapProperty.title}</p>
                        <p className="text-xs text-muted-foreground">{buildFullAddress(selectedMapProperty)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={propertyStatusColors[selectedMapProperty.status as PropertyStatus] || ""} variant="secondary">
                          {propertyStatusLabels[selectedMapProperty.status as PropertyStatus] || selectedMapProperty.status}
                        </Badge>
                        <a
                          href={getGoogleMapsUrl(buildFullAddress(selectedMapProperty))}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary flex items-center gap-1 hover:underline"
                        >
                          Abrir no Maps <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                    <div className="flex-1">
                      <iframe
                        title={`Mapa - ${selectedMapProperty.title}`}
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        loading="lazy"
                        allowFullScreen
                        referrerPolicy="no-referrer-when-downgrade"
                        src={getMapEmbedUrl(buildFullAddress(selectedMapProperty))}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                    <MapPin className="h-12 w-12 mb-3" />
                    <p className="font-medium">Selecione um imóvel</p>
                    <p className="text-sm">Clique em um imóvel ao lado para ver sua localização no mapa</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
        /* ────── Table View ────── */
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Imóvel</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Proprietário</TableHead>
                  <TableHead>Endereço</TableHead>
                  <TableHead>Quartos</TableHead>
                  <TableHead>Área</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={9} className="text-center py-12"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
                ) : properties.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Building2 className="h-12 w-12" />
                        <p className="font-medium">Nenhum imóvel cadastrado</p>
                        <p className="text-sm">Clique em &quot;Novo Imóvel&quot; para começar</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  properties.map((p: any) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.title}</TableCell>
                      <TableCell>{propertyTypeLabels[p.type as PropertyType] || p.type}</TableCell>
                      <TableCell>{p.owner?.name || ownersList.find((o: any) => o.id === p.ownerId)?.name || "-"}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {[p.addressStreet, p.addressNumber, p.addressCity].filter(Boolean).join(", ")}
                      </TableCell>
                      <TableCell>{p.bedrooms || "-"}</TableCell>
                      <TableCell>{p.area ? `${p.area}m²` : "-"}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(p.rentValue)}</TableCell>
                      <TableCell>
                        <Badge className={propertyStatusColors[p.status as PropertyStatus] || ""} variant="secondary">
                          {propertyStatusLabels[p.status as PropertyStatus] || p.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(p.id)}><Edit className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setSelectedMapProperty(p); setViewMode("map"); }}>
                              <MapPin className="mr-2 h-4 w-4" /> Ver no Mapa
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <a href={getGoogleMapsUrl(buildFullAddress(p))} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="mr-2 h-4 w-4" /> Abrir no Google Maps
                              </a>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(p.id, p.title || "")}>
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
        )}

        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{pagination.total} imóvel(is)</p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={!pagination.hasPrev} onClick={() => setPage(page - 1)}>Anterior</Button>
              <span className="text-sm">Página {pagination.page} de {pagination.totalPages}</span>
              <Button variant="outline" size="sm" disabled={!pagination.hasNext} onClick={() => setPage(page + 1)}>Próxima</Button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
    </RequireAuth>
  );
}
