"use client";
import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/utils";
import { PageWrapper, AnimatedItem } from "@/components/page-wrapper";
import { Plus, Trash2, Calculator, TrendingDown } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Loan {
  id: string; name: string; type: string; principal: number; interestRate: number;
  monthlyPayment: number; totalPaid: number; remainingBalance: number;
  startDate: string; endDate: string | null; status: string;
}

const LOAN_TYPES = [
  { value: "PERSONAL", label: "Pessoal" }, { value: "MORTGAGE", label: "Hipoteca" },
  { value: "CAR", label: "Veículo" }, { value: "STUDENT", label: "Estudantil" },
  { value: "CREDIT_CARD", label: "Cartão de Crédito" }, { value: "OTHER", label: "Outro" },
];

function generateAmortization(principal: number, rate: number, monthly: number) {
  const schedule = [];
  let balance = principal;
  const monthlyRate = rate / 100 / 12;
  let month = 0;
  while (balance > 0 && month < 360) {
    month++;
    const interest = balance * monthlyRate;
    const principalPart = Math.min(monthly - interest, balance);
    balance -= principalPart;
    schedule.push({ month, payment: monthly, principal: principalPart, interest, balance: Math.max(0, balance) });
    if (monthly <= interest) break;
  }
  return schedule;
}

export default function LoansPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Loan | null>(null);
  const [extraPayment, setExtraPayment] = useState(0);
  const [form, setForm] = useState({ name: "", type: "PERSONAL", principal: "", interestRate: "", monthlyPayment: "", startDate: new Date().toISOString().split("T")[0] });

  const load = useCallback(() => { fetch("/api/loans").then(r => r.json()).then(setLoans); }, []);
  useEffect(() => { load(); }, [load]);

  const handleSubmit = async () => {
    await fetch("/api/loans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, principal: parseFloat(form.principal), interestRate: parseFloat(form.interestRate), monthlyPayment: parseFloat(form.monthlyPayment), remainingBalance: parseFloat(form.principal) }),
    });
    setOpen(false);
    setForm({ name: "", type: "PERSONAL", principal: "", interestRate: "", monthlyPayment: "", startDate: new Date().toISOString().split("T")[0] });
    load();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/loans/${id}`, { method: "DELETE" });
    load();
  };

  const totalDebt = loans.filter(l => l.status === "ACTIVE").reduce((s, l) => s + l.remainingBalance, 0);
  const totalMonthly = loans.filter(l => l.status === "ACTIVE").reduce((s, l) => s + l.monthlyPayment, 0);

  const amortization = selected ? generateAmortization(selected.remainingBalance, selected.interestRate, selected.monthlyPayment) : [];
  const amortizationExtra = selected && extraPayment > 0 ? generateAmortization(selected.remainingBalance, selected.interestRate, selected.monthlyPayment + extraPayment) : [];
  const totalInterestNormal = amortization.reduce((s, a) => s + a.interest, 0);
  const totalInterestExtra = amortizationExtra.reduce((s, a) => s + a.interest, 0);

  return (
    <PageWrapper><AnimatedItem><h1 className="text-2xl font-bold">Empréstimos & Dívidas</h1><p className="text-muted-foreground mb-6">Acompanhe seus empréstimos e estratégias de quitação</p></AnimatedItem>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <AnimatedItem><Card><CardHeader className="pb-2"><CardTitle className="text-sm">Dívida Total</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-red-600">{formatCurrency(totalDebt)}</div></CardContent></Card></AnimatedItem>
        <AnimatedItem><Card><CardHeader className="pb-2"><CardTitle className="text-sm">Pagamento Mensal</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{formatCurrency(totalMonthly)}</div></CardContent></Card></AnimatedItem>
        <AnimatedItem><Card><CardHeader className="pb-2"><CardTitle className="text-sm">Empréstimos Ativos</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{loans.filter(l => l.status === "ACTIVE").length}</div></CardContent></Card></AnimatedItem>
      </div>

      <AnimatedItem>
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Empréstimos</CardTitle>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />Novo</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Novo Empréstimo</DialogTitle></DialogHeader>
                <div className="grid gap-3">
                  <div><Label>Nome</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                  <div><Label>Tipo</Label><Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{LOAN_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent></Select></div>
                  <div><Label>Valor Principal</Label><Input type="number" value={form.principal} onChange={e => setForm({ ...form, principal: e.target.value })} /></div>
                  <div><Label>Taxa de Juros (% a.a.)</Label><Input type="number" step="0.1" value={form.interestRate} onChange={e => setForm({ ...form, interestRate: e.target.value })} /></div>
                  <div><Label>Parcela Mensal</Label><Input type="number" value={form.monthlyPayment} onChange={e => setForm({ ...form, monthlyPayment: e.target.value })} /></div>
                  <div><Label>Data Início</Label><Input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} /></div>
                  <Button onClick={handleSubmit}>Salvar</Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loans.map(loan => {
                const progress = loan.principal > 0 ? ((loan.principal - loan.remainingBalance) / loan.principal) * 100 : 0;
                return (
                  <div key={loan.id} className="p-4 border rounded-lg cursor-pointer hover:bg-muted/50" onClick={() => setSelected(loan)}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{loan.name}</span>
                        <Badge variant={loan.status === "ACTIVE" ? "default" : "secondary"}>{loan.status === "ACTIVE" ? "Ativo" : loan.status === "PAID_OFF" ? "Quitado" : "Inadimplente"}</Badge>
                        <Badge variant="outline">{LOAN_TYPES.find(t => t.value === loan.type)?.label}</Badge>
                      </div>
                      <Button variant="ghost" size="icon" onClick={e => { e.stopPropagation(); handleDelete(loan.id); }}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-sm mb-2">
                      <div><span className="text-muted-foreground">Principal:</span> {formatCurrency(loan.principal)}</div>
                      <div><span className="text-muted-foreground">Saldo:</span> {formatCurrency(loan.remainingBalance)}</div>
                      <div><span className="text-muted-foreground">Parcela:</span> {formatCurrency(loan.monthlyPayment)}</div>
                      <div><span className="text-muted-foreground">Juros:</span> {loan.interestRate}% a.a.</div>
                    </div>
                    <Progress value={progress} className="h-2" />
                    <div className="text-xs text-muted-foreground mt-1">{progress.toFixed(1)}% pago</div>
                  </div>
                );
              })}
              {loans.length === 0 && <p className="text-center text-muted-foreground py-8">Nenhum empréstimo cadastrado</p>}
            </div>
          </CardContent>
        </Card>
      </AnimatedItem>

      {selected && (
        <AnimatedItem>
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Calculator className="h-5 w-5" />{selected.name} — Amortização</CardTitle></CardHeader>
            <CardContent>
              <Tabs defaultValue="schedule">
                <TabsList><TabsTrigger value="schedule">Tabela</TabsTrigger><TabsTrigger value="payoff">Estratégia de Quitação</TabsTrigger></TabsList>
                <TabsContent value="schedule">
                  <div className="max-h-96 overflow-auto">
                    <Table>
                      <TableHeader><TableRow><TableHead>Mês</TableHead><TableHead className="text-right">Parcela</TableHead><TableHead className="text-right">Principal</TableHead><TableHead className="text-right">Juros</TableHead><TableHead className="text-right">Saldo</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {amortization.slice(0, 60).map(a => (
                          <TableRow key={a.month}><TableCell>{a.month}</TableCell><TableCell className="text-right">{formatCurrency(a.payment)}</TableCell><TableCell className="text-right text-green-600">{formatCurrency(a.principal)}</TableCell><TableCell className="text-right text-red-600">{formatCurrency(a.interest)}</TableCell><TableCell className="text-right">{formatCurrency(a.balance)}</TableCell></TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">Total de juros: {formatCurrency(totalInterestNormal)} | Prazo: {amortization.length} meses</p>
                </TabsContent>
                <TabsContent value="payoff">
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <Label>Pagamento Extra Mensal:</Label>
                      <Input type="number" className="w-40" value={extraPayment} onChange={e => setExtraPayment(parseFloat(e.target.value) || 0)} />
                    </div>
                    {extraPayment > 0 && amortizationExtra.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card><CardContent className="pt-4"><div className="text-sm text-muted-foreground">Meses economizados</div><div className="text-2xl font-bold text-green-600">{amortization.length - amortizationExtra.length}</div></CardContent></Card>
                        <Card><CardContent className="pt-4"><div className="text-sm text-muted-foreground">Juros economizados</div><div className="text-2xl font-bold text-green-600">{formatCurrency(totalInterestNormal - totalInterestExtra)}</div></CardContent></Card>
                        <Card><CardContent className="pt-4"><div className="text-sm text-muted-foreground">Novo prazo</div><div className="text-2xl font-bold">{amortizationExtra.length} meses</div></CardContent></Card>
                      </div>
                    )}
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <h4 className="font-medium mb-2 flex items-center gap-2"><TrendingDown className="h-4 w-4" />Comparação de Estratégias</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div><span className="text-muted-foreground">Pagamento mínimo:</span><br />{amortization.length} meses, {formatCurrency(totalInterestNormal)} em juros</div>
                        <div><span className="text-muted-foreground">Com extra de {formatCurrency(extraPayment || 0)}:</span><br />{amortizationExtra.length || amortization.length} meses, {formatCurrency(extraPayment > 0 ? totalInterestExtra : totalInterestNormal)} em juros</div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </AnimatedItem>
      )}
    </PageWrapper>
  );
}
