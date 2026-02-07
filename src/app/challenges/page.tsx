"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PageWrapper, AnimatedItem } from "@/components/page-wrapper";
import { toast } from "sonner";
import { Trophy, Plus, Trash2, Flame, Target, Zap } from "lucide-react";

interface ChallengeData {
  id: string; name: string; type: string; target: number; progress: number;
  streak: number; startDate: string; endDate: string | null; status: string;
  badges: string; createdAt: string;
}

const TYPE_LABELS: Record<string, string> = {
  "52_WEEK": "Desafio 52 Semanas",
  "30_DAY": "30 Dias Sem Gastar",
  "ROUND_UP": "Arredondar e Poupar",
  "CUSTOM": "Personalizado",
};

const TYPE_COLORS: Record<string, string> = {
  "52_WEEK": "bg-violet-500/10 text-violet-600",
  "30_DAY": "bg-red-500/10 text-red-600",
  "ROUND_UP": "bg-blue-500/10 text-blue-600",
  "CUSTOM": "bg-gray-500/10 text-gray-600",
};

export default function ChallengesPage() {
  const [challenges, setChallenges] = useState<ChallengeData[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState("52_WEEK");
  const [target, setTarget] = useState("");

  const load = () => fetch("/api/challenges").then(r => r.json()).then(setChallenges);
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!name) return;
    await fetch("/api/challenges", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, type, target: target ? parseFloat(target) : undefined }),
    });
    toast.success("Desafio criado! 🎯");
    setShowCreate(false);
    setName(""); setTarget("");
    load();
  };

  const updateProgress = async (id: string, progress: number, streak: number) => {
    await fetch("/api/challenges", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, progress, streak }),
    });
    toast.success("Progresso atualizado! 🔥");
    load();
  };

  const complete = async (id: string) => {
    await fetch("/api/challenges", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "COMPLETED", badges: ["🏆 Completou desafio"] }),
    });
    toast.success("Parabéns! Desafio concluído! 🏆");
    load();
  };

  const remove = async (id: string) => {
    await fetch("/api/challenges", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    toast.success("Desafio removido");
    load();
  };

  const active = challenges.filter(c => c.status === "ACTIVE");
  const completed = challenges.filter(c => c.status === "COMPLETED");

  return (
    <PageWrapper>
      <AnimatedItem>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
              <Trophy className="h-6 w-6 text-amber-500" /> Desafios
            </h1>
            <p className="text-sm text-muted-foreground">Gamifique suas finanças com desafios de economia</p>
          </div>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 mr-2" /> Novo Desafio
          </Button>
        </div>
      </AnimatedItem>
      <AnimatedItem><Separator /></AnimatedItem>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <AnimatedItem>
          <Card>
            <CardContent className="p-6 text-center">
              <Target className="h-8 w-8 text-violet-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">{active.length}</p>
              <p className="text-sm text-muted-foreground">Ativos</p>
            </CardContent>
          </Card>
        </AnimatedItem>
        <AnimatedItem>
          <Card>
            <CardContent className="p-6 text-center">
              <Trophy className="h-8 w-8 text-amber-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">{completed.length}</p>
              <p className="text-sm text-muted-foreground">Concluídos</p>
            </CardContent>
          </Card>
        </AnimatedItem>
        <AnimatedItem>
          <Card>
            <CardContent className="p-6 text-center">
              <Flame className="h-8 w-8 text-orange-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">{Math.max(0, ...challenges.map(c => c.streak))}</p>
              <p className="text-sm text-muted-foreground">Maior Sequência</p>
            </CardContent>
          </Card>
        </AnimatedItem>
      </div>

      {/* Active challenges */}
      {active.length > 0 && (
        <AnimatedItem>
          <Card>
            <CardHeader><CardTitle className="text-sm">Desafios Ativos</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {active.map(ch => {
                const pct = ch.target > 0 ? Math.min(100, (ch.progress / ch.target) * 100) : 0;
                return (
                  <div key={ch.id} className="p-4 rounded-lg border space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className={TYPE_COLORS[ch.type] || TYPE_COLORS.CUSTOM}>{TYPE_LABELS[ch.type] || ch.type}</Badge>
                        <span className="font-medium">{ch.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {ch.streak > 0 && (
                          <Badge variant="outline" className="gap-1"><Flame className="h-3 w-3 text-orange-500" />{ch.streak} dias</Badge>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => remove(ch.id)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Progresso</span>
                        <span className="font-medium">{pct.toFixed(0)}%</span>
                      </div>
                      <Progress value={pct} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>R$ {ch.progress.toFixed(2)}</span>
                        <span>R$ {ch.target.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => updateProgress(ch.id, ch.progress + (ch.type === "52_WEEK" ? ch.streak + 1 : 10), ch.streak + 1)}>
                        <Zap className="h-3 w-3 mr-1" /> Registrar
                      </Button>
                      {pct >= 100 && (
                        <Button size="sm" onClick={() => complete(ch.id)}>
                          <Trophy className="h-3 w-3 mr-1" /> Completar
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </AnimatedItem>
      )}

      {/* Completed */}
      {completed.length > 0 && (
        <AnimatedItem>
          <Card>
            <CardHeader><CardTitle className="text-sm">🏆 Concluídos</CardTitle></CardHeader>
            <CardContent>
              <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                {completed.map(ch => {
                  let badges: string[] = [];
                  try { badges = JSON.parse(ch.badges); } catch { /* */ }
                  return (
                    <div key={ch.id} className="p-4 rounded-lg border bg-emerald-500/5 border-emerald-500/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Trophy className="h-4 w-4 text-amber-500" />
                        <span className="font-medium text-sm">{ch.name}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{TYPE_LABELS[ch.type] || ch.type} • Sequência: {ch.streak} dias</p>
                      {badges.length > 0 && (
                        <div className="flex gap-1 mt-2">{badges.map((b, i) => <Badge key={i} variant="secondary" className="text-xs">{b}</Badge>)}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </AnimatedItem>
      )}

      {challenges.length === 0 && (
        <AnimatedItem>
          <Card>
            <CardContent className="p-12 text-center">
              <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Comece um Desafio!</h3>
              <p className="text-sm text-muted-foreground mb-4">Crie desafios de economia e acompanhe seu progresso</p>
              <Button onClick={() => setShowCreate(true)}>Criar Primeiro Desafio</Button>
            </CardContent>
          </Card>
        </AnimatedItem>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Desafio</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nome</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="Meu desafio de economia" /></div>
            <div>
              <Label>Tipo</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="52_WEEK">52 Semanas (R$1, R$2, R$3...)</SelectItem>
                  <SelectItem value="30_DAY">30 Dias Sem Gastos Desnecessários</SelectItem>
                  <SelectItem value="ROUND_UP">Arredondar e Poupar</SelectItem>
                  <SelectItem value="CUSTOM">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {type === "CUSTOM" && (
              <div><Label>Meta (R$)</Label><Input type="number" value={target} onChange={e => setTarget(e.target.value)} placeholder="1000" /></div>
            )}
            <Button onClick={create} className="w-full">Criar Desafio 🚀</Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}
