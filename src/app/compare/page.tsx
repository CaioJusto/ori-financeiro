"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { PageWrapper, AnimatedItem } from "@/components/page-wrapper";
import { CountUp } from "@/components/count-up";
import { ArrowUpDown, TrendingUp, TrendingDown } from "lucide-react";

interface PeriodSummary {
  income: number; expense: number; balance: number; count: number;
  byCategory: { name: string; income: number; expense: number }[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label }: any) => {
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

export default function ComparePage() {
  const [from1, setFrom1] = useState("");
  const [to1, setTo1] = useState("");
  const [from2, setFrom2] = useState("");
  const [to2, setTo2] = useState("");
  const [data, setData] = useState<{ period1: PeriodSummary; period2: PeriodSummary } | null>(null);

  useEffect(() => { document.title = "Comparativo | Ori Financeiro"; }, []);

  const compare = async () => {
    if (!from1 || !to1 || !from2 || !to2) return;
    const res = await fetch(`/api/compare?from1=${from1}&to1=${to1}&from2=${from2}&to2=${to2}`);
    setData(await res.json());
  };

  // Build chart data merging categories from both periods
  const chartData = (() => {
    if (!data) return [];
    const allCats = new Set<string>();
    data.period1.byCategory.forEach(c => allCats.add(c.name));
    data.period2.byCategory.forEach(c => allCats.add(c.name));
    return Array.from(allCats).map(name => {
      const p1 = data.period1.byCategory.find(c => c.name === name);
      const p2 = data.period2.byCategory.find(c => c.name === name);
      return {
        name,
        "Período 1": (p1?.expense || 0) + (p1?.income || 0),
        "Período 2": (p2?.expense || 0) + (p2?.income || 0),
      };
    });
  })();

  const diffPercent = (a: number, b: number) => {
    if (a === 0) return b > 0 ? 100 : 0;
    return ((b - a) / a) * 100;
  };

  return (
    <PageWrapper>
      <AnimatedItem>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2"><ArrowUpDown className="h-6 w-6" />Comparativo de Períodos</h1>
          <p className="text-sm text-muted-foreground">Compare dois períodos lado a lado</p>
        </div>
      </AnimatedItem>
      <AnimatedItem><Separator /></AnimatedItem>

      <AnimatedItem>
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Selecione os Períodos</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
              <div className="space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase">Período 1</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><Label className="text-xs">De</Label><Input type="date" value={from1} onChange={e => setFrom1(e.target.value)} /></div>
                  <div className="space-y-1"><Label className="text-xs">Até</Label><Input type="date" value={to1} onChange={e => setTo1(e.target.value)} /></div>
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase">Período 2</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><Label className="text-xs">De</Label><Input type="date" value={from2} onChange={e => setFrom2(e.target.value)} /></div>
                  <div className="space-y-1"><Label className="text-xs">Até</Label><Input type="date" value={to2} onChange={e => setTo2(e.target.value)} /></div>
                </div>
              </div>
            </div>
            <Button onClick={compare} className="mt-4" disabled={!from1 || !to1 || !from2 || !to2}>Comparar</Button>
          </CardContent>
        </Card>
      </AnimatedItem>

      {data && (
        <>
          <AnimatedItem>
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              {[
                { label: "Período 1", d: data.period1 },
                { label: "Período 2", d: data.period2 },
              ].map(({ label, d }) => (
                <Card key={label}>
                  <CardHeader><CardTitle className="text-sm font-medium">{label}</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between"><span className="text-sm text-muted-foreground">Receitas</span><span className="text-sm font-medium text-emerald-600"><CountUp value={d.income} /></span></div>
                    <div className="flex justify-between"><span className="text-sm text-muted-foreground">Despesas</span><span className="text-sm font-medium text-red-600"><CountUp value={d.expense} /></span></div>
                    <Separator />
                    <div className="flex justify-between"><span className="text-sm font-medium">Balanço</span><span className={`text-sm font-bold ${d.balance >= 0 ? "text-emerald-600" : "text-red-600"}`}><CountUp value={d.balance} /></span></div>
                    <p className="text-xs text-muted-foreground">{d.count} transações</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </AnimatedItem>

          <AnimatedItem>
            <Card>
              <CardHeader><CardTitle className="text-sm font-medium">Variação</CardTitle></CardHeader>
              <CardContent>
                <div className="overflow-x-auto"><Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Métrica</TableHead>
                      <TableHead className="text-xs text-right">Período 1</TableHead>
                      <TableHead className="text-xs text-right">Período 2</TableHead>
                      <TableHead className="text-xs text-right">Variação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      { label: "Receitas", v1: data.period1.income, v2: data.period2.income },
                      { label: "Despesas", v1: data.period1.expense, v2: data.period2.expense },
                      { label: "Balanço", v1: data.period1.balance, v2: data.period2.balance },
                    ].map(row => {
                      const pct = diffPercent(row.v1, row.v2);
                      const isPositive = row.label === "Despesas" ? pct < 0 : pct > 0;
                      return (
                        <TableRow key={row.label}>
                          <TableCell className="text-sm font-medium">{row.label}</TableCell>
                          <TableCell className="text-right text-sm">{formatCurrency(row.v1)}</TableCell>
                          <TableCell className="text-right text-sm">{formatCurrency(row.v2)}</TableCell>
                          <TableCell className={`text-right text-sm font-medium flex items-center justify-end gap-1 ${isPositive ? "text-emerald-600" : "text-red-600"}`}>
                            {isPositive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                            {pct >= 0 ? "+" : ""}{pct.toFixed(1)}%
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table></div>
              </CardContent>
            </Card>
          </AnimatedItem>

          {/* 50/30/20 Benchmark */}
          <AnimatedItem>
            <Card>
              <CardHeader><CardTitle className="text-sm font-medium">Benchmark: Regra 50/30/20</CardTitle></CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-4">Comparando seu período 2 contra a regra recomendada (50% necessidades, 30% desejos, 20% poupança)</p>
                {(() => {
                  const income = data.period2.income || 1;
                  const expense = data.period2.expense;
                  const savings = income - expense;
                  const expPct = (expense / income) * 100;
                  const savPct = (savings / income) * 100;
                  return (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 rounded-lg border text-center">
                        <div className="text-sm text-muted-foreground">Despesas</div>
                        <div className={`text-2xl font-bold ${expPct <= 80 ? "text-green-600" : "text-red-600"}`}>{expPct.toFixed(0)}%</div>
                        <div className="text-xs text-muted-foreground">Meta: ≤ 80%</div>
                      </div>
                      <div className="p-4 rounded-lg border text-center">
                        <div className="text-sm text-muted-foreground">Poupança</div>
                        <div className={`text-2xl font-bold ${savPct >= 20 ? "text-green-600" : "text-yellow-600"}`}>{savPct.toFixed(0)}%</div>
                        <div className="text-xs text-muted-foreground">Meta: ≥ 20%</div>
                      </div>
                      <div className="p-4 rounded-lg border text-center">
                        <div className="text-sm text-muted-foreground">Status</div>
                        <div className="text-2xl">{savPct >= 20 ? "✅" : savPct >= 10 ? "⚠️" : "❌"}</div>
                        <div className="text-xs text-muted-foreground">{savPct >= 20 ? "Excelente" : savPct >= 10 ? "Pode melhorar" : "Atenção"}</div>
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </AnimatedItem>

          {chartData.length > 0 && (
            <AnimatedItem>
              <Card>
                <CardHeader><CardTitle className="text-sm font-medium">Comparativo por Categoria</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.1} />
                      <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar dataKey="Período 1" fill="hsl(256, 77%, 60%)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Período 2" fill="hsl(256, 77%, 60%, 0.4)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </AnimatedItem>
          )}
        </>
      )}
    </PageWrapper>
  );
}
