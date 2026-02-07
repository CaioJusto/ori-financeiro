"use client";
import { useRef, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageWrapper, AnimatedItem } from "@/components/page-wrapper";
import { Settings, Download, Upload, Loader2, User, Globe, Database, Info, Trash2, RotateCcw, ExternalLink, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";

export default function SettingsPage() {
  const [restoring, setRestoring] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [clearConfirm1, setClearConfirm1] = useState(false);
  const [clearConfirm2, setClearConfirm2] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);

  // Profile
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");

  // Preferences
  const [currency, setCurrency] = useState("BRL");
  const [firstDayOfWeek, setFirstDayOfWeek] = useState("1");
  const [dateFormat, setDateFormat] = useState("dd/MM/yyyy");

  useEffect(() => {
    document.title = "Configurações | Ori Financeiro";
    setProfileName(localStorage.getItem("ori-profile-name") || "");
    setProfileEmail(localStorage.getItem("ori-profile-email") || "");
    setCurrency(localStorage.getItem("ori-currency") || "BRL");
    setFirstDayOfWeek(localStorage.getItem("ori-first-day") || "1");
    setDateFormat(localStorage.getItem("ori-date-format") || "dd/MM/yyyy");
  }, []);

  const saveProfile = () => {
    localStorage.setItem("ori-profile-name", profileName);
    localStorage.setItem("ori-profile-email", profileEmail);
    toast.success("Perfil salvo!");
  };

  const savePreferences = () => {
    localStorage.setItem("ori-currency", currency);
    localStorage.setItem("ori-first-day", firstDayOfWeek);
    localStorage.setItem("ori-date-format", dateFormat);
    toast.success("Preferências salvas!");
  };

  const backup = () => {
    window.open("/api/backup", "_blank");
    toast.success("Backup iniciado");
  };

  const restore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRestoring(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const res = await fetch("/api/restore", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const result = await res.json();
      if (res.ok) toast.success(result.message || "Restaurado com sucesso!");
      else toast.error(result.error || "Erro ao restaurar");
    } catch { toast.error("Arquivo inválido"); }
    setRestoring(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const clearAllData = async () => {
    setClearConfirm2(false);
    try {
      // Clear localStorage
      const keysToKeep = ["theme", "ori-color-theme"];
      const saved: Record<string, string> = {};
      keysToKeep.forEach(k => { const v = localStorage.getItem(k); if (v) saved[k] = v; });
      localStorage.clear();
      Object.entries(saved).forEach(([k, v]) => localStorage.setItem(k, v));

      // Restore backup with empty data to clear DB
      const res = await fetch("/api/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accounts: [], categories: [], transactions: [], budgets: [], goals: [], tags: [], contacts: [], recurring: [], installments: [], payables: [], transfers: [], rules: [], creditCards: [] }),
      });
      if (res.ok) {
        toast.success("Todos os dados foram limpos!");
        setProfileName(""); setProfileEmail("");
      } else toast.error("Erro ao limpar dados");
    } catch { toast.error("Erro ao limpar dados"); }
  };

  const resetDefaults = () => {
    setResetConfirm(false);
    setCurrency("BRL"); setFirstDayOfWeek("1"); setDateFormat("dd/MM/yyyy");
    localStorage.setItem("ori-currency", "BRL");
    localStorage.setItem("ori-first-day", "1");
    localStorage.setItem("ori-date-format", "dd/MM/yyyy");
    toast.success("Preferências resetadas!");
  };

  return (
    <PageWrapper>
      <AnimatedItem>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <Settings className="h-6 w-6" />Configurações
        </h1>
        <p className="text-sm text-muted-foreground">Gerencie seu perfil, preferências e dados</p>
      </AnimatedItem>
      <AnimatedItem><Separator /></AnimatedItem>

      <AnimatedItem>
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile" className="flex items-center gap-1.5"><User className="h-3.5 w-3.5" />Perfil</TabsTrigger>
            <TabsTrigger value="preferences" className="flex items-center gap-1.5"><Globe className="h-3.5 w-3.5" />Preferências</TabsTrigger>
            <TabsTrigger value="data" className="flex items-center gap-1.5"><Database className="h-3.5 w-3.5" />Dados</TabsTrigger>
            <TabsTrigger value="about" className="flex items-center gap-1.5"><Info className="h-3.5 w-3.5" />Sobre</TabsTrigger>
          </TabsList>

          {/* Profile */}
          <TabsContent value="profile">
            <Card>
              <CardHeader><CardTitle className="text-sm font-medium">Perfil</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input id="name" placeholder="Seu nome" value={profileName} onChange={(e) => setProfileName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="seu@email.com" value={profileEmail} onChange={(e) => setProfileEmail(e.target.value)} />
                </div>
                <Button onClick={saveProfile} size="sm">Salvar Perfil</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preferences */}
          <TabsContent value="preferences">
            <Card>
              <CardHeader><CardTitle className="text-sm font-medium">Preferências</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Moeda Padrão</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BRL">BRL (R$)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Primeiro Dia da Semana</Label>
                  <Select value={firstDayOfWeek} onValueChange={setFirstDayOfWeek}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Domingo</SelectItem>
                      <SelectItem value="1">Segunda-feira</SelectItem>
                      <SelectItem value="6">Sábado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Formato de Data</Label>
                  <Select value={dateFormat} onValueChange={setDateFormat}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dd/MM/yyyy">DD/MM/AAAA</SelectItem>
                      <SelectItem value="MM/dd/yyyy">MM/DD/AAAA</SelectItem>
                      <SelectItem value="yyyy-MM-dd">AAAA-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={savePreferences} size="sm">Salvar Preferências</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Data */}
          <TabsContent value="data">
            <div className="space-y-4">
              <Card>
                <CardHeader><CardTitle className="text-sm font-medium">Backup & Restauração</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">Exporte todos os seus dados como JSON ou restaure a partir de um backup anterior.</p>
                  <div className="flex gap-3">
                    <Button onClick={backup} variant="outline" aria-label="Exportar backup"><Download className="h-4 w-4 mr-2" />Exportar Backup</Button>
                    <Button onClick={() => fileRef.current?.click()} variant="outline" disabled={restoring} aria-label="Restaurar backup">
                      {restoring ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                      Restaurar Backup
                    </Button>
                    <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={restore} />
                  </div>
                  <p className="text-xs text-muted-foreground">⚠️ A restauração substituirá todos os dados existentes.</p>
                </CardContent>
              </Card>

              <Card className="border-destructive/50">
                <CardHeader><CardTitle className="text-sm font-medium text-destructive">Zona de Perigo</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Limpar Todos os Dados</p>
                      <p className="text-xs text-muted-foreground">Remove todas as transações, contas, categorias e configurações.</p>
                    </div>
                    <Button variant="destructive" size="sm" onClick={() => setClearConfirm1(true)} aria-label="Limpar todos os dados">
                      <Trash2 className="h-4 w-4 mr-2" />Limpar Tudo
                    </Button>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Re-ver Tour de Boas-vindas</p>
                      <p className="text-xs text-muted-foreground">Mostra o tutorial de onboarding novamente.</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => { localStorage.removeItem("onboarding_completed"); toast.success("Recarregue a página para ver o tour!"); }} aria-label="Re-ver tour">
                      <BookOpen className="h-4 w-4 mr-2" />Tour
                    </Button>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Resetar Preferências</p>
                      <p className="text-xs text-muted-foreground">Volta todas as preferências para os valores padrão.</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setResetConfirm(true)} aria-label="Resetar preferências">
                      <RotateCcw className="h-4 w-4 mr-2" />Resetar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* About */}
          <TabsContent value="about">
            <Card>
              <CardHeader><CardTitle className="text-sm font-medium">Sobre o Ori Financeiro</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Versão</span>
                    <span className="text-sm font-mono">1.0.0</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">GitHub</span>
                    <a href="https://github.com/CaioJusto/ori-financeiro" target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1">
                      Repositório <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Tecnologias</span>
                    <span className="text-sm">Next.js, Prisma, shadcn/ui</span>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Créditos</p>
                    <p className="text-sm">Desenvolvido com ❤️ por Caio Justo</p>
                    <p className="text-xs text-muted-foreground mt-1">Sistema de gestão financeira pessoal e empresarial com design inspirado no Linear.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </AnimatedItem>

      {/* Clear data - first confirmation */}
      <ConfirmDialog
        open={clearConfirm1}
        onOpenChange={setClearConfirm1}
        onConfirm={() => { setClearConfirm1(false); setClearConfirm2(true); }}
        title="Limpar todos os dados?"
        description="Isso removerá TODAS as transações, contas, categorias e demais dados. Esta ação NÃO pode ser desfeita."
      />
      {/* Clear data - second confirmation */}
      <ConfirmDialog
        open={clearConfirm2}
        onOpenChange={setClearConfirm2}
        onConfirm={clearAllData}
        title="Tem CERTEZA ABSOLUTA?"
        description="Esta é sua última chance. Todos os dados serão permanentemente excluídos. Recomendamos fazer um backup antes."
      />
      <ConfirmDialog
        open={resetConfirm}
        onOpenChange={setResetConfirm}
        onConfirm={resetDefaults}
        title="Resetar preferências?"
        description="Todas as preferências voltarão para os valores padrão."
      />

      {/* Tour & Help */}
      <AnimatedItem>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Info className="h-5 w-5" />Tour & Ajuda</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" onClick={() => { localStorage.removeItem("product_tour_completed"); localStorage.removeItem("onboarding_completed"); window.location.reload(); }}>
              <RotateCcw className="h-4 w-4 mr-2" />Reiniciar tour de apresentação
            </Button>
          </CardContent>
        </Card>
      </AnimatedItem>
    </PageWrapper>
  );
}
