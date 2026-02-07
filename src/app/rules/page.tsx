"use client";
import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Wand2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/empty-state";
import { PageWrapper, AnimatedItem } from "@/components/page-wrapper";
import { Skeleton } from "@/components/ui/skeleton";

interface Rule { id: string; pattern: string; categoryId: string | null; accountId: string | null; tagIds: string | null; active: boolean; createdAt: string }
interface Category { id: string; name: string; type: string; color: string }
interface Account { id: string; name: string }

export default function RulesPage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ pattern: "", categoryId: "", accountId: "" });

  useEffect(() => { document.title = "Regras | Ori Financeiro"; }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const [r, c, a] = await Promise.all([
      fetch("/api/rules").then((r) => r.json()),
      fetch("/api/categories").then((r) => r.json()),
      fetch("/api/accounts").then((r) => r.json()),
    ]);
    setRules(r); setCategories(c); setAccounts(a); setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    try {
      if (editId) {
        await fetch(`/api/rules/${editId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
        toast.success("Regra atualizada!");
      } else {
        await fetch("/api/rules", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
        toast.success("Regra criada!");
      }
      setOpen(false); setEditId(null); setForm({ pattern: "", categoryId: "", accountId: "" }); load();
    } catch { toast.error("Erro ao salvar regra"); }
  };

  const toggleActive = async (rule: Rule) => {
    await fetch(`/api/rules/${rule.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...rule, active: !rule.active }) });
    load();
  };

  const remove = async () => {
    if (!deleteId) return;
    await fetch(`/api/rules/${deleteId}`, { method: "DELETE" });
    toast.success("Regra excluída!"); setDeleteId(null); load();
  };

  const editRule = (r: Rule) => {
    setForm({ pattern: r.pattern, categoryId: r.categoryId || "", accountId: r.accountId || "" });
    setEditId(r.id); setOpen(true);
  };

  const getCategoryName = (id: string | null) => categories.find((c) => c.id === id)?.name || "—";
  const getAccountName = (id: string | null) => accounts.find((a) => a.id === id)?.name || "—";

  return (
    <PageWrapper>
      <AnimatedItem>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Regras Automáticas</h1>
            <p className="text-sm text-muted-foreground">Auto-categorize transações por padrões na descrição</p>
          </div>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditId(null); setForm({ pattern: "", categoryId: "", accountId: "" }); } }}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-2" />Nova Regra</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editId ? "Editar Regra" : "Nova Regra"}</DialogTitle><DialogDescription>Defina um padrão para auto-categorizar transações</DialogDescription></DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>Padrão (texto para match)</Label>
                  <Input placeholder="ex: PIX, UBER, Netflix" value={form.pattern} onChange={(e) => setForm({ ...form, pattern: e.target.value })} />
                  <p className="text-xs text-muted-foreground">Se a descrição da transação contiver este texto, a regra será aplicada</p>
                </div>
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select value={form.categoryId} onValueChange={(v) => setForm({ ...form, categoryId: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>{categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Conta (opcional)</Label>
                  <Select value={form.accountId} onValueChange={(v) => setForm({ ...form, accountId: v })}>
                    <SelectTrigger><SelectValue placeholder="Nenhuma" /></SelectTrigger>
                    <SelectContent>{accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <Button onClick={submit} className="w-full" disabled={!form.pattern}>Salvar</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </AnimatedItem>

      <AnimatedItem>
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Regras Cadastradas</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : rules.length === 0 ? (
              <EmptyState icon={Wand2} title="Nenhuma regra" description="Crie regras para auto-categorizar suas transações" actionLabel="Nova Regra" onAction={() => setOpen(true)} />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Padrão</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Conta</TableHead>
                    <TableHead>Ativa</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rules.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell><Badge variant="secondary" className="font-mono">{r.pattern}</Badge></TableCell>
                      <TableCell>{getCategoryName(r.categoryId)}</TableCell>
                      <TableCell>{getAccountName(r.accountId)}</TableCell>
                      <TableCell><Switch checked={r.active} onCheckedChange={() => toggleActive(r)} /></TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => editRule(r)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteId(r.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </AnimatedItem>

      <ConfirmDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)} onConfirm={remove} title="Excluir Regra" description="Tem certeza que deseja excluir esta regra?" />
    </PageWrapper>
  );
}
