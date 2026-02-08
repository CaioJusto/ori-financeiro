"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/utils";
import { PageWrapper, AnimatedItem } from "@/components/page-wrapper";
import { CountUp } from "@/components/count-up";
import { Calculator, TrendingUp, PiggyBank, Percent, DollarSign } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface SimResult {
  currentBalance: number;
  monthlyIncome: number;
  monthlyExpense: number;
  categories: { id: string; name: string; avg: number }[];
  baseline: { month: number; balance: number }[];
  projected: { month: number; balance: number }[];
  savings: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 shadow-md">
      <p className="text-xs font-medium mb-1">Mês {label}</p>
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

export default function SimulatorPage() {
  const [scenario, setScenario] = useState("save_monthly");
  const [amount, setAmount] = useState("500");
  const [percentage, setPercentage] = useState("20");
  const [categoryId, setCategoryId] = useState("");
  const [months, setMonths] = useState("12");
  const [result, setResult] = useState<SimResult | null>(null);
  const [loading, setLoading] = useState(false);

  // Load initial data to get categories
  useEffect(() => {
    fetch("/api/simulate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scenario: "save_monthly", amount: 0, months: 12 }),
    }).then(r => {
      if (!r.ok) throw new Error("API error");
      return r.json();
    }).then(setResult).catch(() => {
      // Set empty result so page still renders
      setResult({
        currentBalance: 0, monthlyIncome: 0, monthlyExpense: 0,
        categories: [], baseline: [], projected: [], savings: 0,
      });
    });
  }, []);

  const simulate = async () => {
    setLoading(true);
    const body: Record<string, unknown> = { scenario, months: parseInt(months) };
    if (scenario === "save_monthly") body.amount = parseFloat(amount);
    if (scenario === "reduce_category") { body.categoryId = categoryId; body.percentage = parseFloat(percentage); }
    if (scenario === "income_increase") body.percentage = parseFloat(percentage);
    try {
      const r = await fetch("/api/simulate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!r.ok) throw new Error("API error");
      setResult(await r.json());
    } catch {
      // keep existing result
    }
    setLoading(false);
  };

  const chartData = result ? result.baseline.map((b, i) => ({
    month: b.month,
    "Sem mudança": b.balance,
    "Com mudança": result.projected[i].balance,
  })) : [];

  return (
    <PageWrapper>
      <AnimatedItem>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Simulador Financeiro</h1>
          <p className="text-sm text-muted-foreground">Cenários &quot;E se...&quot; baseados nos seus dados reais</p>
        </div>
      </AnimatedItem>
      <AnimatedItem><Separator /></AnimatedItem>

      {result && (
        <AnimatedItem>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
            <Card><CardContent className="p-6">
              <div className="flex items-center justify-between"><p className="text-sm text-muted-foreground">Saldo Atual</p><DollarSign className="h-4 w-4 text-muted-foreground" /></div>
              <p className="text-2xl font-bold mt-2"><CountUp value={result.currentBalance} /></p>
            </CardContent></Card>
            <Card><CardContent className="p-6">
              <div className="flex items-center justify-between"><p className="text-sm text-muted-foreground">Renda Mensal Média</p><TrendingUp className="h-4 w-4 text-emerald-500" /></div>
              <p className="text-2xl font-bold mt-2"><CountUp value={result.monthlyIncome} /></p>
            </CardContent></Card>
            <Card><CardContent className="p-6">
              <div className="flex items-center justify-between"><p className="text-sm text-muted-foreground">Gasto Mensal Médio</p><TrendingUp className="h-4 w-4 text-red-500" /></div>
              <p className="text-2xl font-bold mt-2"><CountUp value={result.monthlyExpense} /></p>
            </CardContent></Card>
          </div>
        </AnimatedItem>
      )}

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        <AnimatedItem>
          <Card className="lg:col-span-1">
            <CardHeader><CardTitle className="text-sm font-medium flex items-center gap-2"><Calculator className="h-4 w-4" />Configurar Cenário</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Tabs value={scenario} onValueChange={setScenario}>
                <TabsList className="w-full">
                  <TabsTrigger value="save_monthly" className="flex-1"><PiggyBank className="h-3 w-3 mr-1" />Economizar</TabsTrigger>
                  <TabsTrigger value="reduce_category" className="flex-1"><Percent className="h-3 w-3 mr-1" />Reduzir</TabsTrigger>
                  <TabsTrigger value="income_increase" className="flex-1"><TrendingUp className="h-3 w-3 mr-1" />Aumento</TabsTrigger>
                </TabsList>

                <TabsContent value="save_monthly" className="space-y-3 mt-4">
                  <p className="text-sm text-muted-foreground">E se eu economizar um valor fixo por mês?</p>
                  <div>
                    <Label>Valor mensal (R$)</Label>
                    <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} />
                  </div>
                  <input type="range" min="100" max="5000" step="100" value={amount} onChange={e => setAmount(e.target.value)} className="w-full accent-primary" />
                  <p className="text-xs text-muted-foreground text-center">{formatCurrency(parseFloat(amount) || 0)}/mês</p>
                </TabsContent>

                <TabsContent value="reduce_category" className="space-y-3 mt-4">
                  <p className="text-sm text-muted-foreground">E se eu reduzir gastos de uma categoria?</p>
                  <div>
                    <Label>Categoria</Label>
                    <Select value={categoryId} onValueChange={setCategoryId}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {result?.categories.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.name} ({formatCurrency(c.avg)}/mês)</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Redução (%)</Label>
                    <Input type="number" value={percentage} onChange={e => setPercentage(e.target.value)} />
                  </div>
                  <input type="range" min="5" max="100" step="5" value={percentage} onChange={e => setPercentage(e.target.value)} className="w-full accent-primary" />
                  <p className="text-xs text-muted-foreground text-center">{percentage}% de redução</p>
                </TabsContent>

                <TabsContent value="income_increase" className="space-y-3 mt-4">
                  <p className="text-sm text-muted-foreground">E se eu receber um aumento?</p>
                  <div>
                    <Label>Aumento (%)</Label>
                    <Input type="number" value={percentage} onChange={e => setPercentage(e.target.value)} />
                  </div>
                  <input type="range" min="5" max="100" step="5" value={percentage} onChange={e => setPercentage(e.target.value)} className="w-full accent-primary" />
                  <p className="text-xs text-muted-foreground text-center">{percentage}% de aumento</p>
                </TabsContent>
              </Tabs>

              <div>
                <Label>Período (meses)</Label>
                <Input type="number" value={months} onChange={e => setMonths(e.target.value)} />
                <input type="range" min="3" max="60" step="3" value={months} onChange={e => setMonths(e.target.value)} className="w-full accent-primary mt-1" />
              </div>

              <Button className="w-full" onClick={simulate} disabled={loading}>
                {loading ? "Simulando..." : "Simular"}
              </Button>
            </CardContent>
          </Card>
        </AnimatedItem>

        <AnimatedItem>
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Projeção</CardTitle>
                {result && result.savings !== 0 && (
                  <span className={`text-sm font-bold ${result.savings > 0 ? "text-emerald-500" : "text-red-500"}`}>
                    {result.savings > 0 ? "+" : ""}{formatCurrency(result.savings)} em {months} meses
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.1} />
                    <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line type="monotone" dataKey="Sem mudança" stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="Com mudança" stroke="hsl(256, 77%, 60%)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                  <p>Configure um cenário e clique em Simular</p>
                </div>
              )}
            </CardContent>
          </Card>
        </AnimatedItem>
      </div>
    </PageWrapper>
  );
}
