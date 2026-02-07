"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PageWrapper, AnimatedItem } from "@/components/page-wrapper";
import { Plus, Trash2, Pencil, XCircle, Calendar, DollarSign, Repeat } from "lucide-react";
import { toast } from "sonner";

interface Subscription {
  id: string; name: string; provider: string; amount: number; currency: string;
  billingCycle: string; nextBillingDate: string; category: string; status: string;
  startDate: string; cancelDate: string | null; logoUrl: string | null; notes: string | null;
}

const cycleLabels: Record<string, string> = { WEEKLY: "Semanal", MONTHLY: "Mensal", YEARLY: "Anual" };
const cycleMultiplier: Record<string, number> = { WEEKLY: 4.33, MONTHLY: 1, YEARLY: 1 / 12 };
const statusColors: Record<string, string> = { ACTIVE: "bg-green-500", PAUSED: "bg-yellow-500", CANCELLED: "bg-red-500" };
const statusLabels: Record<string, string> = { ACTIVE: "Ativa", PAUSED: "Pausada", CANCELLED: "Cancelada" };

const emptyForm = { name: "", provider: "", amount: "", currency: "BRL", billingCycle: "MONTHLY", nextBillingDate: "", category: "", notes: "", logoUrl: "" };

export default function SubscriptionsPage() {
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [filter, setFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const load = () => {
    const q = filter !== "all" ? `?status=${filter}` : "";
    fetch(`/api/subscriptions${q}`).then(r => r.json()).then(setSubs);
  };
  useEffect(() => { load(); }, [filter]);

  const activeSubs = subs.filter(s => s.status === "ACTIVE");
  const monthlyCost = activeSubs.reduce((s, sub) => s + sub.amount * (cycleMultiplier[sub.billingCycle] || 1), 0);
  const yearlyCost = monthlyCost * 12;

  const save = async () => {
    const url = editId ? `/api/subscriptions/${editId}` : "/api/subscriptions";
    const method = editId ? "PUT" : "POST";
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setOpen(false); setEditId(null); setForm(emptyForm); load();
    toast.success(editId ? "Atualizada" : "Adicionada");
  };

  const cancel = async (id: string) => {
    await fetch(`/api/subscriptions/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "CANCELLED" }) });
    load(); toast.success("Cancelada");
  };

  const del = async (id: string) => {
    await fetch(`/api/subscriptions/${id}`, { method: "DELETE" }); load(); toast.success("Removida");
  };

  const openEdit = (sub: Subscription) => {
    setEditId(sub.id); setForm({ name: sub.name, provider: sub.provider, amount: String(sub.amount), currency: sub.currency, billingCycle: sub.billingCycle, nextBillingDate: sub.nextBillingDate.slice(0, 10), category: sub.category, notes: sub.notes || "", logoUrl: sub.logoUrl || "" }); setOpen(true);
  };

  // Upcoming renewals (next 30 days)
  const now = new Date();
  const upcoming = activeSubs.filter(s => { const d = new Date(s.nextBillingDate); return d >= now && d <= new Date(now.getTime() + 30 * 86400000); }).sort((a, b) => new Date(a.nextBillingDate).getTime() - new Date(b.nextBillingDate).getTime());

  return (
    <PageWrapper>
      <AnimatedItem>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card><CardContent className="pt-6 flex items-center gap-3"><DollarSign className="w-8 h-8 text-violet-500" /><div><p className="text-sm text-muted-foreground">Custo Mensal</p><p className="text-2xl font-bold">{formatCurrency(monthlyCost)}</p></div></CardContent></Card>
          <Card><CardContent className="pt-6 flex items-center gap-3"><Calendar className="w-8 h-8 text-blue-500" /><div><p className="text-sm text-muted-foreground">Custo Anual</p><p className="text-2xl font-bold">{formatCurrency(yearlyCost)}</p></div></CardContent></Card>
          <Card><CardContent className="pt-6 flex items-center gap-3"><Repeat className="w-8 h-8 text-green-500" /><div><p className="text-sm text-muted-foreground">Assinaturas Ativas</p><p className="text-2xl font-bold">{activeSubs.length}</p></div></CardContent></Card>
        </div>
      </AnimatedItem>

      {upcoming.length > 0 && (
        <AnimatedItem>
          <Card className="mb-6">
            <CardHeader><CardTitle className="text-sm">Próximas Renovações (30 dias)</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {upcoming.map(s => (
                  <div key={s.id} className="flex justify-between items-center text-sm">
                    <span className="font-medium">{s.name}</span>
                    <span className="text-muted-foreground">{formatDate(s.nextBillingDate)} — {formatCurrency(s.amount)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </AnimatedItem>
      )}

      <AnimatedItem>
        <div className="flex flex-wrap gap-3 mb-4 items-center">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="ACTIVE">Ativas</SelectItem>
              <SelectItem value="PAUSED">Pausadas</SelectItem>
              <SelectItem value="CANCELLED">Canceladas</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setEditId(null); setForm(emptyForm); } }}>
            <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Nova Assinatura</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editId ? "Editar" : "Nova Assinatura"}</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Nome</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Provedor</Label><Input value={form.provider} onChange={e => setForm({ ...form, provider: e.target.value })} /></div>
                  <div><Label>Categoria</Label><Input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div><Label>Valor</Label><Input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} /></div>
                  <div><Label>Moeda</Label>
                    <Select value={form.currency} onValueChange={v => setForm({ ...form, currency: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="BRL">BRL</SelectItem><SelectItem value="USD">USD</SelectItem><SelectItem value="EUR">EUR</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div><Label>Ciclo</Label>
                    <Select value={form.billingCycle} onValueChange={v => setForm({ ...form, billingCycle: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{Object.entries(cycleLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div><Label>Próx. Cobrança</Label><Input type="date" value={form.nextBillingDate} onChange={e => setForm({ ...form, nextBillingDate: e.target.value })} /></div>
                <div><Label>Notas</Label><Input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
                <Button onClick={save} className="w-full">Salvar</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </AnimatedItem>

      <AnimatedItem>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subs.map(sub => (
            <Card key={sub.id}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold">{sub.name}</h3>
                    {sub.provider && <p className="text-sm text-muted-foreground">{sub.provider}</p>}
                  </div>
                  <Badge className={`${statusColors[sub.status]} text-white`}>{statusLabels[sub.status]}</Badge>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Valor</span><span className="font-medium">{formatCurrency(sub.amount)}/{cycleLabels[sub.billingCycle]?.toLowerCase()}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Próx. cobrança</span><span>{formatDate(sub.nextBillingDate)}</span></div>
                  {sub.category && <div className="flex justify-between"><span className="text-muted-foreground">Categoria</span><span>{sub.category}</span></div>}
                  {sub.cancelDate && <div className="flex justify-between"><span className="text-muted-foreground">Cancelada em</span><span>{formatDate(sub.cancelDate)}</span></div>}
                </div>
                <div className="flex gap-1 mt-3">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(sub)}><Pencil className="w-4 h-4" /></Button>
                  {sub.status === "ACTIVE" && <Button variant="ghost" size="sm" onClick={() => cancel(sub.id)}><XCircle className="w-4 h-4 text-yellow-500" /></Button>}
                  <Button variant="ghost" size="sm" onClick={() => del(sub.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {subs.length === 0 && <p className="text-muted-foreground col-span-3 text-center py-8">Nenhuma assinatura</p>}
        </div>
      </AnimatedItem>
    </PageWrapper>
  );
}
