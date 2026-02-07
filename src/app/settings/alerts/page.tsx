"use client";
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { PageWrapper, AnimatedItem } from "@/components/page-wrapper";
import { Bell, Plus, Trash2, Zap } from "lucide-react";
import { toast } from "sonner";

interface AlertRule {
  id: string; name: string; condition: { type: string; value?: number; categoryId?: string }; action: { type: string; webhookUrl?: string }; active: boolean; lastTriggered: string | null; triggerCount: number;
}

const CONDITION_TYPES = [
  { value: "balance_below", label: "Saldo abaixo de" },
  { value: "balance_above", label: "Saldo acima de" },
  { value: "spending_category_exceeds", label: "Gasto em categoria excede" },
  { value: "income_received", label: "Receita recebida" },
  { value: "transaction_amount_above", label: "Transação acima de" },
  { value: "no_transactions_for_days", label: "Sem transações por X dias" },
];

const TEMPLATES = [
  { name: "Saldo baixo", condition: { type: "balance_below", value: 500 }, action: { type: "create_notification" } },
  { name: "Transação alta", condition: { type: "transaction_amount_above", value: 1000 }, action: { type: "create_notification" } },
  { name: "Receita recebida", condition: { type: "income_received" }, action: { type: "create_notification" } },
];

export default function AlertsPage() {
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [condType, setCondType] = useState("balance_below");
  const [condValue, setCondValue] = useState("");
  const [actionType, setActionType] = useState("create_notification");
  const [webhookUrl, setWebhookUrl] = useState("");

  const load = useCallback(() => {
    fetch("/api/alert-rules").then((r) => r.json()).then(setRules).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);

  const create = async () => {
    if (!name) { toast.error("Nome obrigatório"); return; }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const condition: any = { type: condType };
    if (condValue) condition.value = Number(condValue);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const action: any = { type: actionType };
    if (actionType === "send_webhook" && webhookUrl) action.webhookUrl = webhookUrl;
    await fetch("/api/alert-rules", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, condition, action }) });
    toast.success("Alerta criado!");
    setName(""); setCondValue(""); setShowForm(false); load();
  };

  const toggle = async (id: string, active: boolean) => {
    await fetch("/api/alert-rules", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, active }) });
    load();
  };

  const remove = async (id: string) => {
    await fetch("/api/alert-rules", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    toast.success("Removido"); load();
  };

  const applyTemplate = (t: typeof TEMPLATES[0]) => {
    setName(t.name);
    setCondType(t.condition.type);
    setCondValue(t.condition.value?.toString() || "");
    setActionType(t.action.type);
    setShowForm(true);
  };

  return (
    <PageWrapper>
      <AnimatedItem>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Bell className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Alertas Inteligentes</h1>
              <p className="text-muted-foreground">Configure regras automáticas para monitorar suas finanças</p>
            </div>
          </div>
          <Button onClick={() => setShowForm(!showForm)}><Plus className="h-4 w-4 mr-2" /> Novo Alerta</Button>
        </div>
      </AnimatedItem>

      <AnimatedItem>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Zap className="h-5 w-5" /> Templates Rápidos</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {TEMPLATES.map((t) => (
              <Button key={t.name} variant="outline" size="sm" onClick={() => applyTemplate(t)}>{t.name}</Button>
            ))}
          </CardContent>
        </Card>
      </AnimatedItem>

      {showForm && (
        <AnimatedItem>
          <Card>
            <CardHeader><CardTitle>Novo Alerta</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div><Label>Nome</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Saldo baixo conta principal" /></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Condição</Label>
                  <Select value={condType} onValueChange={setCondType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CONDITION_TYPES.map((c) => (<SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                {condType !== "income_received" && (
                  <div><Label>Valor</Label><Input type="number" value={condValue} onChange={(e) => setCondValue(e.target.value)} placeholder="0.00" /></div>
                )}
              </div>
              <div>
                <Label>Ação</Label>
                <Select value={actionType} onValueChange={setActionType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="create_notification">Criar notificação</SelectItem>
                    <SelectItem value="send_webhook">Enviar webhook</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {actionType === "send_webhook" && (
                <div><Label>URL do Webhook</Label><Input value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} placeholder="https://..." /></div>
              )}
              <div className="flex gap-2">
                <Button onClick={create}>Criar Alerta</Button>
                <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              </div>
            </CardContent>
          </Card>
        </AnimatedItem>
      )}

      <AnimatedItem>
        <Card>
          <CardHeader><CardTitle>Regras Ativas</CardTitle></CardHeader>
          <CardContent>
            {rules.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Nenhuma regra configurada</p>
            ) : (
              <div className="space-y-3">
                {rules.map((r) => (
                  <div key={r.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <Switch checked={r.active} onCheckedChange={(v) => toggle(r.id, v)} />
                      <div>
                        <div className="font-medium">{r.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {CONDITION_TYPES.find((c) => c.value === r.condition.type)?.label || r.condition.type}
                          {r.condition.value ? ` R$ ${r.condition.value}` : ""} → {r.action.type === "create_notification" ? "Notificação" : "Webhook"}
                        </div>
                        {r.triggerCount > 0 && (
                          <div className="text-xs text-muted-foreground">Ativado {r.triggerCount}x · Último: {r.lastTriggered ? new Date(r.lastTriggered).toLocaleString("pt-BR") : "nunca"}</div>
                        )}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => remove(r.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </AnimatedItem>
    </PageWrapper>
  );
}
