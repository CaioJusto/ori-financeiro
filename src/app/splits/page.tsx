"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageWrapper, AnimatedItem } from "@/components/page-wrapper";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { Users, ArrowRight, Check, Plus } from "lucide-react";

interface Split {
  userId: string; userName: string; amount: number; paid: boolean;
}

interface SplitGroup {
  id: string; transactionId: string; description: string;
  splits: Split[]; settled: boolean; createdAt: string;
}

export default function SplitsPage() {
  const [groups, setGroups] = useState<SplitGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/splits").then(r => r.json()).then(d => setGroups(d.splits || [])).finally(() => setLoading(false));
  }, []);

  async function handleSettle(id: string) {
    const res = await fetch(`/api/splits/${id}/settle`, { method: "POST" });
    if (res.ok) {
      setGroups(prev => prev.map(g => g.id === id ? { ...g, settled: true } : g));
      toast.success("Divisão quitada!");
    }
  }

  // Calculate "quem deve quem"
  const balances: Record<string, number> = {};
  groups.filter(g => !g.settled).forEach(g => {
    const total = g.splits.reduce((s, sp) => s + sp.amount, 0);
    const perPerson = total / g.splits.length;
    g.splits.forEach(sp => {
      if (!balances[sp.userName]) balances[sp.userName] = 0;
      if (sp.paid) {
        balances[sp.userName] += total - perPerson;
      } else {
        balances[sp.userName] -= perPerson;
      }
    });
  });

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <PageWrapper>
      <AnimatedItem>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Divisão de Despesas</h1>
            <p className="text-muted-foreground">Quem deve quem — controle de despesas compartilhadas</p>
          </div>
          <Button onClick={() => toast.info("Crie uma divisão a partir de uma transação")}>
            <Plus className="h-4 w-4 mr-2" /> Nova Divisão
          </Button>
        </div>
      </AnimatedItem>

      {/* Balance Summary */}
      {Object.keys(balances).length > 0 && (
        <AnimatedItem>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2"><Users className="h-5 w-5" /> Resumo de Saldos</CardTitle>
              <CardDescription>Valores pendentes entre participantes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(balances).map(([name, amount]) => (
                  <div key={name} className="flex items-center justify-between p-3 rounded-lg border">
                    <span className="font-medium">{name}</span>
                    <span className={`font-bold ${amount >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {amount >= 0 ? "recebe" : "deve"} {formatCurrency(Math.abs(amount))}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </AnimatedItem>
      )}

      {/* Split Groups */}
      <AnimatedItem>
        <div className="space-y-4">
          {groups.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhuma divisão de despesas ainda</CardContent></Card>
          ) : groups.map(g => (
            <Card key={g.id} className={g.settled ? "opacity-60" : ""}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{g.description || `Transação ${g.transactionId.slice(0, 8)}`}</CardTitle>
                  <Badge variant={g.settled ? "secondary" : "default"}>{g.settled ? "Quitado" : "Pendente"}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {g.splits.map((sp, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded bg-muted/50">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold">
                          {sp.userName.charAt(0)}
                        </div>
                        <span className="text-sm">{sp.userName}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{formatCurrency(sp.amount)}</span>
                        {sp.paid ? (
                          <Badge variant="secondary" className="text-xs"><Check className="h-3 w-3 mr-1" /> Pago</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs"><ArrowRight className="h-3 w-3 mr-1" /> Deve</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {!g.settled && (
                  <Button size="sm" className="mt-3" onClick={() => handleSettle(g.id)}>
                    <Check className="h-4 w-4 mr-1" /> Quitar
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </AnimatedItem>
    </PageWrapper>
  );
}
