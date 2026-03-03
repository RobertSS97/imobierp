"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Bell, MessageCircle, DollarSign, Calendar, Percent, Save, Upload, Palette, Sun, Moon, Monitor, Check, Loader2 } from "lucide-react";
import { useThemeContext, type PrimaryColor } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import { authApi } from "@/lib/api-client";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { RequireAuth } from "@/contexts/auth-context";

export function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { primaryColor, setPrimaryColor } = useThemeContext();
  const { user, updateUser } = useAuth();
  const { toast } = useToast();

  // Company settings
  const [companyName, setCompanyName] = useState("");
  const [creci, setCreci] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");

  // Notifications
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [notifyPayment, setNotifyPayment] = useState(true);
  const [notifyOverdue, setNotifyOverdue] = useState(true);
  const [notifyExpiring, setNotifyExpiring] = useState(true);
  const [notifyNewRegister, setNotifyNewRegister] = useState(false);

  // WhatsApp
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [apiToken, setApiToken] = useState("");
  const [messageTemplate, setMessageTemplate] = useState("");

  // Financial
  const [autoChargeEnabled, setAutoChargeEnabled] = useState(true);
  const [chargeDay, setChargeDay] = useState("");
  const [lateFee, setLateFee] = useState("");
  const [interest, setInterest] = useState("");

  const [saving, setSaving] = useState<string | null>(null);
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const logoInputId = "logo-upload-input";

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Imagem muito grande", description: "Máximo de 2 MB.", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setCompanyLogo(dataUrl);
      try { localStorage.setItem("imobierp_company_logo", dataUrl); } catch {}
      toast({ title: "Logo atualizada!" });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setCompanyLogo(null);
    try { localStorage.removeItem("imobierp_company_logo"); } catch {}
    toast({ title: "Logo removida" });
  };

  // Load user data into form
  useEffect(() => {
    if (user) {
      setCompanyName(user.companyName || "");
      setCreci(user.creci || "");
      try { const saved = localStorage.getItem("imobierp_company_logo"); if (saved) setCompanyLogo(saved); } catch {}
      setCompanyEmail(user.email || "");
      setCompanyPhone(user.phone || "");
      setStreet(user.companyStreet || "");
      setNumber(user.companyNumber || "");
      setComplement(user.companyComplement || "");
      setNeighborhood(user.companyNeighborhood || "");
      setZipCode(user.companyZipCode || "");
      setCity(user.companyCity || "");
      setState(user.companyState || "");
      setWhatsappEnabled(user.whatsappEnabled || false);
      setWhatsappNumber(user.whatsappNumber || "");
      setApiToken(user.whatsappApiToken || "");
      setMessageTemplate(user.whatsappMessageTemplate || "");
      setAutoChargeEnabled(user.autoChargeEnabled ?? true);
      setChargeDay(user.autoChargeDay?.toString() || "");
      setLateFee(user.lateFeePercentage?.toString() || "");
      setInterest(user.interestPercentage?.toString() || "");
      setEmailNotifications(user.emailNotifications ?? true);
      setNotifyNewRegister(user.notifyNewRegister ?? false);
      setNotifyPayment(user.notifyPayment ?? true);
      setNotifyOverdue(user.notifyOverdue ?? true);
      setNotifyExpiring(user.notifyExpiring ?? true);
    }
  }, [user]);

  const handleSaveCompany = async () => {
    setSaving("company");
    try {
      const result = await authApi.updateProfile({
        companyName, creci, phone: companyPhone,
        companyStreet: street, companyNumber: number, companyComplement: complement,
        companyNeighborhood: neighborhood, companyZipCode: zipCode, companyCity: city, companyState: state,
      });
      if (result.data) updateUser(result.data);
      toast({ title: "Dados salvos!" });
    } catch { toast({ title: "Erro ao salvar", variant: "destructive" }); }
    setSaving(null);
  };

  const handleSaveNotifications = async () => {
    setSaving("notifications");
    try {
      const result = await authApi.updateProfile({
        emailNotifications, notifyPayment, notifyOverdue, notifyExpiring, notifyNewRegister,
      });
      if (result.data) updateUser(result.data);
      toast({ title: "Notificações salvas!" });
    } catch { toast({ title: "Erro ao salvar", variant: "destructive" }); }
    setSaving(null);
  };

  const handleSaveWhatsApp = async () => {
    setSaving("whatsapp");
    try {
      const result = await authApi.updateProfile({
        whatsappEnabled, whatsappNumber, whatsappApiToken: apiToken, whatsappMessageTemplate: messageTemplate,
      });
      if (result.data) updateUser(result.data);
      toast({ title: "WhatsApp salvo!" });
    } catch { toast({ title: "Erro ao salvar", variant: "destructive" }); }
    setSaving(null);
  };

  const handleSaveFinancial = async () => {
    setSaving("financial");
    try {
      const result = await authApi.updateProfile({
        autoChargeEnabled,
        chargeGenerationDay: chargeDay ? Number(chargeDay) : undefined,
        defaultLateFeePercent: lateFee ? Number(lateFee) : undefined,
        defaultInterestPercent: interest ? Number(interest) : undefined,
      });
      if (result.data) updateUser(result.data);
      toast({ title: "Configurações financeiras salvas!" });
    } catch { toast({ title: "Erro ao salvar", variant: "destructive" }); }
    setSaving(null);
  };

  const themes = [
    { value: "light", label: "Claro", icon: Sun },
    { value: "dark", label: "Escuro", icon: Moon },
    { value: "system", label: "Sistema", icon: Monitor },
  ] as const;

  const colorOptions: { value: PrimaryColor; label: string; colorClass: string }[] = [
    { value: "default", label: "Padrão", colorClass: "bg-gray-900 dark:bg-gray-100" },
    { value: "blue", label: "Azul", colorClass: "bg-blue-500" },
    { value: "green", label: "Verde", colorClass: "bg-green-500" },
    { value: "purple", label: "Roxo", colorClass: "bg-purple-500" },
    { value: "amber", label: "Âmbar", colorClass: "bg-amber-500" },
    { value: "red", label: "Vermelho", colorClass: "bg-red-500" },
  ];

  return (
    <RequireAuth><AppLayout>
      <div className="space-y-6">
        <div><h1 className="text-2xl font-bold">Configurações</h1><p className="text-muted-foreground">Gerencie as configurações do sistema</p></div>

        <Tabs defaultValue="company" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
            <TabsTrigger value="company">Empresa</TabsTrigger>
            <TabsTrigger value="notifications">Notificações</TabsTrigger>
            <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
            <TabsTrigger value="financial">Financeiro</TabsTrigger>
            <TabsTrigger value="appearance">Aparência</TabsTrigger>
          </TabsList>

          {/* Company */}
          <TabsContent value="company" className="space-y-6">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5" /> Dados da Empresa</CardTitle><CardDescription>Informações básicas da sua empresa ou corretora</CardDescription></CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-6">
                  <div className="flex flex-col items-center gap-2">
                    <div className="relative h-24 w-24 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                      {companyLogo ? (
                        <img src={companyLogo} alt="Logo" className="h-full w-full object-contain" />
                      ) : (
                        <Building2 className="h-10 w-10 text-muted-foreground" />
                      )}
                    </div>
                    <input id={logoInputId} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" onClick={() => document.getElementById(logoInputId)?.click()}>
                        <Upload className="h-4 w-4 mr-2" /> {companyLogo ? "Trocar" : "Logo"}
                      </Button>
                      {companyLogo && (
                        <Button variant="ghost" size="sm" className="text-destructive" onClick={handleRemoveLogo}>Remover</Button>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label>Nome da Empresa</Label><Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} /></div>
                      <div className="space-y-2"><Label>CRECI</Label><Input value={creci} onChange={(e) => setCreci(e.target.value)} /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label>E-mail</Label><Input type="email" value={companyEmail} onChange={(e) => setCompanyEmail(e.target.value)} /></div>
                      <div className="space-y-2"><Label>Telefone</Label><Input value={companyPhone} onChange={(e) => setCompanyPhone(e.target.value)} /></div>
                    </div>
                  </div>
                </div>
                <Separator />
                <div className="space-y-4">
                  <h4 className="font-medium">Endereço</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2 space-y-2"><Label>Rua</Label><Input value={street} onChange={(e) => setStreet(e.target.value)} /></div>
                    <div className="space-y-2"><Label>Número</Label><Input value={number} onChange={(e) => setNumber(e.target.value)} /></div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2"><Label>Complemento</Label><Input value={complement} onChange={(e) => setComplement(e.target.value)} /></div>
                    <div className="space-y-2"><Label>Bairro</Label><Input value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} /></div>
                    <div className="space-y-2"><Label>CEP</Label><Input value={zipCode} onChange={(e) => setZipCode(e.target.value)} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Cidade</Label><Input value={city} onChange={(e) => setCity(e.target.value)} /></div>
                    <div className="space-y-2"><Label>Estado</Label>
                      <Select value={state} onValueChange={setState}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>
                          {["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end"><Button onClick={handleSaveCompany} disabled={saving === "company"}>{saving === "company" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />} Salvar Alterações</Button></div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5" /> Notificações</CardTitle><CardDescription>Configure como você deseja receber notificações</CardDescription></CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between"><div className="space-y-0.5"><Label>Notificações por E-mail</Label><p className="text-sm text-muted-foreground">Receba atualizações por e-mail</p></div><Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} /></div>
                <Separator />
                <div className="space-y-4">
                  <h4 className="font-medium">Eventos</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between"><div><p className="font-medium">Novo pagamento</p><p className="text-sm text-muted-foreground">Quando um pagamento é confirmado</p></div><Switch checked={notifyPayment} onCheckedChange={setNotifyPayment} /></div>
                    <div className="flex items-center justify-between"><div><p className="font-medium">Cobrança vencida</p><p className="text-sm text-muted-foreground">Quando uma cobrança vence</p></div><Switch checked={notifyOverdue} onCheckedChange={setNotifyOverdue} /></div>
                    <div className="flex items-center justify-between"><div><p className="font-medium">Contrato perto do vencimento</p><p className="text-sm text-muted-foreground">30 dias antes do vencimento</p></div><Switch checked={notifyExpiring} onCheckedChange={setNotifyExpiring} /></div>
                    <div className="flex items-center justify-between"><div><p className="font-medium">Novo cadastro</p><p className="text-sm text-muted-foreground">Quando alguém é cadastrado</p></div><Switch checked={notifyNewRegister} onCheckedChange={setNotifyNewRegister} /></div>
                  </div>
                </div>
                <div className="flex justify-end"><Button onClick={handleSaveNotifications} disabled={saving === "notifications"}>{saving === "notifications" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />} Salvar Alterações</Button></div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* WhatsApp */}
          <TabsContent value="whatsapp" className="space-y-6">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><MessageCircle className="h-5 w-5" /> Integração WhatsApp</CardTitle><CardDescription>Configure o envio automático de cobranças via WhatsApp</CardDescription></CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between"><div className="space-y-0.5"><Label>Ativar Integração</Label><p className="text-sm text-muted-foreground">Permite envio de cobranças via WhatsApp</p></div><Switch checked={whatsappEnabled} onCheckedChange={setWhatsappEnabled} /></div>
                {whatsappEnabled && (<><Separator />
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label>Número WhatsApp</Label><Input value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)} placeholder="(00) 00000-0000" /></div>
                      <div className="space-y-2"><Label>Token da API</Label><Input type="password" value={apiToken} onChange={(e) => setApiToken(e.target.value)} /></div>
                    </div>
                    <div className="space-y-2"><Label>Modelo de Mensagem</Label>
                      <Textarea value={messageTemplate} onChange={(e) => setMessageTemplate(e.target.value)} rows={5} placeholder={"Olá {nome},\n\nSua cobrança de R$ {valor} vence em {data}.\n\nCódigo: {codigo}\nLink: {link}\n\nAtenciosamente,\n{empresa}"} />
                      <p className="text-xs text-muted-foreground">Variáveis: {"{nome}"}, {"{valor}"}, {"{data}"}, {"{codigo}"}, {"{link}"}, {"{empresa}"}</p>
                    </div>
                  </div>
                </>)}
                <div className="flex justify-end"><Button onClick={handleSaveWhatsApp} disabled={saving === "whatsapp"}>{saving === "whatsapp" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />} Salvar Alterações</Button></div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Financial */}
          <TabsContent value="financial" className="space-y-6">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><DollarSign className="h-5 w-5" /> Configurações Financeiras</CardTitle><CardDescription>Configure parâmetros financeiros padrão</CardDescription></CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between"><div className="space-y-0.5"><Label>Cobrança Automática</Label><p className="text-sm text-muted-foreground">Gerar cobranças automaticamente todo mês</p></div><Switch checked={autoChargeEnabled} onCheckedChange={setAutoChargeEnabled} /></div>
                <Separator />
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium flex items-center gap-2"><Calendar className="h-4 w-4" /> Geração de Cobranças</h4>
                    <div className="space-y-2"><Label>Dia de Geração</Label>
                      <Select value={chargeDay} onValueChange={setChargeDay}><SelectTrigger><SelectValue placeholder="Dia do mês" /></SelectTrigger><SelectContent>{[1,5,10,15,20,25].map(d => <SelectItem key={d} value={d.toString()}>Dia {d}</SelectItem>)}</SelectContent></Select>
                      <p className="text-xs text-muted-foreground">Dia em que as cobranças serão geradas</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-medium flex items-center gap-2"><Percent className="h-4 w-4" /> Multas e Juros</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label>Multa (%)</Label><Input type="number" value={lateFee} onChange={(e) => setLateFee(e.target.value)} placeholder="2" /></div>
                      <div className="space-y-2"><Label>Juros (%/mês)</Label><Input type="number" value={interest} onChange={(e) => setInterest(e.target.value)} placeholder="1" /></div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end"><Button onClick={handleSaveFinancial} disabled={saving === "financial"}>{saving === "financial" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />} Salvar Alterações</Button></div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance */}
          <TabsContent value="appearance" className="space-y-6">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Palette className="h-5 w-5" /> Aparência</CardTitle><CardDescription>Personalize a aparência do sistema</CardDescription></CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <Label className="text-base font-medium">Tema</Label>
                  <div className="grid grid-cols-3 gap-4">
                    {themes.map((t) => {
                      const Icon = t.icon;
                      const isSelected = theme === t.value;
                      return (
                        <button key={t.value} onClick={() => setTheme(t.value)} className={cn("relative flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all hover:bg-accent", isSelected ? "border-primary bg-primary/5" : "border-border hover:border-primary/50")}>
                          {isSelected && <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary flex items-center justify-center"><Check className="h-3 w-3 text-primary-foreground" /></div>}
                          <div className={cn("flex h-12 w-12 items-center justify-center rounded-full", t.value === "light" && "bg-gray-100 text-gray-900", t.value === "dark" && "bg-gray-900 text-gray-100", t.value === "system" && "bg-gradient-to-br from-gray-100 to-gray-900 text-gray-600")}><Icon className="h-6 w-6" /></div>
                          <span className="font-medium">{t.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <Separator />
                <div className="space-y-4">
                  <Label className="text-base font-medium">Cor Primária</Label>
                  <div className="grid grid-cols-6 gap-4">
                    {colorOptions.map((color) => {
                      const isSelected = primaryColor === color.value;
                      return (
                        <button key={color.value} onClick={() => setPrimaryColor(color.value)} className={cn("relative flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all hover:bg-accent", isSelected ? "border-primary bg-primary/5" : "border-border hover:border-primary/50")}>
                          <div className={cn("h-8 w-8 rounded-full", color.colorClass)}>{isSelected && <div className="h-full w-full rounded-full flex items-center justify-center bg-black/20"><Check className="h-4 w-4 text-white" /></div>}</div>
                          <span className="text-xs font-medium">{color.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <Separator />
                <div className="space-y-4">
                  <Label className="text-base font-medium">Pré-visualização</Label>
                  <div className="p-6 rounded-xl border bg-card">
                    <div className="flex items-center gap-4"><Button>Botão Primário</Button><Button variant="secondary">Secundário</Button><Button variant="outline">Outline</Button></div>
                    <div className="mt-4 flex items-center gap-4"><span className="text-primary font-medium">Texto destacado</span><a href="#" className="text-primary underline hover:opacity-80">Link de exemplo</a></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout></RequireAuth>
  );
}
