"use client";
import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";
import { Plus, Trash2, Target } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/empty-state";
import { PageWrapper, AnimatedItem } from "@/components/page-wrapper";
import { CardsSkeleton } from "@/components/dashboard-skeleton";

interface Category { id: string; name: string; type: string }
interface BudgetStatus { id: string; categoryId: string; amount: number; month: string; spent: number; percentage: number; category: Category }

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<BudgetStatus[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [form, setForm] = useState({ categoryId: "", amount: "", month: currentMonth });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => { document.title = "Orçamentos | Ori Financeiro"; }, []);

  const load = useCallback(() => { setLoading(true); fetch("/api/budgets/status").then((r) => r.json()).then((d) => { setBudgets(d); setLoading(false); }); }, []);
  useEffect(() => { load(); fetch("/api/categories").then((r) => r.json()).then(setCategories); }, [load]);

  const submit = async () => {
    try {
      await fetch("/api/budgets", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      setOpen(false); setForm({ categoryId: "", amount: "", month: currentMonth });
      toast.success("Orçamento criado!"); load();
    } catch { toast.error("Erro ao criar orçamento"); }
  };

  const remove = async () => {
    if (!deleteId) return;
    try {
      await fetch(`/api/budgets/${deleteId}`, { method: "DELETE" });
      toast.success("Orçamento excluído!"); setDeleteId(null); load();
    } catch { toast.error("Erro ao excluir"); }
  };

  const expenseCats = categories.filter((c) => c.type === "expense");
  const getColor = (pct: number) => pct > 90 ? "bg-red-500" : pct > 70 ? "bg-yellow-500" : "bg-emerald-500";

  return (
    <PageWrapper>
      <AnimatedItem>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Orçamentos</h1>
            <p className="text-sm text-muted-foreground">Controle de gastos por categoria</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-2" />Novo Orçamento</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Novo Orçamento</DialogTitle><DialogDescription>Defina um limite de gastos por categoria</DialogDescription></DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select value={form.categoryId} onValueChange={(v) => setForm({ ...form, categoryId: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{expenseCats.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Limite mensal</Label><Input type="number" placeholder="0.00" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
                <div className="space-y-2"><Label>Mês</Label><Input type="month" value={form.month} onChange={(e) => setForm({ ...form, month: e.target.value })} /></div>
                <Button onClick={submit} className="w-full" disabled={!form.categoryId || !form.amount}>Salvar</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </AnimatedItem>
      <AnimatedItem><Separator /></AnimatedItem>

      {loading ? <CardsSkeleton /> : budgets.length === 0 ? (
        <EmptyState icon={Target} title="Nenhum orçamento" description="Defina limites de gastos para controlar suas despesas" actionLabel="Novo Orçamento" onAction={() => setOpen(true)} />
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {budgets.map((b) => (
            <AnimatedItem key={b.id}>
              <Card className="transition-colors hover:border-primary/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <p className="font-medium">{b.category.name}</p>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDeleteId(b.id)}><Trash2 className="h-3.5 w-3.5 text-muted-foreground" /></Button>
                  </div>
                  <Progress value={Math.min(b.percentage, 100)} indicatorClassName={getColor(b.percentage)} className="mb-3" />
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">{formatCurrency(b.spent)} / {formatCurrency(b.amount)}</p>
                    <p className={`text-sm font-semibold ${b.percentage > 90 ? "text-red-500" : b.percentage > 70 ? "text-yellow-500" : "text-emerald-500"}`}>{b.percentage.toFixed(0)}%</p>
                  </div>
                </CardContent>
              </Card>
            </AnimatedItem>
          ))}
        </div>
      )}

      <ConfirmDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)} onConfirm={remove} />
    </PageWrapper>
  );
}
