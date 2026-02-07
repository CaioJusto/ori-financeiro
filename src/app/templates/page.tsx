"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageWrapper, AnimatedItem } from "@/components/page-wrapper";
import { formatCurrency } from "@/lib/utils";
import { Plus, Play, Trash2, FileText } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface Template {
  id: string;
  name: string;
  description: string;
  amount: number;
  type: string;
  categoryId: string;
  accountId: string;
}

interface Category { id: string; name: string; type: string }
interface Account { id: string; name: string }

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", amount: "", type: "expense", categoryId: "", accountId: "" });

  const load = () => {
    fetch("/api/templates").then(r => r.json()).then(setTemplates);
    fetch("/api/categories").then(r => r.json()).then(setCategories);
    fetch("/api/accounts").then(r => r.json()).then(setAccounts);
  };

  useEffect(() => { document.title = "Templates | Ori Financeiro"; load(); }, []);

  const create = async () => {
    if (!form.name || !form.categoryId || !form.accountId) return;
    await fetch("/api/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }),
    });
    setShowNew(false);
    setForm({ name: "", description: "", amount: "", type: "expense", categoryId: "", accountId: "" });
    load();
    toast.success("Template criado!");
  };

  const useTemplate = async (t: Template) => {
    await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description: t.description, amount: t.amount, type: t.type, categoryId: t.categoryId, accountId: t.accountId, date: new Date().toISOString() }),
    });
    toast.success("Transação criada a partir do template!");
  };

  const remove = async (id: string) => {
    await fetch(`/api/templates/${id}`, { method: "DELETE" });
    load();
  };

  const filteredCategories = categories.filter(c => c.type === form.type);

  return (
    <PageWrapper>
      <AnimatedItem>
        <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2"><FileText className="h-6 w-6" /> Templates de Transação</h1>
            <p className="text-sm text-muted-foreground">Crie transações rapidamente a partir de modelos</p>
          </div>
          <Dialog open={showNew} onOpenChange={setShowNew}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" /> Novo Template</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Novo Template</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Nome</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                <div><Label>Descrição</Label><Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
                <div><Label>Valor</Label><Input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} /></div>
                <div><Label>Tipo</Label>
                  <Select value={form.type} onValueChange={v => setForm({ ...form, type: v, categoryId: "" })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="expense">Despesa</SelectItem><SelectItem value="income">Receita</SelectItem></SelectContent>
                  </Select>
                </div>
                <div><Label>Categoria</Label>
                  <Select value={form.categoryId} onValueChange={v => setForm({ ...form, categoryId: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                    <SelectContent>{filteredCategories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Conta</Label>
                  <Select value={form.accountId} onValueChange={v => setForm({ ...form, accountId: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                    <SelectContent>{accounts.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <Button onClick={create} className="w-full">Criar Template</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </AnimatedItem>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map(t => (
          <AnimatedItem key={t.id}>
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{t.name}</CardTitle>
                  <Badge variant={t.type === "income" ? "default" : "secondary"}>{t.type === "income" ? "Receita" : "Despesa"}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{t.description}</p>
                <p className="text-lg font-bold mt-2">{formatCurrency(t.amount)}</p>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" onClick={() => useTemplate(t)} className="flex-1"><Play className="h-3 w-3 mr-1" /> Usar</Button>
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => remove(t.id)}><Trash2 className="h-3 w-3" /></Button>
                </div>
              </CardContent>
            </Card>
          </AnimatedItem>
        ))}
        {templates.length === 0 && (
          <Card className="col-span-full"><CardContent className="py-12 text-center text-muted-foreground">Nenhum template criado</CardContent></Card>
        )}
      </div>
    </PageWrapper>
  );
}
