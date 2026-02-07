"use client";
import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, TrendingDown, DollarSign, ArrowDown, ArrowUp, Calendar } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, ReferenceLine } from "recharts";
import { PageWrapper, AnimatedItem } from "@/components/page-wrapper";
import { DashboardSkeleton } from "@/components/dashboard-skeleton";
import { CountUp } from "@/components/count-up";

interface ForecastDay {
  date: string;
  income: number;
  expense: number;
  balance: number;
  items: { description: string; amount: number; type: string; category: string; isProjected: boolean }[];
}

interface CashflowData {
  forecast: ForecastDay[];
  summary: {
    currentBalance: number;
    projectedIncome: number;
    projectedExpense: number;
    projectedBalance: number;
    lowestBalance: number;
    highestBalance: number;
    days: number;
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 shadow-md">
      <p className="text-xs font-medium text-foreground mb-1">{label}</p>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-xs text-muted-foreground">
          <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: p.color }} />
          {p.name}: {formatCurrency(p.value)}
        </p>
      ))}
    </div>
  );
};

export default function CashflowPage() {
  const [data, setData] = useState<CashflowData | null>(null);
  const [days, setDays] = useState("90");

  useEffect(() => { document.title = "Fluxo de Caixa | Ori Financeiro"; }, []);

  const load = useCallback(() => {
    setData(null);
    fetch(`/api/cashflow?days=${days}`).then(r => r.json()).then(setData);
  }, [days]);

  useEffect(() => { load(); }, [load]);

  if (!data) return <DashboardSkeleton />;

  const chartData = data.forecast
    .filter((_, i) => i % (days === "90" ? 3 : days === "60" ? 2 : 1) === 0 || _ === data.forecast[data.forecast.length - 1])
    .map(f => ({
      date: new Date(f.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      saldo: f.balance,
      receitas: f.income,
      despesas: f.expense,
      fluxo: f.income - f.expense,
    }));

  const weeklyData: { week: string; income: number; expense: number }[] = [];
  for (let i = 0; i < data.forecast.length; i += 7) {
    const chunk = data.forecast.slice(i, i + 7);
    const weekStart = new Date(chunk[0].date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    weeklyData.push({
      week: weekStart,
      income: chunk.reduce((s, d) => s + d.income, 0),
      expense: chunk.reduce((s, d) => s + d.expense, 0),
    });
  }

  return (
    <PageWrapper>
      <AnimatedItem>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Fluxo de Caixa</h1>
            <p className="text-sm text-muted-foreground">Projeção de receitas e despesas baseada em recorrências</p>
          </div>
          <Select value={days} onValueChange={setDays}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">Próximos 30 dias</SelectItem>
              <SelectItem value="60">Próximos 60 dias</SelectItem>
              <SelectItem value="90">Próximos 90 dias</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </AnimatedItem>
      <AnimatedItem><Separator /></AnimatedItem>

      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <AnimatedItem>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Saldo Atual</p>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold mt-2"><CountUp value={data.summary.currentBalance} /></p>
            </CardContent>
          </Card>
        </AnimatedItem>
        <AnimatedItem>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Receitas Projetadas</p>
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="text-2xl font-bold mt-2 text-emerald-600 dark:text-emerald-400"><CountUp value={data.summary.projectedIncome} /></p>
            </CardContent>
          </Card>
        </AnimatedItem>
        <AnimatedItem>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Despesas Projetadas</p>
                <TrendingDown className="h-4 w-4 text-red-500" />
              </div>
              <p className="text-2xl font-bold mt-2 text-red-600 dark:text-red-400"><CountUp value={data.summary.projectedExpense} /></p>
            </CardContent>
          </Card>
        </AnimatedItem>
        <AnimatedItem>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Saldo Projetado</p>
                <DollarSign className="h-4 w-4 text-violet-500" />
              </div>
              <p className={`text-2xl font-bold mt-2 ${data.summary.projectedBalance >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                <CountUp value={data.summary.projectedBalance} />
              </p>
              <div className="flex gap-4 mt-2">
                <span className="text-xs text-muted-foreground flex items-center gap-1"><ArrowDown className="h-3 w-3 text-red-500" />{formatCurrency(data.summary.lowestBalance)}</span>
                <span className="text-xs text-muted-foreground flex items-center gap-1"><ArrowUp className="h-3 w-3 text-emerald-500" />{formatCurrency(data.summary.highestBalance)}</span>
              </div>
            </CardContent>
          </Card>
        </AnimatedItem>
      </div>

      {/* Balance Projection Chart */}
      <AnimatedItem>
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Projeção de Saldo</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.1} />
                <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" strokeOpacity={0.5} />
                <Area type="monotone" dataKey="saldo" name="Saldo" stroke="hsl(256, 77%, 60%)" fill="hsl(256, 77%, 60%)" fillOpacity={0.1} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </AnimatedItem>

      {/* Weekly Income vs Expense */}
      <AnimatedItem>
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Receitas vs Despesas por Semana</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.1} />
                <XAxis dataKey="week" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="income" name="Receitas" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="Despesas" fill="hsl(0, 84%, 60%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </AnimatedItem>

      {/* Upcoming items */}
      <AnimatedItem>
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Próximos Lançamentos</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.forecast
                .filter(f => f.items.length > 0 && new Date(f.date) > new Date())
                .slice(0, 15)
                .map((f) => (
                  <div key={f.date}>
                    {f.items.map((item, i) => (
                      <div key={`${f.date}-${i}`} className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-muted/50">
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground w-12">
                            {new Date(f.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                          </span>
                          <div>
                            <p className="text-sm font-medium">{item.description}</p>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs">{item.category}</Badge>
                              {item.isProjected && <Badge variant="outline" className="text-xs">Projetado</Badge>}
                            </div>
                          </div>
                        </div>
                        <span className={`text-sm font-semibold ${item.type === "income" ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                          {item.type === "income" ? "+" : "-"}{formatCurrency(item.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                ))}
              {data.forecast.filter(f => f.items.length > 0 && new Date(f.date) > new Date()).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">Nenhum lançamento projetado. Cadastre recorrências para ver projeções.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </AnimatedItem>
    </PageWrapper>
  );
}
