"use client";
import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Plus, Trash2, PiggyBank, Clock, History } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/empty-state";
import { PageWrapper, AnimatedItem } from "@/components/page-wrapper";
import { CardsSkeleton } from "@/components/dashboard-skeleton";

interface Goal { id: string; name: string; targetAmount: number; currentAmount: number; deadline: string | null; createdAt: string }
interface GoalDeposit { id: string; amount: number; note: string | null; createdAt: string }

function DonutProgress({ percent, size = 120, strokeWidth = 10 }: { percent: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(percent, 100) / 100) * circumference;
  const color = percent >= 100 ? "hsl(142, 71%, 45%)" : "hsl(256, 77%, 60%)";

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth={strokeWidth} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          className="transition-all duration-1000 ease-out" />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-lg font-bold">{Math.min(percent, 100).toFixed(0)}%</span>
      </div>
    </div>
  );
}

function Countdown({ deadline }: { deadline: string }) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const update = () => {
      const now = new Date().getTime();
      const target = new Date(deadline).getTime();
      const diff = target - now;
      if (diff <= 0) { setTimeLeft("Prazo encerrado"); return; }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      if (days > 30) setTimeLeft(`${days} dias restantes`);
      else if (days > 0) setTimeLeft(`${days}d ${hours}h restantes`);
      else setTimeLeft(`${hours}h restantes`);
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [deadline]);

  return (
    <div className="flex items-center gap-1 text-xs text-muted-foreground">
      <Clock className="h-3 w-3" />
      <span>{timeLeft}</span>
    </div>
  );
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [depositOpen, setDepositOpen] = useState(false);
  const [depositGoalId, setDepositGoalId] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState("");
  const [depositNote, setDepositNote] = useState("");
  const [form, setForm] = useState({ name: "", targetAmount: "", deadline: "" });
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [historyGoalId, setHistoryGoalId] = useState<string | null>(null);
  const [deposits, setDeposits] = useState<GoalDeposit[]>([]);

  useEffect(() => { document.title = "Metas | Ori Financeiro"; }, []);

  const load = useCallback(() => { setLoading(true); fetch("/api/goals").then((r) => r.json()).then((d) => { setGoals(d); setLoading(false); }); }, []);
  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    try {
      await fetch("/api/goals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      setOpen(false); setForm({ name: "", targetAmount: "", deadline: "" });
      toast.success("Meta criada!"); load();
    } catch { toast.error("Erro ao criar meta"); }
  };

  const remove = async () => {
    if (!deleteId) return;
    try {
      await fetch(`/api/goals/${deleteId}`, { method: "DELETE" });
      toast.success("Meta excluída!"); setDeleteId(null); load();
    } catch { toast.error("Erro ao excluir"); }
  };

  const deposit = async () => {
    if (!depositGoalId) return;
    try {
      await fetch(`/api/goals/${depositGoalId}/deposit`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: depositAmount, note: depositNote }),
      });
      setDepositOpen(false); setDepositGoalId(null); setDepositAmount(""); setDepositNote("");
      toast.success("Depósito realizado!");

      // Check if goal is now complete for confetti
      const updatedGoals = await fetch("/api/goals").then(r => r.json());
      setGoals(updatedGoals);
      setLoading(false);

      const goal = updatedGoals.find((g: Goal) => g.id === depositGoalId);
      if (goal && goal.currentAmount >= goal.targetAmount) {
        // Fire confetti!
        const confetti = (await import("canvas-confetti")).default;
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
        toast.success("🎉 Meta atingida! Parabéns!", { duration: 5000 });
      }
    } catch { toast.error("Erro ao depositar"); }
  };

  const showHistory = async (goalId: string) => {
    setHistoryGoalId(goalId);
    const data = await fetch(`/api/goals/${goalId}/deposits`).then(r => r.json());
    setDeposits(data);
  };

  return (
    <PageWrapper>
      <AnimatedItem>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Metas de Economia</h1>
            <p className="text-sm text-muted-foreground">Acompanhe suas metas financeiras</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-2" />Nova Meta</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nova Meta</DialogTitle><DialogDescription>Defina uma meta de economia</DialogDescription></DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2"><Label>Nome</Label><Input placeholder="Ex: Viagem" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div className="space-y-2"><Label>Valor alvo</Label><Input type="number" placeholder="0.00" value={form.targetAmount} onChange={(e) => setForm({ ...form, targetAmount: e.target.value })} /></div>
                <div className="space-y-2"><Label>Prazo (opcional)</Label><Input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} /></div>
                <Button onClick={submit} className="w-full" disabled={!form.name || !form.targetAmount}>Salvar</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </AnimatedItem>
      <AnimatedItem><Separator /></AnimatedItem>

      {loading ? <CardsSkeleton /> : goals.length === 0 ? (
        <EmptyState icon={PiggyBank} title="Nenhuma meta" description="Crie metas para acompanhar suas economias" actionLabel="Nova Meta" onAction={() => setOpen(true)} />
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {goals.map((g) => {
            const pct = g.targetAmount > 0 ? (g.currentAmount / g.targetAmount) * 100 : 0;
            const isComplete = pct >= 100;
            return (
              <AnimatedItem key={g.id}>
                <Card className={`transition-colors hover:border-primary/50 ${isComplete ? "border-emerald-500/50 bg-emerald-500/5" : ""}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="font-medium">{g.name}</p>
                        {isComplete && <span className="text-xs text-emerald-600 font-medium">🎉 Meta atingida!</span>}
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => showHistory(g.id)}><History className="h-3.5 w-3.5 text-muted-foreground" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setDepositGoalId(g.id); setDepositOpen(true); }}><PiggyBank className="h-3.5 w-3.5 text-emerald-500" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDeleteId(g.id)}><Trash2 className="h-3.5 w-3.5 text-muted-foreground" /></Button>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <DonutProgress percent={pct} size={90} strokeWidth={8} />
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-semibold">{formatCurrency(g.currentAmount)}</p>
                        <p className="text-xs text-muted-foreground">de {formatCurrency(g.targetAmount)}</p>
                        {g.targetAmount - g.currentAmount > 0 && (
                          <p className="text-xs text-muted-foreground">Faltam {formatCurrency(g.targetAmount - g.currentAmount)}</p>
                        )}
                      </div>
                    </div>

                    {g.deadline && (
                      <div className="mt-3 pt-3 border-t border-border/50">
                        <Countdown deadline={g.deadline} />
                        <p className="text-xs text-muted-foreground mt-0.5">Prazo: {formatDate(g.deadline)}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </AnimatedItem>
            );
          })}
        </div>
      )}

      {/* Deposit Dialog */}
      <Dialog open={depositOpen} onOpenChange={setDepositOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Depositar na Meta</DialogTitle><DialogDescription>Adicione um valor à meta selecionada</DialogDescription></DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2"><Label>Valor</Label><Input type="number" placeholder="0.00" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} /></div>
            <div className="space-y-2"><Label>Nota (opcional)</Label><Input placeholder="Ex: Economias do mês" value={depositNote} onChange={(e) => setDepositNote(e.target.value)} /></div>
            <Button onClick={deposit} className="w-full" disabled={!depositAmount}>Depositar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Deposit History Dialog */}
      <Dialog open={!!historyGoalId} onOpenChange={(o) => !o && setHistoryGoalId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Histórico de Depósitos</DialogTitle><DialogDescription>Todos os depósitos desta meta</DialogDescription></DialogHeader>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {deposits.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum depósito ainda</p>
            ) : deposits.map(d => (
              <div key={d.id} className="flex items-center justify-between py-2 px-3 rounded-md bg-muted/30">
                <div>
                  <p className="text-sm font-medium text-emerald-600">+{formatCurrency(d.amount)}</p>
                  {d.note && <p className="text-xs text-muted-foreground">{d.note}</p>}
                </div>
                <p className="text-xs text-muted-foreground">{formatDate(d.createdAt)}</p>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)} onConfirm={remove} />
    </PageWrapper>
  );
}
