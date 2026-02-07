"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { PageWrapper, AnimatedItem } from "@/components/page-wrapper";
import { Plus, Trash2, Edit2, ClipboardList } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { toast } from "sonner";

interface Category { id: string; name: string; type: string; color: string; }
interface Planning { id: string; month: string; categoryId: string; plannedAmount: number; category: Category; }
interface Transaction { amount: number; type: string; categoryId: string; }

export default function PlanningPage() {
  const [plannings, setPlannings] = useState<Planning[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ categoryId: "", plannedAmount: "" });

  const load = () => {
    fetch(`/api/planning?month=${month}`).then(r => r.json()).then(setPlannings);
    fetch("/api/categories").then(r => r.json()).then(setCategories);
    const from = `${month}-01`;
    const lastDay = new Date(parseInt(month.split("-")[0]), parseInt(month.split("-")[1]), 0).getDate();
    const to = `${month}-${String(lastDay).padStart(2, "0")}`;
    fetch(`/api/transactions?from=${from}&to=${to}`).then(r => r.json()).then(setTransactions);
  };

  useEffect(() => { load(); }, [month]);

  const save = async () => {
    const url = editId ? `/api/planning/${editId}` : "/api/planning";
    const method = editId ? "PUT" : "POST";
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, month }) });
    setOpen(false); setEditId(null); setForm({ categoryId: "", plannedAmount: "" });
    load(); toast.success(editId ? "Plano atualizado" : "Plano criado");
  };

  const remove = async (id: string) => {
    await fetch(`/api/planning/${id}`, { method: "DELETE" });
    load(); toast.success("Removido");
  };

  const edit = (p: Planning) => {
    setEditId(p.id); setForm({ categoryId: p.categoryId, plannedAmount: String(p.plannedAmount) }); setOpen(true);
  };

  // Compute realized per category
  const realizedMap = new Map<string, number>();
  transactions.forEach(t => {
    const key = t.categoryId;
    realizedMap.set(key, (realizedMap.get(key) || 0) + t.amount);
  });

  const totalPlanned = plannings.reduce((s, p) => s + p.plannedAmount, 0);
  const totalRealized = plannings.reduce((s, p) => s + (realizedMap.get(p.categoryId) || 0), 0);
  const diff = totalPlanned - totalRealized;

  const chartData = plannings.map(p => ({
    name: p.category.name,
    Planejado: p.plannedAmount,
    Realizado: realizedMap.get(p.categoryId) || 0,
  }));

  return (
    <PageWrapper>
      <AnimatedItem>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2"><ClipboardList className="h-6 w-6" />Planejamento Financeiro</h1>
            <p className="text-sm text-muted-foreground">Compare o planejado vs realizado por mês</p>
          </div>
          <div className="flex items-center gap-3">
            <Input type="month" value={month} onChange={e => setMonth(e.target.value)} className="w-40" />
            <Dialog open={open} onOpenChange={o => { setOpen(o); if (!o) { setEditId(null); setForm({ categoryId: "", plannedAmount: "" }); } }}>
              <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-2" />Novo Plano</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>{editId ? "Editar" : "Novo"} Plano</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div><Label>Categoria</Label>
                    <Select value={form.categoryId} onValueChange={v => setForm({ ...form, categoryId: v })}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Valor Planejado</Label><Input type="number" step="0.01" value={form.plannedAmount} onChange={e => setForm({ ...form, plannedAmount: e.target.value })} /></div>
                  <Button onClick={save} className="w-full">Salvar</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </AnimatedItem>
      <AnimatedItem><Separator /></AnimatedItem>

      {/* Summary cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <AnimatedItem><Card><CardContent className="p-6"><p className="text-sm text-muted-foreground">Planejado</p><p className="text-2xl font-bold mt-1">{formatCurrency(totalPlanned)}</p></CardContent></Card></AnimatedItem>
        <AnimatedItem><Card><CardContent className="p-6"><p className="text-sm text-muted-foreground">Realizado</p><p className="text-2xl font-bold mt-1">{formatCurrency(totalRealized)}</p></CardContent></Card></AnimatedItem>
        <AnimatedItem><Card><CardContent className="p-6"><p className="text-sm text-muted-foreground">Diferença</p><p className={`text-2xl font-bold mt-1 ${diff >= 0 ? "text-emerald-500" : "text-red-500"}`}>{formatCurrency(diff)}</p></CardContent></Card></AnimatedItem>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <AnimatedItem>
          <Card><CardHeader><CardTitle className="text-sm font-medium">Planejado vs Realizado por Categoria</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.1} />
                  <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Planejado" fill="hsl(256, 77%, 60%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Realizado" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </AnimatedItem>
      )}

      {/* Table */}
      <AnimatedItem>
        <Card><CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Categoria</TableHead><TableHead className="text-right">Planejado</TableHead><TableHead className="text-right">Realizado</TableHead><TableHead className="text-right">Diferença</TableHead><TableHead className="w-20"></TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {plannings.map(p => {
                const realized = realizedMap.get(p.categoryId) || 0;
                const d = p.plannedAmount - realized;
                return (
                  <TableRow key={p.id}>
                    <TableCell><Badge variant="secondary">{p.category.name}</Badge></TableCell>
                    <TableCell className="text-right">{formatCurrency(p.plannedAmount)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(realized)}</TableCell>
                    <TableCell className={`text-right font-medium ${d >= 0 ? "text-emerald-500" : "text-red-500"}`}>{formatCurrency(d)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => edit(p)}><Edit2 className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => remove(p.id)}><Trash2 className="h-3.5 w-3.5 text-red-500" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {plannings.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhum plano para este mês</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent></Card>
      </AnimatedItem>
    </PageWrapper>
  );
}
