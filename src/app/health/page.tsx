"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Lightbulb, TrendingUp, Target, PiggyBank, BarChart3 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { PageWrapper, AnimatedItem } from "@/components/page-wrapper";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

interface HealthData {
  score: number;
  breakdown: {
    savings: { score: number; max: number; rate: number };
    budgets: { score: number; max: number; total: number };
    goals: { score: number; max: number; total: number };
    diversification: { score: number; max: number; sources: number };
  };
  tips: string[];
  income: number;
  expense: number;
}

function getScoreColor(score: number) {
  if (score >= 80) return "text-emerald-500";
  if (score >= 60) return "text-yellow-500";
  if (score >= 40) return "text-orange-500";
  return "text-red-500";
}

function getScoreLabel(score: number) {
  if (score >= 80) return "Excelente";
  if (score >= 60) return "Bom";
  if (score >= 40) return "Regular";
  return "Atenção";
}

function getScoreBg(score: number) {
  if (score >= 80) return "bg-emerald-500";
  if (score >= 60) return "bg-yellow-500";
  if (score >= 40) return "bg-orange-500";
  return "bg-red-500";
}

export default function HealthPage() {
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { document.title = "Saúde Financeira | Ori Financeiro"; }, []);
  useEffect(() => {
    fetch("/api/health-score").then((r) => r.json()).then((d) => { setData(d); setLoading(false); });
  }, []);

  if (loading) return <PageWrapper><div className="space-y-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}</div></PageWrapper>;
  if (!data) return null;

  const b = data.breakdown;

  return (
    <PageWrapper>
      <AnimatedItem>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Saúde Financeira</h1>
          <p className="text-sm text-muted-foreground">Avaliação geral das suas finanças</p>
        </div>
      </AnimatedItem>

      {/* Gauge */}
      <AnimatedItem>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <div className="relative w-48 h-48">
                <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90">
                  <circle cx="100" cy="100" r="85" fill="none" stroke="currentColor" strokeWidth="12" className="text-muted/20" />
                  <circle cx="100" cy="100" r="85" fill="none" strokeWidth="12" strokeLinecap="round"
                    className={getScoreBg(data.score).replace("bg-", "text-")}
                    strokeDasharray={`${(data.score / 100) * 534} 534`}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-5xl font-bold ${getScoreColor(data.score)}`}>{data.score}</span>
                  <span className="text-sm text-muted-foreground">/100</span>
                </div>
              </div>
              <Badge variant="outline" className={`text-lg px-4 py-1 ${getScoreColor(data.score)}`}>
                {getScoreLabel(data.score)}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </AnimatedItem>

      {/* Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnimatedItem>
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-medium flex items-center gap-2"><TrendingUp className="h-4 w-4 text-emerald-500" />Poupança</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm"><span>Taxa de poupança</span><span className="font-medium">{b.savings.rate}%</span></div>
                <Progress value={(b.savings.score / b.savings.max) * 100} className="h-2" />
                <p className="text-xs text-muted-foreground">{b.savings.score}/{b.savings.max} pontos</p>
              </div>
            </CardContent>
          </Card>
        </AnimatedItem>
        <AnimatedItem>
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-medium flex items-center gap-2"><Target className="h-4 w-4 text-blue-500" />Orçamentos</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm"><span>Dentro do limite</span><span className="font-medium">{b.budgets.total} orçamentos</span></div>
                <Progress value={(b.budgets.score / b.budgets.max) * 100} className="h-2" />
                <p className="text-xs text-muted-foreground">{b.budgets.score}/{b.budgets.max} pontos</p>
              </div>
            </CardContent>
          </Card>
        </AnimatedItem>
        <AnimatedItem>
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-medium flex items-center gap-2"><PiggyBank className="h-4 w-4 text-purple-500" />Metas</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm"><span>Em progresso</span><span className="font-medium">{b.goals.total} metas</span></div>
                <Progress value={(b.goals.score / b.goals.max) * 100} className="h-2" />
                <p className="text-xs text-muted-foreground">{b.goals.score}/{b.goals.max} pontos</p>
              </div>
            </CardContent>
          </Card>
        </AnimatedItem>
        <AnimatedItem>
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-medium flex items-center gap-2"><BarChart3 className="h-4 w-4 text-orange-500" />Diversificação</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm"><span>Fontes de receita</span><span className="font-medium">{b.diversification.sources}</span></div>
                <Progress value={(b.diversification.score / b.diversification.max) * 100} className="h-2" />
                <p className="text-xs text-muted-foreground">{b.diversification.score}/{b.diversification.max} pontos</p>
              </div>
            </CardContent>
          </Card>
        </AnimatedItem>
      </div>

      {/* Tips */}
      <AnimatedItem>
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium flex items-center gap-2"><Lightbulb className="h-4 w-4 text-yellow-500" />Dicas para Melhorar</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.tips.map((tip, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <Heart className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                  <p className="text-sm">{tip}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </AnimatedItem>

      {/* Summary */}
      <AnimatedItem>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-sm text-muted-foreground">Receita do Mês</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(data.income)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-sm text-muted-foreground">Despesa do Mês</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{formatCurrency(data.expense)}</p>
            </CardContent>
          </Card>
        </div>
      </AnimatedItem>
    </PageWrapper>
  );
}
