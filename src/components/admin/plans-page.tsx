"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Star,
  Check,
  X,
  Users,
  Building2,
  FileText,
  HardDrive,
  MessageCircle,
  BarChart3,
  Code,
  CreditCard,
  Copy,
} from "lucide-react";
import { toast } from "sonner";

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

interface PlanLimits {
  properties: number;
  tenants: number;
  owners: number;
  contracts: number;
  users: number;
  storageGB: number;
  whatsapp: boolean;
  reports: boolean;
  api: boolean;
}

interface Plan {
  id: string;
  name: string;
  slug: string;
  stripeProductId: string;
  stripePriceIdMonthly: string;
  stripePriceIdYearly: string;
  priceMonthly: number;
  priceYearly: number;
  active: boolean;
  popular: boolean;
  trialDays: number;
  limits: PlanLimits;
  features: string[];
  subscribersCount: number;
  mrr: number;
  createdAt: string;
  updatedAt: string;
}

const emptyPlan: Partial<Plan> = {
  name: "",
  slug: "",
  priceMonthly: 0,
  priceYearly: 0,
  active: true,
  popular: false,
  trialDays: 14,
  stripeProductId: "",
  stripePriceIdMonthly: "",
  stripePriceIdYearly: "",
  limits: {
    properties: 10,
    tenants: 10,
    owners: 5,
    contracts: 10,
    users: 1,
    storageGB: 1,
    whatsapp: false,
    reports: false,
    api: false,
  },
  features: [],
};

export function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editPlan, setEditPlan] = useState<Partial<Plan> | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<Plan | null>(null);
  const [newFeature, setNewFeature] = useState("");

  useEffect(() => {
    fetch("/api/admin/plans", { credentials: "include" })
      .then(r => r.json())
      .then(j => { if (j.data) setPlans(j.data); })
      .catch(e => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  const isEditing = editPlan?.id !== undefined;

  const openCreate = () => {
    setEditPlan({ ...emptyPlan, features: [] });
    setDialogOpen(true);
  };

  const openEdit = (plan: Plan) => {
    setEditPlan({ ...plan, features: [...plan.features] });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!editPlan?.name || !editPlan?.slug) {
      toast.error("Nome e slug são obrigatórios");
      return;
    }

    if (isEditing) {
      setPlans((prev) => prev.map((p) => (p.id === editPlan.id ? { ...p, ...editPlan, updatedAt: new Date().toISOString() } as Plan : p)));
      toast.success(`Plano "${editPlan.name}" atualizado`);
    } else {
      const newPlan = {
        ...emptyPlan,
        ...editPlan,
        id: `plan-${Date.now()}`,
        subscribersCount: 0,
        mrr: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as Plan;
      setPlans((prev) => [...prev, newPlan]);
      toast.success(`Plano "${editPlan.name}" criado`);
    }
    setDialogOpen(false);
    setEditPlan(null);
  };

  const handleDelete = () => {
    if (!planToDelete) return;
    if (planToDelete.subscribersCount > 0) {
      toast.error("Não é possível excluir um plano com assinantes ativos");
      setDeleteDialogOpen(false);
      return;
    }
    setPlans((prev) => prev.filter((p) => p.id !== planToDelete.id));
    toast.success(`Plano "${planToDelete.name}" excluído`);
    setDeleteDialogOpen(false);
    setPlanToDelete(null);
  };

  const addFeature = () => {
    if (!newFeature.trim() || !editPlan) return;
    setEditPlan({ ...editPlan, features: [...(editPlan.features || []), newFeature.trim()] });
    setNewFeature("");
  };

  const removeFeature = (idx: number) => {
    if (!editPlan) return;
    const features = [...(editPlan.features || [])];
    features.splice(idx, 1);
    setEditPlan({ ...editPlan, features });
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Planos</h1>
          <p className="text-muted-foreground">Gerencie os planos de assinatura e suas funcionalidades</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Plano
        </Button>
      </div>

      {/* Plans Cards (visual overview) */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.id} className={`relative ${plan.popular ? "ring-2 ring-primary" : ""}`}>
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground">
                  <Star className="h-3 w-3 mr-1" /> Mais Popular
                </Badge>
              </div>
            )}
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <Badge variant={plan.active ? "default" : "secondary"}>
                  {plan.active ? "Ativo" : "Inativo"}
                </Badge>
              </div>
              <CardDescription className="text-xs font-mono">
                {plan.stripeProductId}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-3xl font-bold">
                  {formatCurrency(plan.priceMonthly)}
                  <span className="text-sm font-normal text-muted-foreground">/mês</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  ou {formatCurrency(plan.priceYearly)}/ano
                </p>
              </div>

              <Separator />

              {/* Limits */}
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{plan.limits.properties === -1 ? "∞" : plan.limits.properties} imóveis</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{plan.limits.tenants === -1 ? "∞" : plan.limits.tenants} inquilinos</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{plan.limits.contracts === -1 ? "∞" : plan.limits.contracts} contratos</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <HardDrive className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{plan.limits.storageGB} GB storage</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {plan.limits.whatsapp ? (
                    <Check className="h-3.5 w-3.5 text-green-500" />
                  ) : (
                    <X className="h-3.5 w-3.5 text-red-500" />
                  )}
                  <span>WhatsApp</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {plan.limits.reports ? (
                    <Check className="h-3.5 w-3.5 text-green-500" />
                  ) : (
                    <X className="h-3.5 w-3.5 text-red-500" />
                  )}
                  <span>Relatórios</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {plan.limits.api ? (
                    <Check className="h-3.5 w-3.5 text-green-500" />
                  ) : (
                    <X className="h-3.5 w-3.5 text-red-500" />
                  )}
                  <span>API</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{plan.limits.users === -1 ? "∞" : plan.limits.users} {plan.limits.users === 1 ? "usuário" : "usuários"}</span>
                </div>
              </div>

              <Separator />

              {/* Stats */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Assinantes:</span>
                <span className="font-medium">{plan.subscribersCount}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">MRR do plano:</span>
                <span className="font-medium">{formatCurrency(plan.mrr)}</span>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => openEdit(plan)}>
                  <Pencil className="h-4 w-4 mr-1" /> Editar
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="text-destructive hover:text-destructive"
                  onClick={() => {
                    setPlanToDelete(plan);
                    setDeleteDialogOpen(true);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Plans Table */}
      <Card>
        <CardHeader>
          <CardTitle>Todos os Planos</CardTitle>
          <CardDescription>Visão detalhada com IDs do Stripe</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plano</TableHead>
                <TableHead>Preço Mensal</TableHead>
                <TableHead>Preço Anual</TableHead>
                <TableHead>Stripe Product ID</TableHead>
                <TableHead>Assinantes</TableHead>
                <TableHead>MRR</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{plan.name}</span>
                      {plan.popular && (
                        <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{formatCurrency(plan.priceMonthly)}</TableCell>
                  <TableCell>{formatCurrency(plan.priceYearly)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                        {plan.stripeProductId}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => {
                          navigator.clipboard.writeText(plan.stripeProductId);
                          toast.success("Copiado!");
                        }}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>{plan.subscribersCount}</TableCell>
                  <TableCell className="font-medium">{formatCurrency(plan.mrr)}</TableCell>
                  <TableCell>
                    <Badge variant={plan.active ? "default" : "secondary"}>
                      {plan.active ? "Ativo" : "Inativo"}
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
                        <DropdownMenuItem onClick={() => openEdit(plan)}>
                          <Pencil className="mr-2 h-4 w-4" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => {
                            setPlanToDelete(plan);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Editar Plano" : "Novo Plano"}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Atualize as informações do plano de assinatura"
                : "Crie um novo plano de assinatura"}
            </DialogDescription>
          </DialogHeader>

          {editPlan && (
            <div className="space-y-6 py-4">
              {/* Basic info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="plan-name">Nome do Plano</Label>
                  <Input
                    id="plan-name"
                    value={editPlan.name || ""}
                    onChange={(e) => setEditPlan({ ...editPlan, name: e.target.value })}
                    placeholder="Ex: Profissional"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="plan-slug">Slug</Label>
                  <Input
                    id="plan-slug"
                    value={editPlan.slug || ""}
                    onChange={(e) => setEditPlan({ ...editPlan, slug: e.target.value })}
                    placeholder="Ex: professional"
                  />
                </div>
              </div>

              {/* Prices */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price-monthly">Preço Mensal (centavos)</Label>
                  <Input
                    id="price-monthly"
                    type="number"
                    value={editPlan.priceMonthly || 0}
                    onChange={(e) => setEditPlan({ ...editPlan, priceMonthly: parseInt(e.target.value) || 0 })}
                  />
                  <p className="text-xs text-muted-foreground">
                    = {formatCurrency(editPlan.priceMonthly || 0)}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price-yearly">Preço Anual (centavos)</Label>
                  <Input
                    id="price-yearly"
                    type="number"
                    value={editPlan.priceYearly || 0}
                    onChange={(e) => setEditPlan({ ...editPlan, priceYearly: parseInt(e.target.value) || 0 })}
                  />
                  <p className="text-xs text-muted-foreground">
                    = {formatCurrency(editPlan.priceYearly || 0)}
                  </p>
                </div>
              </div>

              {/* Stripe IDs */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Stripe
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label>Product ID</Label>
                    <Input
                      value={editPlan.stripeProductId || ""}
                      onChange={(e) => setEditPlan({ ...editPlan, stripeProductId: e.target.value })}
                      placeholder="prod_xxxxxxxxxxxx"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Price ID (Mensal)</Label>
                      <Input
                        value={editPlan.stripePriceIdMonthly || ""}
                        onChange={(e) => setEditPlan({ ...editPlan, stripePriceIdMonthly: e.target.value })}
                        placeholder="price_xxxxxxxxxxxx"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Price ID (Anual)</Label>
                      <Input
                        value={editPlan.stripePriceIdYearly || ""}
                        onChange={(e) => setEditPlan({ ...editPlan, stripePriceIdYearly: e.target.value })}
                        placeholder="price_xxxxxxxxxxxx"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Limits */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Limites
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Imóveis (-1 = ilimitado)</Label>
                    <Input
                      type="number"
                      value={editPlan.limits?.properties ?? 10}
                      onChange={(e) =>
                        setEditPlan({
                          ...editPlan,
                          limits: { ...editPlan.limits!, properties: parseInt(e.target.value) || 0 },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Inquilinos (-1 = ilimitado)</Label>
                    <Input
                      type="number"
                      value={editPlan.limits?.tenants ?? 10}
                      onChange={(e) =>
                        setEditPlan({
                          ...editPlan,
                          limits: { ...editPlan.limits!, tenants: parseInt(e.target.value) || 0 },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Proprietários (-1 = ilimitado)</Label>
                    <Input
                      type="number"
                      value={editPlan.limits?.owners ?? 5}
                      onChange={(e) =>
                        setEditPlan({
                          ...editPlan,
                          limits: { ...editPlan.limits!, owners: parseInt(e.target.value) || 0 },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Contratos (-1 = ilimitado)</Label>
                    <Input
                      type="number"
                      value={editPlan.limits?.contracts ?? 10}
                      onChange={(e) =>
                        setEditPlan({
                          ...editPlan,
                          limits: { ...editPlan.limits!, contracts: parseInt(e.target.value) || 0 },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Usuários (-1 = ilimitado)</Label>
                    <Input
                      type="number"
                      value={editPlan.limits?.users ?? 1}
                      onChange={(e) =>
                        setEditPlan({
                          ...editPlan,
                          limits: { ...editPlan.limits!, users: parseInt(e.target.value) || 0 },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Storage (GB)</Label>
                    <Input
                      type="number"
                      value={editPlan.limits?.storageGB ?? 1}
                      onChange={(e) =>
                        setEditPlan({
                          ...editPlan,
                          limits: { ...editPlan.limits!, storageGB: parseInt(e.target.value) || 0 },
                        })
                      }
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-6 pt-2">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={editPlan.limits?.whatsapp ?? false}
                      onCheckedChange={(v) =>
                        setEditPlan({ ...editPlan, limits: { ...editPlan.limits!, whatsapp: v } })
                      }
                    />
                    <Label className="flex items-center gap-1.5">
                      <MessageCircle className="h-4 w-4" /> WhatsApp
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={editPlan.limits?.reports ?? false}
                      onCheckedChange={(v) =>
                        setEditPlan({ ...editPlan, limits: { ...editPlan.limits!, reports: v } })
                      }
                    />
                    <Label className="flex items-center gap-1.5">
                      <BarChart3 className="h-4 w-4" /> Relatórios
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={editPlan.limits?.api ?? false}
                      onCheckedChange={(v) =>
                        setEditPlan({ ...editPlan, limits: { ...editPlan.limits!, api: v } })
                      }
                    />
                    <Label className="flex items-center gap-1.5">
                      <Code className="h-4 w-4" /> API
                    </Label>
                  </div>
                </div>
              </div>

              {/* Features list */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Features (exibidas na página de preços)
                </h3>
                <div className="space-y-2">
                  {(editPlan.features || []).map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500 shrink-0" />
                      <span className="text-sm flex-1">{feat}</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeFeature(idx)}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Nova feature..."
                      value={newFeature}
                      onChange={(e) => setNewFeature(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addFeature()}
                    />
                    <Button variant="outline" size="sm" onClick={addFeature}>
                      Adicionar
                    </Button>
                  </div>
                </div>
              </div>

              {/* Toggles */}
              <div className="flex flex-wrap gap-6">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editPlan.active ?? true}
                    onCheckedChange={(v) => setEditPlan({ ...editPlan, active: v })}
                  />
                  <Label>Plano Ativo</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editPlan.popular ?? false}
                    onCheckedChange={(v) => setEditPlan({ ...editPlan, popular: v })}
                  />
                  <Label>Destacar como Popular</Label>
                </div>
                <div className="space-y-2">
                  <Label>Dias de Trial</Label>
                  <Input
                    type="number"
                    className="w-24"
                    value={editPlan.trialDays ?? 14}
                    onChange={(e) => setEditPlan({ ...editPlan, trialDays: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              {isEditing ? "Salvar Alterações" : "Criar Plano"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Plano</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o plano &quot;{planToDelete?.name}&quot;?
              {planToDelete && planToDelete.subscribersCount > 0 && (
                <span className="block mt-2 text-destructive font-medium">
                  Este plano possui {planToDelete.subscribersCount} assinantes ativos e não pode ser excluído.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
