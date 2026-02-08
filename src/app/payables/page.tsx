"use client";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PageWrapper, AnimatedItem } from "@/components/page-wrapper";
import { Plus, Trash2, Edit2, CheckCircle, Receipt } from "lucide-react";
import { toast } from "sonner";

interface Payable {
  id: string; description: string; amount: number; type: string; dueDate: string;
  paid: boolean; paidDate: string | null; accountId: string | null; categoryId: string | null; contactName: string | null;
}
interface Account { id: string; name: string; }
interface Category { id: string; name: string; type: string; }

const emptyForm = { description: "", amount: "", type: "payable", dueDate: "", accountId: "", categoryId: "", contactName: "" };

export default function PayablesPage() {
  const [payables, setPayables] = useState<Payable[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filter, setFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [payDialog, setPayDialog] = useState<string | null>(null);
  const [payAccountId, setPayAccountId] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const load = () => {
    const q = filter !== "all" ? `?filter=${filter}` : "";
    fetch(`/api/payables${q}`).then(r => r.json()).then(setPayables);
    fetch("/api/accounts").then(r => r.json()).then(setAccounts);
    fetch("/api/categories").then(r => r.json()).then(setCategories);
  };
  useEffect(() => { load(); }, [filter]);

  const save = async () => {
    const url = editId ? `/api/payables/${editId}` : "/api/payables";
    const method = editId ? "PUT" : "POST";
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setOpen(false); setEditId(null); setForm(emptyForm); load();
    toast.success(editId ? "Atualizado" : "Criado");
  };

  const remove = async (id: string) => { await fetch(`/api/payables/${id}`, { method: "DELETE" }); load(); toast.success("Removido"); };

  const markPaid = async (id: string) => {
    await fetch(`/api/payables/${id}/pay`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ accountId: payAccountId }) });
    setPayDialog(null); setPayAccountId(""); load();
    toast.success("Marcado como pago e transação criada!");
  };

  const edit = (p: Payable) => {
    setEditId(p.id);
    setForm({ description: p.description, amount: String(p.amount), type: p.type, dueDate: p.dueDate.slice(0, 10), accountId: p.accountId || "", categoryId: p.categoryId || "", contactName: p.contactName || "" });
    setOpen(true);
  };

  const getStatus = (p: Payable) => {
    if (p.paid) return { label: "Pago", variant: "success" as const };
    const due = new Date(p.dueDate); due.setHours(0, 0, 0, 0);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (due.getTime() < today.getTime()) return { label: "Vencido", variant: "danger" as const };
    if (due.getTime() === today.getTime()) return { label: "Hoje", variant: "warning" as const };
    return { label: "Futuro", variant: "default" as const };
  };

  return (
    <PageWrapper>
      <AnimatedItem>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2"><Receipt className="h-6 w-6" />Contas a Pagar/Receber</h1>
            <p className="text-sm text-muted-foreground">Gerencie suas obrigações financeiras</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="upcoming">A vencer</SelectItem>
                <SelectItem value="overdue">Vencidas</SelectItem>
                <SelectItem value="paid">Pagas</SelectItem>
              </SelectContent>
            </Select>
            <Dialog open={open} onOpenChange={o => { setOpen(o); if (!o) { setEditId(null); setForm(emptyForm); } }}>
              <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-2" />Nova Conta</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>{editId ? "Editar" : "Nova"} Conta</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>Descrição</Label><Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Valor</Label><Input type="number" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} /></div>
                    <div><Label>Tipo</Label>
                      <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="payable">A Pagar</SelectItem><SelectItem value="receivable">A Receber</SelectItem></SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div><Label>Vencimento</Label><Input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} /></div>
                  <div><Label>Conta</Label>
                    <Select value={form.accountId} onValueChange={v => setForm({ ...form, accountId: v })}>
                      <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
                      <SelectContent>{accounts.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Categoria</Label>
                    <Select value={form.categoryId} onValueChange={v => setForm({ ...form, categoryId: v })}>
                      <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
                      <SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Contato</Label><Input value={form.contactName} onChange={e => setForm({ ...form, contactName: e.target.value })} placeholder="Opcional" /></div>
                  <Button onClick={save} className="w-full">Salvar</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </AnimatedItem>
      <AnimatedItem><Separator /></AnimatedItem>

      <AnimatedItem>
        <Card><CardContent className="p-0">
          <div className="overflow-x-auto"><Table>
            <TableHeader><TableRow>
              <TableHead>Descrição</TableHead><TableHead>Tipo</TableHead><TableHead>Vencimento</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Valor</TableHead><TableHead className="w-28"></TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {payables.map(p => {
                const status = getStatus(p);
                return (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div><p className="text-sm font-medium">{p.description}</p>{p.contactName && <p className="text-xs text-muted-foreground">{p.contactName}</p>}</div>
                    </TableCell>
                    <TableCell><Badge variant="secondary">{p.type === "payable" ? "Pagar" : "Receber"}</Badge></TableCell>
                    <TableCell className="text-sm">{formatDate(p.dueDate)}</TableCell>
                    <TableCell>
                      <Badge variant={status.variant === "danger" ? "destructive" : status.variant === "warning" ? "outline" : status.variant === "success" ? "secondary" : "default"}
                        className={status.variant === "warning" ? "border-amber-500 text-amber-500" : status.variant === "success" ? "bg-emerald-500/10 text-emerald-500" : status.variant === "danger" ? "" : "bg-blue-500/10 text-blue-500"}>
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell className={`text-right font-semibold ${p.type === "receivable" ? "text-emerald-500" : "text-red-500"}`}>{formatCurrency(p.amount)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {!p.paid && (
                          <Button variant="ghost" size="sm" onClick={() => setPayDialog(p.id)} title="Marcar como pago"><CheckCircle className="h-3.5 w-3.5 text-emerald-500" /></Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => edit(p)}><Edit2 className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => remove(p.id)}><Trash2 className="h-3.5 w-3.5 text-red-500" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {payables.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhuma conta encontrada</TableCell></TableRow>}
            </TableBody>
          </Table></div>
        </CardContent></Card>
      </AnimatedItem>

      {/* Pay dialog */}
      <Dialog open={payDialog !== null} onOpenChange={() => setPayDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Marcar como Pago</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Conta para lançamento</Label>
              <Select value={payAccountId} onValueChange={setPayAccountId}>
                <SelectTrigger><SelectValue placeholder="Selecione a conta" /></SelectTrigger>
                <SelectContent>{accounts.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Button onClick={() => payDialog && markPaid(payDialog)} className="w-full">Confirmar Pagamento</Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}
