"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend, AreaChart, Area } from "recharts";
import { PageWrapper, AnimatedItem } from "@/components/page-wrapper";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, TrendingUp, Users, Activity } from "lucide-react";

const COLORS = ["#8b5cf6", "#3b82f6", "#22c55e", "#f97316", "#ef4444", "#ec4899", "#14b8a6", "#eab308", "#6366f1", "#f43f5e"];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 shadow-md">
      <p className="text-xs font-medium text-foreground mb-1">{label}</p>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-xs text-muted-foreground">
          <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: p.color }} />
          {p.name}: {typeof p.value === "number" ? formatCurrency(p.value) : p.value}
        </p>
      ))}
    </div>
  );
};

interface AnalyticsData {
  spendingByDay: { name: string; total: number; avg: number }[];
  categoryTrendData: Record<string, string | number>[];
  categoryNames: string[];
  incomeExpenseRatio: { month: string; income: number; expense: number; ratio: number }[];
  topPayees: { name: string; total: number }[];
  categoryAvg: { name: string; color: string; total: number; avg: number; count: number }[];
  movingAvg: { date: string; amount: number; avg7: number; avg30: number }[];
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [months, setMonths] = useState("6");

  useEffect(() => {
    document.title = "Analytics | Ori Financeiro";
    fetch(`/api/analytics?months=${months}`).then(r => r.json()).then(setData);
  }, [months]);

  if (!data) return <div className="p-8 text-center text-muted-foreground">Carregando...</div>;

  return (
    <PageWrapper>
      <AnimatedItem>
        <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2"><Activity className="h-6 w-6" /> Analytics</h1>
            <p className="text-sm text-muted-foreground">Análise avançada dos seus gastos</p>
          </div>
          <Select value={months} onValueChange={setMonths}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="3">3 meses</SelectItem>
              <SelectItem value="6">6 meses</SelectItem>
              <SelectItem value="12">12 meses</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </AnimatedItem>

      <div className="grid gap-6 md:grid-cols-2">
        <AnimatedItem>
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Gastos por Dia da Semana</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={data.spendingByDay}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<CTooltip />} />
                  <Bar dataKey="total" fill="#8b5cf6" name="Total" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="avg" fill="#3b82f6" name="Média" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </AnimatedItem>

        <AnimatedItem>
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Receita vs Despesa</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={data.incomeExpenseRatio}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<CTooltip />} />
                  <Area type="monotone" dataKey="income" fill="#22c55e" fillOpacity={0.3} stroke="#22c55e" name="Receita" />
                  <Area type="monotone" dataKey="expense" fill="#ef4444" fillOpacity={0.3} stroke="#ef4444" name="Despesa" />
                  <Legend />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </AnimatedItem>

        <AnimatedItem>
          <Card className="md:col-span-2">
            <CardHeader><CardTitle className="text-base">Tendência por Categoria</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.categoryTrendData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<CTooltip />} />
                  {data.categoryNames.slice(0, 8).map((name, i) => (
                    <Line key={name} type="monotone" dataKey={name} stroke={COLORS[i % COLORS.length]} name={name} dot={false} />
                  ))}
                  <Legend />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </AnimatedItem>

        <AnimatedItem>
          <Card>
            <CardHeader><CardTitle className="text-base">Média Móvel de Gastos</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={data.movingAvg.slice(-60)}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" className="text-xs" tickFormatter={v => v.slice(5)} />
                  <YAxis className="text-xs" />
                  <Tooltip content={<CTooltip />} />
                  <Line type="monotone" dataKey="amount" stroke="#6b7280" name="Diário" dot={false} strokeWidth={1} opacity={0.4} />
                  <Line type="monotone" dataKey="avg7" stroke="#8b5cf6" name="Média 7d" dot={false} strokeWidth={2} />
                  <Line type="monotone" dataKey="avg30" stroke="#3b82f6" name="Média 30d" dot={false} strokeWidth={2} />
                  <Legend />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </AnimatedItem>

        <AnimatedItem>
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4" /> Top Pagamentos</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.topPayees.map((p, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-muted-foreground w-5">{i + 1}.</span>
                      <span className="text-sm capitalize">{p.name}</span>
                    </div>
                    <span className="text-sm font-medium">{formatCurrency(p.total)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </AnimatedItem>

        <AnimatedItem>
          <Card className="md:col-span-2">
            <CardHeader><CardTitle className="text-base">Média por Categoria</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={data.categoryAvg.slice(0, 10)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" className="text-xs" tickFormatter={v => `R$${v}`} />
                  <YAxis type="category" dataKey="name" className="text-xs" width={100} />
                  <Tooltip content={<CTooltip />} />
                  <Bar dataKey="avg" fill="#8b5cf6" name="Média/transação" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="total" fill="#3b82f680" name="Total" radius={[0, 4, 4, 0]} />
                  <Legend />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </AnimatedItem>
      </div>
    </PageWrapper>
  );
}
