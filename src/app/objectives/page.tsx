"use client";
import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils";
import { PageWrapper, AnimatedItem } from "@/components/page-wrapper";
import { Target, Plus, Trash2, Check, Pause, Play, Flag } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface Milestone {
  label: string;
  amount: number;
  completed: boolean;
}

interface Objective {
  id: string;
  name: string;
  description: string | null;
  targetDate: string;
  targetAmount: number;
  priority: string;
  status: string;
  milestones: Milestone[];
  createdAt: string;
}

export default function ObjectivesPage() {
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", targetDate: "", targetAmount: "", priority: "medium" });
  const [milestones, setMilestones] = useState<{ label: string; amount: string }[]>([]);
  const [editId, setEditId] = useState<string | null>(null);

  const load = useCallback(() => {
    fetch("/api/objectives").then(r => r.json()).then(setObjectives);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async () => {
    const ms = milestones.map(m => ({ label: m.label, amount: parseFloat(m.amount) || 0, completed: false }));
    const body = { ...form, targetAmount: parseFloat(form.targetAmount), milestones: ms };
    if (editId) {
      await fetch(`/api/objectives/${editId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    } else {
      await fetch("/api/objectives", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    }
    setForm({ name: "", description: "", targetDate: "", targetAmount: "", priority: "medium" });
    setMilestones([]);
    setEditId(null);
    setOpen(false);
    load();
  };

  const toggleMilestone = async (obj: Objective, idx: number) => {
    const ms = [...obj.milestones];
    ms[idx].completed = !ms[idx].completed;
    await fetch(`/api/objectives/${obj.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ milestones: ms }) });
    load();
  };

  const toggleStatus = async (obj: Objective) => {
    const next = obj.status === "active" ? "paused" : obj.status === "paused" ? "active" : "active";
    await fetch(`/api/objectives/${obj.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: next }) });
    load();
  };

  const completeObjective = async (obj: Objective) => {
    await fetch(`/api/objectives/${obj.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "completed" }) });
    load();
  };

  const deleteObjective = async (id: string) => {
    await fetch(`/api/objectives/${id}`, { method: "DELETE" });
    load();
  };

  const editObjective = (obj: Objective) => {
    setEditId(obj.id);
    setForm({ name: obj.name, description: obj.description || "", targetDate: obj.targetDate.slice(0, 10), targetAmount: String(obj.targetAmount), priority: obj.priority });
    setMilestones(obj.milestones.map(m => ({ label: m.label, amount: String(m.amount) })));
    setOpen(true);
  };

  const priorityColors: Record<string, string> = { high: "text-red-500", medium: "text-amber-500", low: "text-emerald-500" };
  const priorityLabels: Record<string, string> = { high: "Alta", medium: "Média", low: "Baixa" };
  const statusLabels: Record<string, string> = { active: "Ativo", completed: "Concluído", paused: "Pausado" };

  return (
    <PageWrapper>
      <AnimatedItem>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Objetivos Financeiros</h1>
            <p className="text-sm text-muted-foreground">Metas de longo prazo com milestones</p>
          </div>
          <Dialog open={open} onOpenChange={v => { setOpen(v); if (!v) { setEditId(null); setForm({ name: "", description: "", targetDate: "", targetAmount: "", priority: "medium" }); setMilestones([]); } }}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Novo Objetivo</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>{editId ? "Editar" : "Novo"} Objetivo</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Nome</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                <div><Label>Descrição</Label><Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Data Alvo</Label><Input type="date" value={form.targetDate} onChange={e => setForm({ ...form, targetDate: e.target.value })} /></div>
                  <div><Label>Valor Alvo (R$)</Label><Input type="number" value={form.targetAmount} onChange={e => setForm({ ...form, targetAmount: e.target.value })} /></div>
                </div>
                <div>
                  <Label>Prioridade</Label>
                  <Select value={form.priority} onValueChange={v => setForm({ ...form, priority: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="low">Baixa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Separator />
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Milestones</Label>
                    <Button variant="outline" size="sm" onClick={() => setMilestones([...milestones, { label: "", amount: "" }])}><Plus className="h-3 w-3 mr-1" />Adicionar</Button>
                  </div>
                  {milestones.map((m, i) => (
                    <div key={i} className="flex gap-2 mb-2">
                      <Input placeholder="Ex: Juntar R$ 5.000" value={m.label} onChange={e => { const ms = [...milestones]; ms[i].label = e.target.value; setMilestones(ms); }} />
                      <Input type="number" placeholder="Valor" className="w-32" value={m.amount} onChange={e => { const ms = [...milestones]; ms[i].amount = e.target.value; setMilestones(ms); }} />
                      <Button variant="ghost" size="icon" onClick={() => setMilestones(milestones.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  ))}
                </div>
                <Button className="w-full" onClick={handleSubmit} disabled={!form.name || !form.targetDate || !form.targetAmount}>{editId ? "Salvar" : "Criar"}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </AnimatedItem>
      <AnimatedItem><Separator /></AnimatedItem>

      {objectives.length === 0 ? (
        <AnimatedItem>
          <Card><CardContent className="p-12 text-center">
            <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhum objetivo criado ainda</p>
          </CardContent></Card>
        </AnimatedItem>
      ) : (
        <div className="space-y-4">
          {objectives.map(obj => {
            const completedMs = obj.milestones.filter(m => m.completed).length;
            const totalMs = obj.milestones.length;
            const progress = totalMs > 0 ? (completedMs / totalMs) * 100 : 0;
            const daysLeft = Math.ceil((new Date(obj.targetDate).getTime() - Date.now()) / 86400000);

            return (
              <AnimatedItem key={obj.id}>
                <Card className={`transition-all ${obj.status === "completed" ? "opacity-70" : ""} ${obj.status === "paused" ? "opacity-50" : ""}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${obj.status === "completed" ? "bg-emerald-500/10" : "bg-primary/10"}`}>
                          <Target className={`h-5 w-5 ${obj.status === "completed" ? "text-emerald-500" : "text-primary"}`} />
                        </div>
                        <div>
                          <CardTitle className="text-base">{obj.name}</CardTitle>
                          {obj.description && <p className="text-sm text-muted-foreground mt-0.5">{obj.description}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={obj.status === "active" ? "default" : obj.status === "completed" ? "success" : "secondary"}>
                          {statusLabels[obj.status]}
                        </Badge>
                        <Badge variant="outline" className={priorityColors[obj.priority]}>
                          <Flag className="h-3 w-3 mr-1" />{priorityLabels[obj.priority]}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-6 mb-4 text-sm text-muted-foreground">
                      <span>Meta: <strong className="text-foreground">{formatCurrency(obj.targetAmount)}</strong></span>
                      <span>Prazo: <strong className={`${daysLeft < 0 ? "text-red-500" : daysLeft < 30 ? "text-amber-500" : "text-foreground"}`}>
                        {daysLeft < 0 ? `${Math.abs(daysLeft)}d atrasado` : `${daysLeft}d restantes`}
                      </strong></span>
                    </div>

                    {/* Milestones Timeline */}
                    {obj.milestones.length > 0 && (
                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium">Milestones</span>
                          <span className="text-xs text-muted-foreground">{completedMs}/{totalMs}</span>
                        </div>
                        <Progress value={progress} className="h-2 mb-3" />
                        <div className="relative">
                          <div className="absolute left-3 top-0 bottom-0 w-px bg-border" />
                          <div className="space-y-3">
                            {obj.milestones.map((ms, i) => (
                              <div key={i} className="flex items-center gap-3 pl-0 relative">
                                <button
                                  onClick={() => obj.status !== "completed" && toggleMilestone(obj, i)}
                                  className={`relative z-10 w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                                    ms.completed
                                      ? "bg-emerald-500 border-emerald-500 text-white"
                                      : "bg-background border-border hover:border-primary"
                                  }`}
                                >
                                  {ms.completed && <Check className="h-3 w-3" />}
                                </button>
                                <div className="flex items-center gap-2">
                                  <span className={`text-sm ${ms.completed ? "line-through text-muted-foreground" : ""}`}>{ms.label}</span>
                                  <span className="text-xs text-muted-foreground">{formatCurrency(ms.amount)}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" onClick={() => editObjective(obj)}>Editar</Button>
                      {obj.status !== "completed" && (
                        <>
                          <Button variant="outline" size="sm" onClick={() => toggleStatus(obj)}>
                            {obj.status === "active" ? <><Pause className="h-3 w-3 mr-1" />Pausar</> : <><Play className="h-3 w-3 mr-1" />Retomar</>}
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => completeObjective(obj)}>
                            <Check className="h-3 w-3 mr-1" />Concluir
                          </Button>
                        </>
                      )}
                      <Button variant="ghost" size="sm" className="text-red-500 ml-auto" onClick={() => deleteObjective(obj.id)}>
                        <Trash2 className="h-3 w-3 mr-1" />Excluir
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </AnimatedItem>
            );
          })}
        </div>
      )}
    </PageWrapper>
  );
}
