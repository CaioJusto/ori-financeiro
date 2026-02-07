"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, TrendingDown, Scale, BarChart3 } from "lucide-react";
import { PageWrapper, AnimatedItem } from "@/components/page-wrapper";
import { DashboardSkeleton } from "@/components/dashboard-skeleton";

interface MonthData {
  label: string;
  year: number;
  month: number;
  income: number;
  expense: number;
  balance: number;
  topCategories: { name: string; total: number }[];
  sparkline: number[];
  transactionCount: number;
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (!data.length || data.every(d => d === 0)) return <div className="h-8 flex items-center text-xs text-muted-foreground">Sem dados</div>;
  const max = Math.max(...data, 1);
  const w = 200;
  const h = 32;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * h}`).join(" ");
  return (
    <svg width={w} height={h} className="overflow-visible">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

export default function MonthlyPage() {
  const [months, setMonths] = useState<MonthData[] | null>(null);

  useEffect(() => {
    document.title = "Resumo Mensal | Ori Financeiro";
    fetch("/api/monthly").then((r) => r.json()).then(setMonths);
  }, []);

  if (!months) return <DashboardSkeleton />;

  return (
    <PageWrapper>
      <AnimatedItem>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Resumo Mensal</h1>
          <p className="text-sm text-muted-foreground">Comparativo dos últimos 3 meses</p>
        </div>
      </AnimatedItem>
      <AnimatedItem><Separator /></AnimatedItem>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {months.map((m, i) => (
          <AnimatedItem key={i}>
            <Card className={i === months.length - 1 ? "border-primary/50 ring-1 ring-primary/20" : ""}>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  <span className="capitalize">{m.label}</span>
                  {i === months.length - 1 && <Badge variant="secondary" className="text-[10px]">Atual</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Summary cards */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-emerald-500/10 p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <TrendingUp className="h-3 w-3 text-emerald-500" />
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Receita</span>
                    </div>
                    <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(m.income)}</p>
                  </div>
                  <div className="rounded-lg bg-red-500/10 p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <TrendingDown className="h-3 w-3 text-red-500" />
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Despesa</span>
                    </div>
                    <p className="text-sm font-bold text-red-600 dark:text-red-400">{formatCurrency(m.expense)}</p>
                  </div>
                </div>

                <div className="rounded-lg border p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Scale className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Saldo</span>
                  </div>
                  <p className={`text-lg font-bold ${m.balance >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                    {formatCurrency(m.balance)}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">{m.transactionCount} transações</p>
                </div>

                {/* Sparkline */}
                <div className="rounded-lg border p-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <BarChart3 className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Despesas diárias</span>
                  </div>
                  <Sparkline data={m.sparkline} color="hsl(256, 77%, 60%)" />
                </div>

                {/* Top categories */}
                {m.topCategories.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Top Categorias</span>
                    {m.topCategories.map((cat, j) => (
                      <div key={j} className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground flex items-center gap-1.5">
                          <span className="text-xs">#{j + 1}</span> {cat.name}
                        </span>
                        <span className="font-medium">{formatCurrency(cat.total)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </AnimatedItem>
        ))}
      </div>
    </PageWrapper>
  );
}
