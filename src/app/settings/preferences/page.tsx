"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageWrapper, AnimatedItem } from "@/components/page-wrapper";
import { Settings, Bell, Globe, Calendar } from "lucide-react";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

interface Prefs {
  defaultDateRange: string;
  numberFormat: string;
  firstDayOfWeek: number;
  defaultAccountId: string | null;
  notifyBudgetExceeded: boolean;
  notifyGoalMilestone: boolean;
  notifyRecurringDue: boolean;
  notifyLargeTransaction: boolean;
  notifyLowBalance: boolean;
  notifySpendingSpike: boolean;
}

interface TenantSettings {
  fiscalYearStartMonth: number;
  defaultCurrency: string;
  autoCategorization: boolean;
  lowBalanceThreshold: number;
  budgetWarningPercent: number;
  budgetCriticalPercent: number;
  dataRetentionMonths: number;
}

export default function PreferencesPage() {
  const defaultPrefs: Prefs = { defaultDateRange: "30d", numberFormat: "pt-BR", firstDayOfWeek: 0, defaultAccountId: null, notifyBudgetExceeded: true, notifyGoalMilestone: true, notifyRecurringDue: true, notifyLargeTransaction: false, notifyLowBalance: false, notifySpendingSpike: false };
  const defaultTenant: TenantSettings = { fiscalYearStartMonth: 1, defaultCurrency: "BRL", autoCategorization: true, lowBalanceThreshold: 100, budgetWarningPercent: 80, budgetCriticalPercent: 100, dataRetentionMonths: 60 };

  const [prefs, setPrefs] = useState<Prefs | null>(null);
  const [tenantSettings, setTenantSettings] = useState<TenantSettings | null>(null);
  const [accounts, setAccounts] = useState<{ id: string; name: string }[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    document.title = "Preferências | Ori Financeiro";
    const safeJson = async (url: string, fallback: any) => {
      try {
        const r = await fetch(url);
        const text = await r.text();
        try { return JSON.parse(text); } catch { return fallback; }
      } catch { return fallback; }
    };
    Promise.all([
      safeJson("/api/preferences", defaultPrefs),
      safeJson("/api/tenant-settings", defaultTenant),
      safeJson("/api/accounts", []),
    ]).then(([p, t, a]) => {
      setPrefs(p);
      setTenantSettings(t);
      setAccounts(Array.isArray(a) ? a : []);
      setLoaded(true);
    });
  }, []);

  const savePrefs = async () => {
    await fetch("/api/preferences", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(prefs) });
    toast.success("Preferências salvas!");
  };

  const saveTenantSettings = async () => {
    await fetch("/api/tenant-settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(tenantSettings) });
    toast.success("Configurações do sistema salvas!");
  };

  if (!loaded || !prefs || !tenantSettings) return <div className="p-8 text-center text-muted-foreground">Carregando...</div>;

  return (
    <PageWrapper>
      <AnimatedItem>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2 mb-6"><Settings className="h-6 w-6" /> Preferências</h1>
      </AnimatedItem>

      <div className="space-y-6">
        <AnimatedItem>
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Globe className="h-4 w-4" /> Preferências do Usuário</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Período Padrão</Label>
                  <Select value={prefs.defaultDateRange} onValueChange={v => setPrefs({ ...prefs, defaultDateRange: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="thisMonth">Este Mês</SelectItem>
                      <SelectItem value="lastMonth">Mês Passado</SelectItem>
                      <SelectItem value="thisYear">Este Ano</SelectItem>
                      <SelectItem value="last30">Últimos 30 dias</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Formato de Número</Label>
                  <Select value={prefs.numberFormat} onValueChange={v => setPrefs({ ...prefs, numberFormat: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pt-BR">1.000,00 (BR)</SelectItem>
                      <SelectItem value="en-US">1,000.00 (US)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Primeiro Dia da Semana</Label>
                  <Select value={String(prefs.firstDayOfWeek)} onValueChange={v => setPrefs({ ...prefs, firstDayOfWeek: parseInt(v) })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Domingo</SelectItem>
                      <SelectItem value="1">Segunda-feira</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Conta Padrão</Label>
                  <Select value={prefs.defaultAccountId || ""} onValueChange={v => setPrefs({ ...prefs, defaultAccountId: v || null })}>
                    <SelectTrigger><SelectValue placeholder="Nenhuma" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Nenhuma</SelectItem>
                      {accounts.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-sm font-medium flex items-center gap-2 mb-3"><Bell className="h-4 w-4" /> Notificações</h3>
                <div className="space-y-3">
                  {[
                    { key: "notifyBudgetExceeded" as const, label: "Orçamento excedido" },
                    { key: "notifyGoalMilestone" as const, label: "Meta atingida (milestones)" },
                    { key: "notifyRecurringDue" as const, label: "Pagamento recorrente próximo" },
                    { key: "notifyLargeTransaction" as const, label: "Transação grande" },
                    { key: "notifyLowBalance" as const, label: "Saldo baixo" },
                    { key: "notifySpendingSpike" as const, label: "Pico de gastos" },
                  ].map(item => (
                    <div key={item.key} className="flex items-center justify-between">
                      <span className="text-sm">{item.label}</span>
                      <Switch checked={prefs[item.key]} onCheckedChange={v => setPrefs({ ...prefs, [item.key]: v })} />
                    </div>
                  ))}
                </div>
              </div>

              <Button onClick={savePrefs}>Salvar Preferências</Button>
            </CardContent>
          </Card>
        </AnimatedItem>

        <AnimatedItem>
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Calendar className="h-4 w-4" /> Configurações do Sistema (Tenant)</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Início do Ano Fiscal (mês)</Label>
                  <Select value={String(tenantSettings.fiscalYearStartMonth)} onValueChange={v => setTenantSettings({ ...tenantSettings, fiscalYearStartMonth: parseInt(v) })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => <SelectItem key={i + 1} value={String(i + 1)}>{new Date(2000, i).toLocaleString("pt-BR", { month: "long" })}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Moeda Padrão</Label>
                  <Select value={tenantSettings.defaultCurrency} onValueChange={v => setTenantSettings({ ...tenantSettings, defaultCurrency: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BRL">BRL (R$)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Limite Saldo Baixo (R$)</Label>
                  <Input type="number" value={tenantSettings.lowBalanceThreshold} onChange={e => setTenantSettings({ ...tenantSettings, lowBalanceThreshold: parseFloat(e.target.value) || 0 })} />
                </div>
                <div>
                  <Label>Alerta Orçamento (%)</Label>
                  <Input type="number" value={tenantSettings.budgetWarningPercent} onChange={e => setTenantSettings({ ...tenantSettings, budgetWarningPercent: parseInt(e.target.value) || 80 })} />
                </div>
                <div>
                  <Label>Crítico Orçamento (%)</Label>
                  <Input type="number" value={tenantSettings.budgetCriticalPercent} onChange={e => setTenantSettings({ ...tenantSettings, budgetCriticalPercent: parseInt(e.target.value) || 100 })} />
                </div>
                <div>
                  <Label>Retenção de Dados (meses)</Label>
                  <Input type="number" value={tenantSettings.dataRetentionMonths} onChange={e => setTenantSettings({ ...tenantSettings, dataRetentionMonths: parseInt(e.target.value) || 60 })} />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Auto-categorização</span>
                <Switch checked={tenantSettings.autoCategorization} onCheckedChange={v => setTenantSettings({ ...tenantSettings, autoCategorization: v })} />
              </div>
              <Button onClick={saveTenantSettings}>Salvar Configurações do Sistema</Button>
            </CardContent>
          </Card>
        </AnimatedItem>
      </div>
    </PageWrapper>
  );
}
