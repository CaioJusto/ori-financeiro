"use client";
import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils";
import { Plus, Trash2, Play, Repeat } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/empty-state";
import { PageWrapper, AnimatedItem } from "@/components/page-wrapper";
import { TableSkeleton } from "@/components/dashboard-skeleton";

interface Account { id: string; name: string }
interface Category { id: string; name: string; type: string }
interface Recurring { id: string; description: string; amount: number; type: string; frequency: string; dayOfMonth: number; active: boolean; account: Account; category: { name: string } }

const freqLabels: Record<string, string> = { monthly: "Mensal", weekly: "Semanal", yearly: "Anual" };

export default function RecurringPage() {
  const [items, setItems] = useState<Recurring[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ description: "", amount: "", type: "expense", accountId: "", categoryId: "", frequency: "monthly", dayOfMonth: "1" });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => { document.title = "Recorrências | Ori Financeiro"; }, []);

  const load = useCallback(() => { setLoading(true); fetch("/api/recurring").then((r) => r.json()).then((d) => { setItems(d); setLoading(false); }); }, []);
  useEffect(() => { load(); fetch("/api/accounts").then((r) => r.json()).then(setAccounts); fetch("/api/categories").then((r) => r.json()).then(setCategories); }, [load]);

  const submit = async () => {
    try {
      await fetch("/api/recurring", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      setOpen(false); setForm({ description: "", amount: "", type: "expense", accountId: "", categoryId: "", frequency: "monthly", dayOfMonth: "1" });
      toast.success("Recorrência criada!"); load();
    } catch { toast.error("Erro ao criar recorrência"); }
  };

  const toggle = async (id: string, active: boolean) => {
    await fetch(`/api/recurring/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active: !active }) });
    toast.success(active ? "Recorrência desativada" : "Recorrência ativada"); load();
  };

  const remove = async () => {
    if (!deleteId) return;
    try {
      await fetch(`/api/recurring/${deleteId}`, { method: "DELETE" });
      toast.success("Recorrência excluída!"); setDeleteId(null); load();
    } catch { toast.error("Erro ao excluir"); }
  };

  const process = async () => {
    try {
      const res = await fetch("/api/recurring/process", { method: "POST" });
      const data = await res.json();
      toast.success(`${data.created} transações criadas!`); load();
    } catch { toast.error("Erro ao processar"); }
  };

  const filteredCats = categories.filter((c) => c.type === form.type);

  return (
    <PageWrapper>
      <AnimatedItem>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Recorrências</h1>
            <p className="text-sm text-muted-foreground">Lançamentos automáticos</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={process}><Play className="h-4 w-4 mr-2" />Processar Mês</Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-2" />Nova Recorrência</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Nova Recorrência</DialogTitle><DialogDescription>Crie um lançamento automático</DialogDescription></DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="space-y-2"><Label>Descrição</Label><Input placeholder="Descrição" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Valor</Label><Input type="number" placeholder="0.00" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v, categoryId: "" })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="expense">Despesa</SelectItem><SelectItem value="income">Receita</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Frequência</Label>
                    <Select value={form.frequency} onValueChange={(v) => setForm({ ...form, frequency: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="monthly">Mensal</SelectItem><SelectItem value="weekly">Semanal</SelectItem><SelectItem value="yearly">Anual</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Dia do mês</Label><Input type="number" placeholder="1" value={form.dayOfMonth} onChange={(e) => setForm({ ...form, dayOfMonth: e.target.value })} /></div>
                  <div className="space-y-2">
                    <Label>Conta</Label>
                    <Select value={form.accountId} onValueChange={(v) => setForm({ ...form, accountId: v })}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>{accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Categoria</Label>
                    <Select value={form.categoryId} onValueChange={(v) => setForm({ ...form, categoryId: v })}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>{filteredCats.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <Button onClick={submit} className="w-full" disabled={!form.description || !form.amount || !form.accountId || !form.categoryId}>Salvar</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </AnimatedItem>

      <AnimatedItem>
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Lista de Recorrências</CardTitle></CardHeader>
          <CardContent>
            {loading ? <TableSkeleton rows={3} cols={7} /> : items.length === 0 ? (
              <EmptyState icon={Repeat} title="Nenhuma recorrência" description="Crie lançamentos automáticos para despesas e receitas fixas" actionLabel="Nova Recorrência" onAction={() => setOpen(true)} />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Descrição</TableHead><TableHead>Categoria</TableHead><TableHead>Conta</TableHead>
                      <TableHead>Frequência</TableHead><TableHead>Dia</TableHead><TableHead className="text-right">Valor</TableHead>
                      <TableHead>Ativo</TableHead><TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className={`font-medium ${!item.active ? "line-through text-muted-foreground" : ""}`}>{item.description}</TableCell>
                        <TableCell className="text-muted-foreground">{item.category.name}</TableCell>
                        <TableCell className="text-muted-foreground">{item.account.name}</TableCell>
                        <TableCell><Badge variant="secondary">{freqLabels[item.frequency] || item.frequency}</Badge></TableCell>
                        <TableCell className="text-muted-foreground">{item.dayOfMonth}</TableCell>
                        <TableCell className="text-right"><Badge variant={item.type === "income" ? "success" : "danger"}>{formatCurrency(item.amount)}</Badge></TableCell>
                        <TableCell><Switch checked={item.active} onCheckedChange={() => toggle(item.id, item.active)} /></TableCell>
                        <TableCell><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteId(item.id)}><Trash2 className="h-4 w-4 text-muted-foreground" /></Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </AnimatedItem>

      <ConfirmDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)} onConfirm={remove} />
    </PageWrapper>
  );
}
