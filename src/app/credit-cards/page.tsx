"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Plus, Trash2, CreditCard, Receipt } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/empty-state";
import { PageWrapper, AnimatedItem } from "@/components/page-wrapper";
import { CardsSkeleton } from "@/components/dashboard-skeleton";

interface CreditCardData {
  id: string; name: string; cardLimit: number; closingDay: number; dueDay: number; color: string; used: number; available: number;
}

interface InvoiceData {
  card: { name: string; closingDay: number; dueDay: number };
  period: { start: string; end: string };
  dueDate: string;
  transactions: { id: string; description: string; amount: number; type: string; date: string; category: { name: string } }[];
  total: number;
}

export default function CreditCardsPage() {
  const [cards, setCards] = useState<CreditCardData[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", cardLimit: "", closingDay: "", dueDay: "", color: "#8b5cf6" });
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [invoiceCard, setInvoiceCard] = useState<string | null>(null);
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);

  useEffect(() => { document.title = "Cartões de Crédito | Ori Financeiro"; }, []);

  const load = () => { setLoading(true); fetch("/api/credit-cards").then(r => r.json()).then(d => { setCards(d); setLoading(false); }); };
  useEffect(() => { load(); }, []);

  const loadInvoice = (id: string) => {
    setInvoiceCard(id);
    fetch(`/api/credit-cards/${id}/invoice`).then(r => r.json()).then(setInvoice);
  };

  const submit = async () => {
    try {
      await fetch("/api/credit-cards", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      setOpen(false); setForm({ name: "", cardLimit: "", closingDay: "", dueDay: "", color: "#8b5cf6" });
      toast.success("Cartão criado!"); load();
    } catch { toast.error("Erro ao criar cartão"); }
  };

  const remove = async () => {
    if (!deleteId) return;
    try {
      await fetch(`/api/credit-cards/${deleteId}`, { method: "DELETE" });
      toast.success("Cartão excluído!"); setDeleteId(null); load();
    } catch { toast.error("Erro ao excluir"); }
  };

  return (
    <PageWrapper>
      <AnimatedItem>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Cartões de Crédito</h1>
            <p className="text-sm text-muted-foreground">Gerencie seus cartões e faturas</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-2" />Novo Cartão</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Novo Cartão</DialogTitle><DialogDescription>Adicione um cartão de crédito</DialogDescription></DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2"><Label>Nome</Label><Input placeholder="Ex: Nubank" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                <div className="space-y-2"><Label>Limite</Label><Input type="number" placeholder="5000" value={form.cardLimit} onChange={e => setForm({ ...form, cardLimit: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Dia de Fechamento</Label><Input type="number" min="1" max="31" placeholder="15" value={form.closingDay} onChange={e => setForm({ ...form, closingDay: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Dia de Vencimento</Label><Input type="number" min="1" max="31" placeholder="25" value={form.dueDay} onChange={e => setForm({ ...form, dueDay: e.target.value })} /></div>
                </div>
                <div className="space-y-2">
                  <Label>Cor</Label>
                  <div className="flex items-center gap-3">
                    <input type="color" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} className="w-10 h-10 rounded cursor-pointer border-0" />
                    <span className="text-sm text-muted-foreground">{form.color}</span>
                  </div>
                </div>
                <Button onClick={submit} className="w-full" disabled={!form.name || !form.cardLimit || !form.closingDay || !form.dueDay}>Criar Cartão</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </AnimatedItem>
      <AnimatedItem><Separator /></AnimatedItem>

      {loading ? <CardsSkeleton /> : cards.length === 0 ? (
        <EmptyState icon={CreditCard} title="Nenhum cartão" description="Adicione seu primeiro cartão de crédito" actionLabel="Novo Cartão" onAction={() => setOpen(true)} />
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map(c => (
            <AnimatedItem key={c.id}>
              <Card className="transition-colors hover:border-primary/50 cursor-pointer" onClick={() => loadInvoice(c.id)}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                      <p className="font-medium">{c.name}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={e => { e.stopPropagation(); setDeleteId(c.id); }}>
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Usado</span>
                      <span className="font-medium text-red-500">{formatCurrency(c.used)}</span>
                    </div>
                    <Progress value={c.cardLimit > 0 ? (c.used / c.cardLimit) * 100 : 0} className="h-2" />
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Disponível</span>
                      <span className="font-medium text-emerald-500">{formatCurrency(c.available)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground pt-1">
                      <span>Limite: {formatCurrency(c.cardLimit)}</span>
                      <span>Fecha dia {c.closingDay} · Vence dia {c.dueDay}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </AnimatedItem>
          ))}
        </div>
      )}

      {/* Invoice Dialog */}
      <Dialog open={!!invoiceCard} onOpenChange={o => { if (!o) { setInvoiceCard(null); setInvoice(null); } }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Fatura Atual</DialogTitle>
            <DialogDescription>
              {invoice && `Período: ${formatDate(invoice.period.start)} a ${formatDate(invoice.period.end)} · Vencimento: ${formatDate(invoice.dueDate)}`}
            </DialogDescription>
          </DialogHeader>
          {invoice ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <span className="text-sm text-muted-foreground">Total da Fatura</span>
                <span className="text-xl font-bold text-red-500">{formatCurrency(invoice.total)}</span>
              </div>
              {invoice.transactions.length === 0 ? (
                <EmptyState icon={Receipt} title="Fatura vazia" description="Nenhuma transação neste período" />
              ) : (
                <div className="overflow-x-auto"><Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Descrição</TableHead>
                      <TableHead className="text-xs">Categoria</TableHead>
                      <TableHead className="text-xs">Data</TableHead>
                      <TableHead className="text-xs text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoice.transactions.map(t => (
                      <TableRow key={t.id}>
                        <TableCell className="text-sm">{t.description}</TableCell>
                        <TableCell><Badge variant="secondary" className="text-xs">{t.category.name}</Badge></TableCell>
                        <TableCell className="text-sm text-muted-foreground">{formatDate(t.date)}</TableCell>
                        <TableCell className="text-sm font-medium text-right text-red-500">-{formatCurrency(t.amount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table></div>
              )}
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground text-sm">Carregando fatura...</div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteId} onOpenChange={o => !o && setDeleteId(null)} onConfirm={remove} title="Excluir cartão?" description="As transações associadas perderão a referência ao cartão." />
    </PageWrapper>
  );
}
