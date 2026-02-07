"use client";
import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";
import { Plus, Trash2, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/empty-state";
import { PageWrapper, AnimatedItem } from "@/components/page-wrapper";
import { TableSkeleton } from "@/components/dashboard-skeleton";

interface Account { id: string; name: string }
interface Category { id: string; name: string; type: string }
interface Installment { id: string; description: string; totalAmount: number; installments: number; paidInstallments: number; amountPerInstallment: number; account: Account; category: { name: string }; startDate: string }

export default function InstallmentsPage() {
  const [items, setItems] = useState<Installment[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ description: "", totalAmount: "", installments: "", accountId: "", categoryId: "", startDate: new Date().toISOString().split("T")[0] });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => { document.title = "Parcelas | Ori Financeiro"; }, []);

  const load = useCallback(() => { setLoading(true); fetch("/api/installments").then((r) => r.json()).then((d) => { setItems(d); setLoading(false); }); }, []);
  useEffect(() => { load(); fetch("/api/accounts").then((r) => r.json()).then(setAccounts); fetch("/api/categories").then((r) => r.json()).then(setCategories); }, [load]);

  const submit = async () => {
    try {
      await fetch("/api/installments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      setOpen(false); setForm({ description: "", totalAmount: "", installments: "", accountId: "", categoryId: "", startDate: new Date().toISOString().split("T")[0] });
      toast.success("Parcela criada!"); load();
    } catch { toast.error("Erro ao criar parcela"); }
  };

  const remove = async () => {
    if (!deleteId) return;
    try {
      await fetch(`/api/installments/${deleteId}`, { method: "DELETE" });
      toast.success("Parcela excluída!"); setDeleteId(null); load();
    } catch { toast.error("Erro ao excluir"); }
  };

  const pay = async (id: string) => {
    try {
      await fetch(`/api/installments/${id}/pay`, { method: "POST" });
      toast.success("Parcela paga!"); load();
    } catch { toast.error("Erro ao pagar parcela"); }
  };

  const expenseCats = categories.filter((c) => c.type === "expense");

  return (
    <PageWrapper>
      <AnimatedItem>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Parcelas</h1>
            <p className="text-sm text-muted-foreground">Controle de compras parceladas</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-2" />Nova Parcela</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nova Parcela</DialogTitle><DialogDescription>Registre uma compra parcelada</DialogDescription></DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2"><Label>Descrição</Label><Input placeholder="Descrição" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
                <div className="space-y-2"><Label>Valor total</Label><Input type="number" placeholder="0.00" value={form.totalAmount} onChange={(e) => setForm({ ...form, totalAmount: e.target.value })} /></div>
                <div className="space-y-2"><Label>Nº de parcelas</Label><Input type="number" placeholder="12" value={form.installments} onChange={(e) => setForm({ ...form, installments: e.target.value })} /></div>
                <div className="space-y-2"><Label>Data início</Label><Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></div>
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
                    <SelectContent>{expenseCats.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <Button onClick={submit} className="w-full" disabled={!form.description || !form.totalAmount || !form.installments || !form.accountId || !form.categoryId}>Salvar</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </AnimatedItem>
      <AnimatedItem><Separator /></AnimatedItem>

      <AnimatedItem>
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Lista de Parcelas</CardTitle></CardHeader>
          <CardContent>
            {loading ? <TableSkeleton rows={3} cols={6} /> : items.length === 0 ? (
              <EmptyState icon={CreditCard} title="Nenhuma parcela" description="Registre suas compras parceladas para acompanhamento" actionLabel="Nova Parcela" onAction={() => setOpen(true)} />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-border/50 hover:bg-transparent">
                      <TableHead className="text-xs text-muted-foreground font-medium">Descrição</TableHead>
                      <TableHead className="text-xs text-muted-foreground font-medium">Categoria</TableHead>
                      <TableHead className="text-xs text-muted-foreground font-medium">Conta</TableHead>
                      <TableHead className="text-xs text-muted-foreground font-medium">Parcela</TableHead>
                      <TableHead className="text-xs text-muted-foreground font-medium">Progresso</TableHead>
                      <TableHead className="text-xs text-muted-foreground font-medium text-right">Valor/parcela</TableHead>
                      <TableHead className="w-24" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => {
                      const pct = (item.paidInstallments / item.installments) * 100;
                      const done = item.paidInstallments >= item.installments;
                      return (
                        <TableRow key={item.id} className="border-b border-border/50 hover:bg-muted/50">
                          <TableCell className="text-sm font-medium">{item.description}</TableCell>
                          <TableCell><Badge variant="secondary" className="text-xs">{item.category.name}</Badge></TableCell>
                          <TableCell className="text-sm text-muted-foreground">{item.account.name}</TableCell>
                          <TableCell><Badge variant={done ? "success" : "secondary"} className="text-xs">{item.paidInstallments}/{item.installments}</Badge></TableCell>
                          <TableCell className="min-w-[120px]"><Progress value={pct} indicatorClassName={done ? "bg-emerald-500" : "bg-[hsl(256,77%,60%)]"} /></TableCell>
                          <TableCell className="text-sm font-semibold text-right">{formatCurrency(item.amountPerInstallment)}</TableCell>
                          <TableCell>
                            <div className="flex gap-1 justify-end">
                              {!done && <Button variant="outline" size="sm" onClick={() => pay(item.id)}><CreditCard className="h-3.5 w-3.5 mr-1" />Pagar</Button>}
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteId(item.id)}><Trash2 className="h-4 w-4 text-muted-foreground" /></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
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
