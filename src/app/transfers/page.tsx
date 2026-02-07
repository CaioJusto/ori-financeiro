"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Plus, ArrowRight, ArrowRightLeft } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/empty-state";
import { PageWrapper, AnimatedItem } from "@/components/page-wrapper";
import { TableSkeleton } from "@/components/dashboard-skeleton";

interface Transfer { id: string; amount: number; description: string; date: string; fromAccount: { name: string }; toAccount: { name: string } }
interface Account { id: string; name: string }

export default function TransfersPage() {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ amount: "", description: "Transferência", fromAccountId: "", toAccountId: "", date: new Date().toISOString().split("T")[0] });

  useEffect(() => { document.title = "Transferências | Ori Financeiro"; }, []);

  const load = () => { setLoading(true); fetch("/api/transfers").then((r) => r.json()).then((d) => { setTransfers(d); setLoading(false); }); };
  useEffect(() => { load(); fetch("/api/accounts").then((r) => r.json()).then(setAccounts); }, []);

  const submit = async () => {
    try {
      await fetch("/api/transfers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      setOpen(false); setForm({ amount: "", description: "Transferência", fromAccountId: "", toAccountId: "", date: new Date().toISOString().split("T")[0] });
      toast.success("Transferência realizada!"); load();
    } catch { toast.error("Erro ao transferir"); }
  };

  return (
    <PageWrapper>
      <AnimatedItem>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Transferências</h1>
            <p className="text-sm text-muted-foreground">Movimente dinheiro entre contas</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-2" />Nova Transferência</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nova Transferência</DialogTitle><DialogDescription>Transfira entre suas contas</DialogDescription></DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2"><Label>Valor</Label><Input type="number" placeholder="0.00" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
                <div className="space-y-2"><Label>Descrição</Label><Input placeholder="Descrição" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
                <div className="space-y-2">
                  <Label>Conta de origem</Label>
                  <Select value={form.fromAccountId} onValueChange={(v) => setForm({ ...form, fromAccountId: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Conta de destino</Label>
                  <Select value={form.toAccountId} onValueChange={(v) => setForm({ ...form, toAccountId: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{accounts.filter((a) => a.id !== form.fromAccountId).map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Data</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
                <Button onClick={submit} className="w-full" disabled={!form.amount || !form.fromAccountId || !form.toAccountId}>Transferir</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </AnimatedItem>

      <AnimatedItem>
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Histórico</CardTitle></CardHeader>
          <CardContent>
            {loading ? <TableSkeleton rows={3} cols={5} /> : transfers.length === 0 ? (
              <EmptyState icon={ArrowRightLeft} title="Nenhuma transferência" description="Movimente dinheiro entre suas contas" actionLabel="Nova Transferência" onAction={() => setOpen(true)} />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow><TableHead>Origem</TableHead><TableHead /><TableHead>Destino</TableHead><TableHead>Data</TableHead><TableHead className="text-right">Valor</TableHead></TableRow>
                  </TableHeader>
                  <TableBody>
                    {transfers.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="font-medium">{t.fromAccount.name}</TableCell>
                        <TableCell><ArrowRight className="h-4 w-4 text-muted-foreground" /></TableCell>
                        <TableCell className="font-medium">{t.toAccount.name}</TableCell>
                        <TableCell className="text-muted-foreground">{formatDate(t.date)}</TableCell>
                        <TableCell className="text-right"><Badge variant="secondary">{formatCurrency(t.amount)}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </AnimatedItem>
    </PageWrapper>
  );
}
