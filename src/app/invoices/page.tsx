"use client";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PageWrapper, AnimatedItem } from "@/components/page-wrapper";
import { Plus, Trash2, Eye, CheckCircle, FileText, Pencil } from "lucide-react";
import { toast } from "sonner";

interface Invoice {
  id: string; number: string; clientName: string; clientEmail: string; items: InvoiceItem[];
  subtotal: number; tax: number; total: number; status: string; dueDate: string; paidDate: string | null; notes: string | null; createdAt: string;
}
interface InvoiceItem { description: string; quantity: number; price: number; }

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-500", SENT: "bg-blue-500", PAID: "bg-green-500", OVERDUE: "bg-red-500", CANCELLED: "bg-yellow-600",
};
const statusLabels: Record<string, string> = {
  DRAFT: "Rascunho", SENT: "Enviada", PAID: "Paga", OVERDUE: "Vencida", CANCELLED: "Cancelada",
};

const emptyItem = { description: "", quantity: 1, price: 0 };
const emptyForm = { clientName: "", clientEmail: "", dueDate: "", notes: "", tax: "0", status: "DRAFT" };

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filter, setFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [items, setItems] = useState<InvoiceItem[]>([{ ...emptyItem }]);
  const [payDialog, setPayDialog] = useState<string | null>(null);
  const [payForm, setPayForm] = useState({ accountId: "", categoryId: "" });
  const [accounts, setAccounts] = useState<{ id: string; name: string }[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string; type: string }[]>([]);
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);

  const load = () => {
    const q = filter !== "all" ? `?status=${filter}` : "";
    fetch(`/api/invoices${q}`).then(r => r.json()).then(setInvoices);
  };
  useEffect(() => { load(); fetch("/api/accounts").then(r => r.json()).then(setAccounts); fetch("/api/categories").then(r => r.json()).then(setCategories); }, [filter]);

  const save = async () => {
    const url = editId ? `/api/invoices/${editId}` : "/api/invoices";
    const method = editId ? "PUT" : "POST";
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, items }) });
    setOpen(false); setEditId(null); setForm(emptyForm); setItems([{ ...emptyItem }]); load();
    toast.success(editId ? "Fatura atualizada" : "Fatura criada");
  };

  const del = async (id: string) => {
    await fetch(`/api/invoices/${id}`, { method: "DELETE" }); load(); toast.success("Excluída");
  };

  const markPaid = async () => {
    if (!payDialog) return;
    await fetch(`/api/invoices/${payDialog}/pay`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payForm) });
    setPayDialog(null); setPayForm({ accountId: "", categoryId: "" }); load(); toast.success("Fatura marcada como paga");
  };

  const openEdit = (inv: Invoice) => {
    setEditId(inv.id); setForm({ clientName: inv.clientName, clientEmail: inv.clientEmail, dueDate: inv.dueDate.slice(0, 10), notes: inv.notes || "", tax: String(inv.tax), status: inv.status });
    setItems(inv.items.length ? inv.items : [{ ...emptyItem }]); setOpen(true);
  };

  const subtotal = items.reduce((s, i) => s + i.quantity * i.price, 0);
  const total = subtotal + parseFloat(form.tax || "0");

  return (
    <PageWrapper>
      <AnimatedItem>
        <div className="flex flex-wrap gap-3 mb-6 items-center">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="DRAFT">Rascunho</SelectItem>
              <SelectItem value="SENT">Enviadas</SelectItem>
              <SelectItem value="PAID">Pagas</SelectItem>
              <SelectItem value="OVERDUE">Vencidas</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setEditId(null); setForm(emptyForm); setItems([{ ...emptyItem }]); } }}>
            <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Nova Fatura</Button></DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>{editId ? "Editar Fatura" : "Nova Fatura"}</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Cliente</Label><Input value={form.clientName} onChange={e => setForm({ ...form, clientName: e.target.value })} /></div>
                  <div><Label>Email</Label><Input value={form.clientEmail} onChange={e => setForm({ ...form, clientEmail: e.target.value })} /></div>
                  <div><Label>Vencimento</Label><Input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} /></div>
                  <div><Label>Status</Label>
                    <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{["DRAFT","SENT","PAID","OVERDUE","CANCELLED"].map(s => <SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Itens</Label>
                  {items.map((item, idx) => (
                    <div key={idx} className="flex gap-2 mt-2">
                      <Input placeholder="Descrição" value={item.description} onChange={e => { const n = [...items]; n[idx] = { ...n[idx], description: e.target.value }; setItems(n); }} className="flex-1" />
                      <Input type="number" placeholder="Qtd" value={item.quantity} onChange={e => { const n = [...items]; n[idx] = { ...n[idx], quantity: Number(e.target.value) }; setItems(n); }} className="w-20" />
                      <Input type="number" placeholder="Preço" value={item.price} onChange={e => { const n = [...items]; n[idx] = { ...n[idx], price: Number(e.target.value) }; setItems(n); }} className="w-28" />
                      <Button variant="ghost" size="sm" onClick={() => setItems(items.filter((_, i) => i !== idx))}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" className="mt-2" onClick={() => setItems([...items, { ...emptyItem }])}>+ Item</Button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Impostos (R$)</Label><Input type="number" value={form.tax} onChange={e => setForm({ ...form, tax: e.target.value })} /></div>
                  <div><Label>Notas</Label><Input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
                </div>
                <div className="text-right text-sm text-muted-foreground">Subtotal: {formatCurrency(subtotal)} | Total: {formatCurrency(total)}</div>
                <Button onClick={save} className="w-full">Salvar</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </AnimatedItem>

      <AnimatedItem>
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto"><Table>
              <TableHeader><TableRow>
                <TableHead>Nº</TableHead><TableHead>Cliente</TableHead><TableHead>Total</TableHead>
                <TableHead>Status</TableHead><TableHead>Vencimento</TableHead><TableHead>Ações</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {invoices.map(inv => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-mono">{inv.number}</TableCell>
                    <TableCell>{inv.clientName}</TableCell>
                    <TableCell>{formatCurrency(inv.total)}</TableCell>
                    <TableCell><Badge className={`${statusColors[inv.status]} text-white`}>{statusLabels[inv.status]}</Badge></TableCell>
                    <TableCell>{formatDate(inv.dueDate)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setViewInvoice(inv)}><Eye className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => openEdit(inv)}><Pencil className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => window.open(`/api/invoices/${inv.id}/pdf`, "_blank")}><FileText className="w-4 h-4" /></Button>
                        {inv.status !== "PAID" && <Button variant="ghost" size="sm" onClick={() => setPayDialog(inv.id)}><CheckCircle className="w-4 h-4 text-green-500" /></Button>}
                        <Button variant="ghost" size="sm" onClick={() => del(inv.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {invoices.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhuma fatura encontrada</TableCell></TableRow>}
              </TableBody>
            </Table></div>
          </CardContent>
        </Card>
      </AnimatedItem>

      {/* View dialog */}
      <Dialog open={!!viewInvoice} onOpenChange={() => setViewInvoice(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Fatura {viewInvoice?.number}</DialogTitle></DialogHeader>
          {viewInvoice && (
            <div className="space-y-3">
              <p><strong>Cliente:</strong> {viewInvoice.clientName}</p>
              {viewInvoice.clientEmail && <p><strong>Email:</strong> {viewInvoice.clientEmail}</p>}
              <p><strong>Status:</strong> <Badge className={`${statusColors[viewInvoice.status]} text-white`}>{statusLabels[viewInvoice.status]}</Badge></p>
              <p><strong>Vencimento:</strong> {formatDate(viewInvoice.dueDate)}</p>
              {viewInvoice.paidDate && <p><strong>Pago em:</strong> {formatDate(viewInvoice.paidDate)}</p>}
              <div className="border rounded p-3">
                <p className="font-semibold mb-2">Itens:</p>
                {viewInvoice.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span>{item.description} x{item.quantity}</span>
                    <span>{formatCurrency(item.quantity * item.price)}</span>
                  </div>
                ))}
                <div className="border-t mt-2 pt-2 text-sm">
                  <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(viewInvoice.subtotal)}</span></div>
                  <div className="flex justify-between"><span>Impostos</span><span>{formatCurrency(viewInvoice.tax)}</span></div>
                  <div className="flex justify-between font-bold"><span>Total</span><span>{formatCurrency(viewInvoice.total)}</span></div>
                </div>
              </div>
              {viewInvoice.notes && <p className="text-sm text-muted-foreground">{viewInvoice.notes}</p>}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Pay dialog */}
      <Dialog open={!!payDialog} onOpenChange={() => setPayDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Marcar como Paga</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Conta (para lançar receita)</Label>
              <Select value={payForm.accountId} onValueChange={v => setPayForm({ ...payForm, accountId: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione (opcional)" /></SelectTrigger>
                <SelectContent>{accounts.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Categoria</Label>
              <Select value={payForm.categoryId} onValueChange={v => setPayForm({ ...payForm, categoryId: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione (opcional)" /></SelectTrigger>
                <SelectContent>{categories.filter(c => c.type === "income").map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Button onClick={markPaid} className="w-full">Confirmar Pagamento</Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}
