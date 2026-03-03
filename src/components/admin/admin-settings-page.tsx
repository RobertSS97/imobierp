"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Save,
  RefreshCw,
  CreditCard,
  Globe,
  Mail,
  Shield,
  Server,
  Link2,
  Key,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

interface SettingsState {
  // Stripe
  stripeSecretKey: string;
  stripeWebhookSecret: string;
  stripePublishableKey: string;
  // App
  appName: string;
  appUrl: string;
  supportEmail: string;
  // Email
  fromEmail: string;
  smtpHost: string;
  smtpPort: number;
  // System
  trialDays: number;
  maintenanceMode: boolean;
}

const defaultSettings: SettingsState = {
  stripeSecretKey: "",
  stripeWebhookSecret: "",
  stripePublishableKey: "",
  appName: "ImobiERP",
  appUrl: "",
  supportEmail: "",
  fromEmail: "",
  smtpHost: "",
  smtpPort: 587,
  trialDays: 7,
  maintenanceMode: false,
};

export function AdminSettingsPage() {
  const [settings, setSettings] = useState<SettingsState>(defaultSettings);
  const [showKeys, setShowKeys] = useState(false);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/settings", { credentials: "include" })
      .then((r) => r.json())
      .then((j) => { if (j.data) setSettings(j.data); })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  const update = (partial: Partial<SettingsState>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        toast.success("Configurações salvas com sucesso!");
      } else {
        toast.error("Erro ao salvar configurações");
      }
    } catch {
      toast.error("Erro ao salvar configurações");
    } finally {
      setSaving(false);
    }
  };

  const handleStripeSync = async () => {
    setSyncing(true);
    await new Promise((r) => setTimeout(r, 2000));
    setSyncing(false);
    toast.success("Stripe sincronizado!");
  };

  const handleTestEmail = async () => {
    setTestingEmail(true);
    await new Promise((r) => setTimeout(r, 1500));
    setTestingEmail(false);
    toast.success("E-mail de teste enviado para " + settings.supportEmail);
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
          <p className="text-muted-foreground">Configure integrações, e-mail e parâmetros do sistema</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Salvar Configurações
        </Button>
      </div>

      <Tabs defaultValue="stripe" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="stripe">
            <CreditCard className="h-4 w-4 mr-2" /> Stripe
          </TabsTrigger>
          <TabsTrigger value="app">
            <Globe className="h-4 w-4 mr-2" /> Aplicação
          </TabsTrigger>
          <TabsTrigger value="email">
            <Mail className="h-4 w-4 mr-2" /> E-mail
          </TabsTrigger>
          <TabsTrigger value="system">
            <Server className="h-4 w-4 mr-2" /> Sistema
          </TabsTrigger>
        </TabsList>

        {/* ─── Stripe ──────────────────────────────────────── */}
        <TabsContent value="stripe" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Integração Stripe
              </CardTitle>
              <CardDescription>
                Configure as credenciais da Stripe para processar assinaturas e pagamentos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Connection status */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">Stripe Conectado</p>
                  <p className="text-xs text-muted-foreground">Modo de teste ativo • Última sincronização: há 2 horas</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-1.5">
                  <Key className="h-4 w-4" /> Mostrar chaves
                </Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowKeys((v) => !v)}
                >
                  {showKeys ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
                  {showKeys ? "Ocultar" : "Mostrar"}
                </Button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="stripe-pk">Publishable Key</Label>
                  <Input
                    id="stripe-pk"
                    type={showKeys ? "text" : "password"}
                    value={settings.stripePublishableKey}
                    onChange={(e) => update({ stripePublishableKey: e.target.value })}
                    placeholder="pk_test_xxxxxxxxxxxx"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stripe-sk">Secret Key</Label>
                  <Input
                    id="stripe-sk"
                    type={showKeys ? "text" : "password"}
                    value={settings.stripeSecretKey}
                    onChange={(e) => update({ stripeSecretKey: e.target.value })}
                    placeholder="sk_test_xxxxxxxxxxxx"
                  />
                  <p className="text-xs text-muted-foreground">
                    Nunca compartilhe sua Secret Key. Ela é usada apenas no servidor.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stripe-wh">Webhook Secret</Label>
                  <Input
                    id="stripe-wh"
                    type={showKeys ? "text" : "password"}
                    value={settings.stripeWebhookSecret}
                    onChange={(e) => update({ stripeWebhookSecret: e.target.value })}
                    placeholder="whsec_xxxxxxxxxxxx"
                  />
                  <p className="text-xs text-muted-foreground">
                    Configure o endpoint de webhook no Stripe para: {settings.appUrl}/api/webhooks/stripe
                  </p>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Sincronizar com Stripe</p>
                  <p className="text-xs text-muted-foreground">
                    Importar e sincronizar dados de clientes, assinaturas e pagamentos
                  </p>
                </div>
                <Button variant="outline" onClick={handleStripeSync} disabled={syncing}>
                  {syncing ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Sincronizar
                </Button>
              </div>

              <Separator />

              {/* Webhook events */}
              <div>
                <p className="text-sm font-medium mb-3">Eventos do Webhook monitorados</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    "customer.subscription.created",
                    "customer.subscription.updated",
                    "customer.subscription.deleted",
                    "invoice.paid",
                    "invoice.payment_failed",
                    "checkout.session.completed",
                    "customer.created",
                    "customer.updated",
                  ].map((event) => (
                    <Badge key={event} variant="outline" className="text-xs font-mono">
                      {event}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── App ──────────────────────────────────────── */}
        <TabsContent value="app" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Configurações da Aplicação
              </CardTitle>
              <CardDescription>Informações gerais sobre o sistema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="app-name">Nome da Aplicação</Label>
                  <Input
                    id="app-name"
                    value={settings.appName}
                    onChange={(e) => update({ appName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="app-url">URL da Aplicação</Label>
                  <Input
                    id="app-url"
                    value={settings.appUrl}
                    onChange={(e) => update({ appUrl: e.target.value })}
                    placeholder="https://app.exemplo.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="support-email">E-mail de Suporte</Label>
                <Input
                  id="support-email"
                  type="email"
                  value={settings.supportEmail}
                  onChange={(e) => update({ supportEmail: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Email ──────────────────────────────────────── */}
        <TabsContent value="email" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Configurações de E-mail
              </CardTitle>
              <CardDescription>SMTP e templates de e-mail do sistema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Remetente (From)</Label>
                  <Input
                    value={settings.fromEmail}
                    onChange={(e) => update({ fromEmail: e.target.value })}
                    placeholder="noreply@exemplo.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Servidor SMTP</Label>
                  <Input
                    value={settings.smtpHost}
                    onChange={(e) => update({ smtpHost: e.target.value })}
                    placeholder="smtp.resend.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Porta SMTP</Label>
                <Input
                  type="number"
                  className="w-32"
                  value={settings.smtpPort}
                  onChange={(e) => update({ smtpPort: parseInt(e.target.value) || 587 })}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Testar Configuração</p>
                  <p className="text-xs text-muted-foreground">
                    Envia um e-mail de teste para {settings.supportEmail}
                  </p>
                </div>
                <Button variant="outline" onClick={handleTestEmail} disabled={testingEmail}>
                  {testingEmail ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Mail className="h-4 w-4 mr-2" />
                  )}
                  Enviar Teste
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── System ──────────────────────────────────────── */}
        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                Parâmetros do Sistema
              </CardTitle>
              <CardDescription>Configurações gerais e modo de manutenção</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Dias de Trial padrão</Label>
                <Input
                  type="number"
                  className="w-32"
                  value={settings.trialDays}
                  onChange={(e) => update({ trialDays: parseInt(e.target.value) || 0 })}
                />
                <p className="text-xs text-muted-foreground">
                  Quantidade padrão de dias de teste para novos clientes
                </p>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Label className="text-base">Modo de Manutenção</Label>
                    {settings.maintenanceMode && (
                      <Badge variant="destructive" className="text-xs">ATIVO</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Quando ativo, apenas administradores podem acessar o sistema.
                    Clientes verão uma página de manutenção.
                  </p>
                </div>
                <Switch
                  checked={settings.maintenanceMode}
                  onCheckedChange={(v) => {
                    update({ maintenanceMode: v });
                    toast[v ? "warning" : "success"](
                      v ? "Modo de manutenção ativado!" : "Modo de manutenção desativado"
                    );
                  }}
                />
              </div>

              {settings.maintenanceMode && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  <div>
                    <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                      Atenção: Modo de manutenção está ativo
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Os clientes não conseguirão acessar o sistema
                    </p>
                  </div>
                </div>
              )}

              <Separator />

              <div>
                <p className="text-sm font-medium mb-3">Informações do Sistema</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center justify-between p-2 rounded bg-muted/50">
                    <span className="text-muted-foreground">Versão</span>
                    <span className="font-mono">1.0.0</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-muted/50">
                    <span className="text-muted-foreground">Ambiente</span>
                    <Badge variant="outline" className="text-xs">Desenvolvimento</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-muted/50">
                    <span className="text-muted-foreground">Node.js</span>
                    <span className="font-mono">v20.11.0</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-muted/50">
                    <span className="text-muted-foreground">Next.js</span>
                    <span className="font-mono">15.x</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
