"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, DollarSign, BarChart3 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { PageWrapper, AnimatedItem } from "@/components/page-wrapper";
import { Skeleton } from "@/components/ui/skeleton";

interface ProjectionData {
  historical: { month: string; income: number; expense: number; balance: number; projected: boolean }[];
  projections: { month: string; income: number; expense: number; balance: number; projected: boolean }[];
  avgIncome: number;
  avgExpense: number;
  currentBalance: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border rounded-lg p-3 shadow-lg text-sm">
      <p className="font-medium mb-1">{label}</p>
      {payload.map((p: { name: string; value: number; color: string }, i: number) => (
        <p key={i} style={{ color: p.color }}>{p.name}: {formatCurrency(p.value)}</p>
      ))}
    </div>
  );
};

export default function ProjectionsPage() {
  const [data, setData] = useState<ProjectionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { document.title = "Projeções | Ori Financeiro"; }, []);
  useEffect(() => {
    fetch("/api/projections").then((r) => r.json()).then((d) => { setData(d); setLoading(false); });
  }, []);

  if (loading) return <PageWrapper><div className="space-y-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}</div></PageWrapper>;
  if (!data) return null;

  const chartData = [...data.historical, ...data.projections].map((d) => ({
    month: d.month,
    Receita: d.income,
    Despesa: d.expense,
    Saldo: d.balance,
    projected: d.projected,
  }));

  return (
    <PageWrapper>
      <AnimatedItem>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Projeções Financeiras</h1>
          <p className="text-sm text-muted-foreground">Tendências baseadas nos últimos 3 meses</p>
        </div>
      </AnimatedItem>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <AnimatedItem>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10"><TrendingUp className="h-5 w-5 text-emerald-500" /></div>
                <div>
                  <p className="text-sm text-muted-foreground">Receita Média Mensal</p>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(data.avgIncome)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </AnimatedItem>
        <AnimatedItem>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-500/10"><TrendingDown className="h-5 w-5 text-red-500" /></div>
                <div>
                  <p className="text-sm text-muted-foreground">Despesa Média Mensal</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">{formatCurrency(data.avgExpense)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </AnimatedItem>
        <AnimatedItem>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10"><DollarSign className="h-5 w-5 text-blue-500" /></div>
                <div>
                  <p className="text-sm text-muted-foreground">Saldo Atual</p>
                  <p className={`text-2xl font-bold ${data.currentBalance >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>{formatCurrency(data.currentBalance)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </AnimatedItem>
      </div>

      <AnimatedItem>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />Tendência e Projeção
              <Badge variant="outline" className="ml-2">Pontilhado = Projeção</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line type="monotone" dataKey="Receita" stroke="hsl(142, 71%, 45%)" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="Despesa" stroke="hsl(0, 84%, 60%)" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="Saldo" stroke="hsl(217, 91%, 60%)" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </AnimatedItem>

      <AnimatedItem>
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Saldo Projetado (Próximos 3 Meses)</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {data.projections.map((p) => (
                <div key={p.month} className="p-4 rounded-lg border bg-muted/50">
                  <p className="text-sm text-muted-foreground font-medium">{p.month}</p>
                  <p className={`text-xl font-bold mt-1 ${p.balance >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                    {formatCurrency(p.balance)}
                  </p>
                  <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                    <span className="text-emerald-500">+{formatCurrency(p.income)}</span>
                    <span className="text-red-500">-{formatCurrency(p.expense)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </AnimatedItem>
    </PageWrapper>
  );
}
