"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import { PageWrapper, AnimatedItem } from "@/components/page-wrapper";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus } from "lucide-react";

interface Transaction {
  id: string; description: string; amount: number; type: string; date: string;
  account: { name: string }; category: { name: string };
}
interface Recurring { id: string; description: string; amount: number; type: string; dayOfMonth: number; active: boolean; }
interface Payable { id: string; description: string; amount: number; dueDate: string; paid: boolean; }
interface GoalMilestone { name: string; date: string; }

export default function CalendarPage() {
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [monthIdx, setMonthIdx] = useState(() => new Date().getMonth());
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [recurring, setRecurring] = useState<Recurring[]>([]);
  const [payables, setPayables] = useState<Payable[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickDesc, setQuickDesc] = useState("");
  const [quickAmount, setQuickAmount] = useState("");
  const [quickType, setQuickType] = useState("expense");
  const [accounts, setAccounts] = useState<{id: string; name: string}[]>([]);
  const [categories, setCategories] = useState<{id: string; name: string; type: string}[]>([]);
  const [quickAccount, setQuickAccount] = useState("");
  const [quickCategory, setQuickCategory] = useState("");

  const month = `${year}-${String(monthIdx + 1).padStart(2, "0")}`;

  useEffect(() => {
    document.title = "Calendário | Ori Financeiro";
    const lastDay = new Date(year, monthIdx + 1, 0).getDate();
    const from = `${month}-01`;
    const to = `${month}-${String(lastDay).padStart(2, "0")}`;
    fetch(`/api/transactions?from=${from}&to=${to}`).then(r => r.json()).then(setTransactions);
    fetch("/api/recurring").then(r => r.json()).then(setRecurring);
    fetch("/api/payables").then(r => r.json()).then((data: Payable[]) => {
      setPayables(data.filter(p => {
        const d = new Date(p.dueDate);
        return d.getMonth() === monthIdx && d.getFullYear() === year;
      }));
    }).catch(() => setPayables([]));
    fetch("/api/accounts").then(r => r.json()).then(setAccounts);
    fetch("/api/categories").then(r => r.json()).then(setCategories);
  }, [month, year, monthIdx]);

  const prev = () => { if (monthIdx === 0) { setMonthIdx(11); setYear(y => y - 1); } else setMonthIdx(m => m - 1); };
  const next = () => { if (monthIdx === 11) { setMonthIdx(0); setYear(y => y + 1); } else setMonthIdx(m => m + 1); };
  const goToday = () => { setYear(new Date().getFullYear()); setMonthIdx(new Date().getMonth()); };

  const dayMap = new Map<number, Transaction[]>();
  transactions.forEach(t => {
    const d = new Date(t.date).getDate();
    if (!dayMap.has(d)) dayMap.set(d, []);
    dayMap.get(d)!.push(t);
  });

  const payableDays = new Map<number, Payable[]>();
  payables.forEach(p => {
    const d = new Date(p.dueDate).getDate();
    if (!payableDays.has(d)) payableDays.set(d, []);
    payableDays.get(d)!.push(p);
  });

  const recurringDays = new Set(recurring.filter(r => r.active).map(r => r.dayOfMonth));

  const firstDayOfWeek = new Date(year, monthIdx, 1).getDay();
  const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();
  const today = new Date();
  const isToday = (d: number) => today.getFullYear() === year && today.getMonth() === monthIdx && today.getDate() === d;

  const monthName = new Date(year, monthIdx).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  const selectedTransactions = selectedDay ? dayMap.get(selectedDay) || [] : [];
  const selectedPayables = selectedDay ? payableDays.get(selectedDay) || [] : [];

  const quickAdd = async () => {
    if (!quickDesc || !quickAmount || !quickAccount || !quickCategory || !selectedDay) return;
    const date = `${month}-${String(selectedDay).padStart(2, "0")}`;
    await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description: quickDesc, amount: parseFloat(quickAmount), type: quickType,
        date, accountId: quickAccount, categoryId: quickCategory,
      }),
    });
    toast.success("Transação adicionada");
    setShowQuickAdd(false);
    setQuickDesc(""); setQuickAmount("");
    // Reload
    const lastDay = new Date(year, monthIdx + 1, 0).getDate();
    fetch(`/api/transactions?from=${month}-01&to=${month}-${String(lastDay).padStart(2, "0")}`).then(r => r.json()).then(setTransactions);
  };

  // Monthly summary
  const totalIncome = transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  return (
    <PageWrapper>
      <AnimatedItem>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
              <CalendarIcon className="h-6 w-6" /> Calendário Financeiro
            </h1>
            <p className="text-sm text-muted-foreground">Visualize receitas, despesas e vencimentos</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={goToday}>Hoje</Button>
          </div>
        </div>
      </AnimatedItem>
      <AnimatedItem><Separator /></AnimatedItem>

      {/* Summary */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
        <AnimatedItem>
          <div className="rounded-lg border p-3 text-center">
            <p className="text-xs text-muted-foreground">Receitas</p>
            <p className="text-lg font-bold text-emerald-600">{formatCurrency(totalIncome)}</p>
          </div>
        </AnimatedItem>
        <AnimatedItem>
          <div className="rounded-lg border p-3 text-center">
            <p className="text-xs text-muted-foreground">Despesas</p>
            <p className="text-lg font-bold text-red-600">{formatCurrency(totalExpense)}</p>
          </div>
        </AnimatedItem>
        <AnimatedItem>
          <div className="rounded-lg border p-3 text-center">
            <p className="text-xs text-muted-foreground">Saldo</p>
            <p className={`text-lg font-bold ${totalIncome - totalExpense >= 0 ? "text-emerald-600" : "text-red-600"}`}>
              {formatCurrency(totalIncome - totalExpense)}
            </p>
          </div>
        </AnimatedItem>
        <AnimatedItem>
          <div className="rounded-lg border p-3 text-center">
            <p className="text-xs text-muted-foreground">Vencimentos</p>
            <p className="text-lg font-bold text-orange-600">{payables.filter(p => !p.paid).length}</p>
          </div>
        </AnimatedItem>
      </div>

      {/* Legend */}
      <AnimatedItem>
        <div className="flex gap-4 flex-wrap text-xs">
          <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Receita</span>
          <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500" /> Despesa</span>
          <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500" /> Transferência</span>
          <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-orange-500" /> Vencimento</span>
          <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-400" /> Recorrência</span>
        </div>
      </AnimatedItem>

      <AnimatedItem>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" onClick={prev}><ChevronLeft className="h-4 w-4" /></Button>
              <CardTitle className="text-base font-medium capitalize">{monthName}</CardTitle>
              <Button variant="ghost" size="sm" onClick={next}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-px">
              {weekDays.map(w => (
                <div key={w} className="text-center text-xs font-medium text-muted-foreground py-2">{w}</div>
              ))}
              {Array.from({ length: firstDayOfWeek }).map((_, i) => <div key={`e-${i}`} />)}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                const dayTx = dayMap.get(day) || [];
                const dayPayables = payableDays.get(day) || [];
                const hasIncome = dayTx.some(t => t.type === "income");
                const hasExpense = dayTx.some(t => t.type === "expense");
                const hasTransfer = dayTx.some(t => t.type === "transfer");
                const hasBillDue = dayPayables.some(p => !p.paid);
                const isRecurring = recurringDays.has(day);
                const total = dayTx.reduce((s, t) => s + (t.type === "income" ? t.amount : -t.amount), 0);

                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    className={`relative min-h-[80px] p-1.5 border rounded-md text-left transition-colors hover:bg-muted/50 ${
                      isToday(day) ? "border-primary bg-primary/5" : "border-border/50"
                    } ${selectedDay === day ? "ring-2 ring-primary" : ""}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-medium ${isToday(day) ? "text-primary" : ""}`}>{day}</span>
                      <div className="flex gap-0.5">
                        {isRecurring && <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                        {hasBillDue && <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />}
                      </div>
                    </div>
                    {(dayTx.length > 0 || dayPayables.length > 0) && (
                      <div className="mt-1 space-y-0.5">
                        <div className="flex items-center gap-0.5">
                          {hasIncome && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                          {hasExpense && <div className="w-1.5 h-1.5 rounded-full bg-red-500" />}
                          {hasTransfer && <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                        </div>
                        {dayTx.length > 0 && (
                          <p className={`text-[10px] font-medium ${total >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                            {formatCurrency(Math.abs(total))}
                          </p>
                        )}
                        {dayTx.length > 2 && <p className="text-[9px] text-muted-foreground">+{dayTx.length - 2} mais</p>}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </AnimatedItem>

      {/* Day detail dialog */}
      <Dialog open={selectedDay !== null && !showQuickAdd} onOpenChange={() => setSelectedDay(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{selectedDay && `${String(selectedDay).padStart(2, "0")}/${String(monthIdx + 1).padStart(2, "0")}/${year}`}</span>
              <Button size="sm" onClick={() => setShowQuickAdd(true)}><Plus className="h-3 w-3 mr-1" /> Adicionar</Button>
            </DialogTitle>
          </DialogHeader>

          {selectedPayables.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-orange-600">Vencimentos</p>
              {selectedPayables.map(p => (
                <div key={p.id} className="flex items-center justify-between p-2 rounded border border-orange-500/20 bg-orange-500/5">
                  <span className="text-sm">{p.description}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{formatCurrency(p.amount)}</span>
                    <Badge variant={p.paid ? "default" : "destructive"}>{p.paid ? "Pago" : "Pendente"}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}

          {selectedTransactions.length === 0 && selectedPayables.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhum registro neste dia</p>
          ) : selectedTransactions.length > 0 && (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {selectedTransactions.map(t => (
                <div key={t.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="text-sm font-medium">{t.description}</p>
                    <p className="text-xs text-muted-foreground">{t.category.name} • {t.account.name}</p>
                  </div>
                  <span className={`text-sm font-semibold ${t.type === "income" ? "text-emerald-500" : "text-red-500"}`}>
                    {t.type === "income" ? "+" : "-"}{formatCurrency(t.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Quick add dialog */}
      <Dialog open={showQuickAdd} onOpenChange={setShowQuickAdd}>
        <DialogContent>
          <DialogHeader><DialogTitle>Adicionar Transação Rápida</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Descrição</Label><Input value={quickDesc} onChange={e => setQuickDesc(e.target.value)} placeholder="Descrição" /></div>
            <div><Label>Valor</Label><Input type="number" step="0.01" value={quickAmount} onChange={e => setQuickAmount(e.target.value)} /></div>
            <div>
              <Label>Tipo</Label>
              <Select value={quickType} onValueChange={setQuickType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">Despesa</SelectItem>
                  <SelectItem value="income">Receita</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Conta</Label>
              <Select value={quickAccount} onValueChange={setQuickAccount}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {accounts.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Categoria</Label>
              <Select value={quickCategory} onValueChange={setQuickCategory}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {categories.filter(c => c.type === quickType).map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={quickAdd} className="w-full">Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}
