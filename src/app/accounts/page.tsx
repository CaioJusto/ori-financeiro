"use client";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";
import { Plus, Trash2, Wallet, Star } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/empty-state";
import { PageWrapper, AnimatedItem } from "@/components/page-wrapper";
import { CardsSkeleton } from "@/components/dashboard-skeleton";

interface Account { id: string; name: string; type: string; color: string; currency: string; favorite: boolean; balance: number }

const typeLabels: Record<string, string> = { personal: "Pessoal", business: "Empresarial", savings: "Poupança", investment: "Investimento" };

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", type: "personal", color: "#3b82f6", currency: "BRL" });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => { document.title = "Contas | Ori Financeiro"; }, []);

  const load = () => { setLoading(true); fetch("/api/accounts").then((r) => r.json()).then((d) => { setAccounts(d); setLoading(false); }); };
  useEffect(() => { load(); }, []);

  const submit = async () => {
    try {
      await fetch("/api/accounts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      setOpen(false); setForm({ name: "", type: "personal", color: "#3b82f6", currency: "BRL" });
      toast.success("Conta criada com sucesso!"); load();
    } catch { toast.error("Erro ao criar conta"); }
  };

  const remove = async () => {
    if (!deleteId) return;
    try {
      await fetch(`/api/accounts/${deleteId}`, { method: "DELETE" });
      toast.success("Conta excluída!"); setDeleteId(null); load();
    } catch { toast.error("Erro ao excluir conta"); }
  };

  return (
    <PageWrapper>
      <AnimatedItem>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Contas</h1>
            <p className="text-sm text-muted-foreground">Gerencie suas contas financeiras</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-2" />Nova Conta</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nova Conta</DialogTitle><DialogDescription>Crie uma nova conta financeira</DialogDescription></DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2"><Label>Nome</Label><Input placeholder="Nome da conta" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="personal">Pessoal</SelectItem><SelectItem value="business">Empresarial</SelectItem><SelectItem value="savings">Poupança</SelectItem><SelectItem value="investment">Investimento</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Moeda</Label>
                  <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BRL">BRL (R$)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Cor</Label>
                  <div className="flex items-center gap-3">
                    <input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="w-10 h-10 rounded cursor-pointer border-0" />
                    <span className="text-sm text-muted-foreground">{form.color}</span>
                  </div>
                </div>
                <Button onClick={submit} className="w-full" disabled={!form.name}>Criar Conta</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </AnimatedItem>
      <AnimatedItem><Separator /></AnimatedItem>

      {loading ? <CardsSkeleton /> : accounts.length === 0 ? (
        <EmptyState icon={Wallet} title="Nenhuma conta" description="Crie sua primeira conta para começar a gerenciar suas finanças" actionLabel="Nova Conta" onAction={() => setOpen(true)} />
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((a) => (
            <AnimatedItem key={a.id}>
              <Card className="transition-colors hover:border-primary/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: a.color }} />
                      <p className="font-medium">{a.name}</p>
                    </div>
                    <div className="flex items-center gap-0.5">
                      <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={a.favorite ? "Remover dos favoritos" : "Adicionar aos favoritos"} onClick={() => {
                        fetch("/api/favorites", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "account", id: a.id, favorite: !a.favorite }) }).then(() => load());
                      }}>
                        <Star className={`h-4 w-4 ${a.favorite ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Excluir conta" onClick={() => setDeleteId(a.id)}>
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="secondary" className="text-xs">{typeLabels[a.type] || a.type}</Badge>
                    <Badge variant="outline" className="text-xs">{a.currency || "BRL"}</Badge>
                  </div>
                  <p className={`text-xl font-bold ${a.balance >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>{formatCurrency(a.balance, a.currency || "BRL")}</p>
                </CardContent>
              </Card>
            </AnimatedItem>
          ))}
        </div>
      )}

      <ConfirmDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)} onConfirm={remove} title="Excluir conta?" description="Todas as transações associadas serão excluídas. Esta ação não pode ser desfeita." />
    </PageWrapper>
  );
}
