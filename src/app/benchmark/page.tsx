"use client";
import { useEffect, useState } from "react";
import { PageWrapper } from "@/components/page-wrapper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, TrendingDown, Target, Award, Lightbulb, BarChart3 } from "lucide-react";

interface BenchmarkData {
  nationalAverages: Record<string, number>;
  recommended503020: { necessidades: number; desejos: number; poupanca: number };
  userDistribution: Record<string, number>;
  ratio503020: { necessidades: number; desejos: number; poupanca: number };
  percentiles: Record<string, number>;
  savingsPercentile: number;
  radar: { categories: string[]; user: number[]; national: number[] };
  tips: string[];
  income: number;
  expense: number;
  savingsRate: number;
}

export default function BenchmarkPage() {
  const [data, setData] = useState<BenchmarkData | null>(null);

  useEffect(() => {
    fetch("/api/benchmark").then(r => r.json()).then(setData).catch(() => {});
  }, []);

  if (!data) return <PageWrapper><div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" /></div></PageWrapper>;

  const r = data.ratio503020;
  const rec = data.recommended503020;

  return (
    <PageWrapper>
      <div className="grid gap-4">
        {/* Score Card */}
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center">
                <Award className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">Você está melhor que {data.savingsPercentile}% dos usuários em Economia</p>
                <p className="text-muted-foreground">Taxa de poupança: {data.savingsRate.toFixed(1)}% | Receita: {formatCurrency(data.income)} | Despesa: {formatCurrency(data.expense)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 50/30/20 Rule */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Target className="h-5 w-5" /> Regra 50/30/20</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: "Necessidades", value: r.necessidades, target: rec.necessidades, color: "bg-blue-500" },
              { label: "Desejos", value: r.desejos, target: rec.desejos, color: "bg-purple-500" },
              { label: "Poupança", value: r.poupanca, target: rec.poupanca, color: "bg-green-500" },
            ].map(item => (
              <div key={item.label} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{item.label}</span>
                  <span>
                    {item.value.toFixed(1)}% <span className="text-muted-foreground">/ {item.target}% recomendado</span>
                    {item.label === "Poupança"
                      ? item.value >= item.target ? <TrendingUp className="inline h-3 w-3 ml-1 text-green-500" /> : <TrendingDown className="inline h-3 w-3 ml-1 text-red-500" />
                      : item.value <= item.target ? <TrendingUp className="inline h-3 w-3 ml-1 text-green-500" /> : <TrendingDown className="inline h-3 w-3 ml-1 text-red-500" />
                    }
                  </span>
                </div>
                <div className="relative">
                  <Progress value={Math.min(100, (item.value / 60) * 100)} className="h-3" />
                  <div className="absolute top-0 h-3 w-0.5 bg-foreground/50" style={{ left: `${(item.target / 60) * 100}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Radar-like comparison */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" /> Distribuição por Categoria</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.radar.categories.map((cat, i) => {
                const userVal = data.radar.user[i] || 0;
                const natVal = data.radar.national[i] || 0;
                const better = userVal <= natVal;
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{cat}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant={better ? "default" : "destructive"} className="text-xs">
                          Você: {userVal.toFixed(1)}%
                        </Badge>
                        <Badge variant="outline" className="text-xs">Média: {natVal}%</Badge>
                        {data.percentiles[cat] && (
                          <span className="text-xs text-muted-foreground">Top {100 - data.percentiles[cat]}%</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 h-2">
                      <div className="bg-primary rounded-full" style={{ width: `${Math.min(100, userVal * 2)}%` }} />
                      <div className="bg-muted-foreground/30 rounded-full" style={{ width: `${Math.min(100, natVal * 2)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><div className="h-2 w-4 bg-primary rounded" /> Você</span>
              <span className="flex items-center gap-1"><div className="h-2 w-4 bg-muted-foreground/30 rounded" /> Média Nacional</span>
            </div>
          </CardContent>
        </Card>

        {/* Tips */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Lightbulb className="h-5 w-5" /> Dicas Personalizadas</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.tips.map((tip, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <Lightbulb className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
                  <p className="text-sm">{tip}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
}
