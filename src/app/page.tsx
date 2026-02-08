"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, formatDate } from "@/lib/utils";
import { DollarSign, TrendingUp, TrendingDown, Wallet, AlertTriangle, BarChart3, ArrowUpDown, Lightbulb, FileDown, Star, Settings2, GripVertical, Flame, Clock, PiggyBank, Activity, Calendar } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area, Brush } from "recharts";
import { DashboardSkeleton } from "@/components/dashboard-skeleton";
import { PageWrapper, AnimatedItem } from "@/components/page-wrapper";
import { CountUp } from "@/components/count-up";
import { Button } from "@/components/ui/button";
import { WelcomePage } from "@/components/welcome-page";
import { ActivityFeed } from "@/components/activity-feed";
import { DashboardWidgets } from "@/components/dashboard-widgets";

interface Insight {
  icon: string;
  title: string;
  description: string;
  type: "info" | "warning" | "success" | "tip";
}

interface DashboardData {
  totalBalance: number;
  totalIncome: number;
  totalExpense: number;
  accountBalances: { id: string; name: string; color: string; balance: number }[];
  monthlyData: { month: string; income: number; expense: number }[];
  categoryBreakdown: { name: string; color: string; total: number }[];
  recentTransactions: { id: string; description: string; amount: number; type: string; date: string; account: { name: string }; category: { name: string } }[];
  comparison: { currentMonthIncome: number; currentMonthExpense: number; previousMonthIncome: number; previousMonthExpense: number };
  projection: { dailyAvgExpense: number; projectedExpense: number; daysRemaining: number };
  bustedBudgets: { id: string; category: string; limit: number; spent: number }[];
}

const COLORS = [
  "hsl(256, 77%, 60%)", "hsl(217, 91%, 60%)", "hsl(142, 71%, 45%)", "hsl(24, 94%, 50%)",
  "hsl(330, 81%, 60%)", "hsl(189, 94%, 43%)", "hsl(256, 77%, 75%)", "hsl(217, 91%, 75%)",
];

function pctChange(current: number, previous: number): { value: string; positive: boolean } {
  if (previous === 0) return { value: current > 0 ? "+100%" : "0%", positive: current >= 0 };
  const pct = ((current - previous) / previous) * 100;
  return { value: `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`, positive: pct >= 0 };
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const PieTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 shadow-md">
      <p className="text-xs font-medium text-foreground">{payload[0].name}</p>
      <p className="text-xs text-muted-foreground">{formatCurrency(payload[0].value)}</p>
    </div>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const renderLegend = (props: any) => {
  const { payload } = props;
  return (
    <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-4">
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-xs text-muted-foreground">{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

const ALL_WIDGETS = [
  { id: "advancedMetrics", label: "Métricas Avançadas" },
  { id: "metrics", label: "Cards de Métricas" },
  { id: "favorites", label: "Favoritos" },
  { id: "balanceHistory", label: "Evolução do Patrimônio" },
  { id: "charts", label: "Gráficos" },
  { id: "insights", label: "Insights" },
  { id: "comparison", label: "Comparativo / Projeção / Orçamentos" },
  { id: "accountBalances", label: "Saldos por Conta" },
  { id: "recentTransactions", label: "Transações Recentes" },
];

function loadWidgetPrefs(): { order: string[]; hidden: string[] } {
  try {
    const saved = localStorage.getItem("ori-dashboard-widgets");
    if (saved) return JSON.parse(saved);
  } catch {}
  return { order: ALL_WIDGETS.map(w => w.id), hidden: [] };
}

function saveWidgetPrefs(prefs: { order: string[]; hidden: string[] }) {
  localStorage.setItem("ori-dashboard-widgets", JSON.stringify(prefs));
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [insightsData, setInsights] = useState<Insight[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [favorites, setFavorites] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [balanceHistory, setBalanceHistory] = useState<any[]>([]);
  const [widgetPrefs, setWidgetPrefs] = useState(loadWidgetPrefs);
  const [customizing, setCustomizing] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [advMetrics, setAdvMetrics] = useState<any>(null);
  const [hasAccounts, setHasAccounts] = useState<boolean | null>(null);
  const [period, setPeriod] = useState("current");

  const loadDashboard = async () => {
    const params = period !== "current" ? `?period=${period}` : "";
    const cacheBust = `${params ? "&" : "?"}t=${Date.now()}`;
    const r = await fetch(`/api/dashboard${params}${cacheBust}`);
    const d = await r.json();
    setData(d);
    const has = !!(d.accountBalances && d.accountBalances.length > 0);
    setHasAccounts(has);
    fetch("/api/insights").then((r) => r.json()).then(d => setInsights(d));
    fetch("/api/favorites").then((r) => r.json()).then(setFavorites);
    fetch("/api/balance-history?days=30").then((r) => r.json()).then(setBalanceHistory);
    fetch("/api/balance-history", { method: "POST" });
    fetch("/api/metrics").then(r => r.json()).then(setAdvMetrics);
  };

  useEffect(() => {
    document.title = "Dashboard | Ori Financeiro";
    loadDashboard();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  const insights = insightsData;
  const toggleWidget = (id: string) => {
    const newPrefs = { ...widgetPrefs };
    if (newPrefs.hidden.includes(id)) newPrefs.hidden = newPrefs.hidden.filter(h => h !== id);
    else newPrefs.hidden = [...newPrefs.hidden, id];
    setWidgetPrefs(newPrefs); saveWidgetPrefs(newPrefs);
  };

  const onDragStart = (id: string) => setDragId(id);
  const onDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!dragId || dragId === targetId) return;
    const order = [...widgetPrefs.order];
    const fromIdx = order.indexOf(dragId);
    const toIdx = order.indexOf(targetId);
    if (fromIdx === -1 || toIdx === -1) return;
    order.splice(fromIdx, 1);
    order.splice(toIdx, 0, dragId);
    const newPrefs = { ...widgetPrefs, order };
    setWidgetPrefs(newPrefs); saveWidgetPrefs(newPrefs);
  };

  if (!data) return <DashboardSkeleton />;

  if (hasAccounts === false) {
    return <WelcomePage onAccountCreated={loadDashboard} />;
  }

  const incomeChange = pctChange(data.comparison.currentMonthIncome, data.comparison.previousMonthIncome);
  const expenseChange = pctChange(data.comparison.currentMonthExpense, data.comparison.previousMonthExpense);
  const balanceChange = pctChange(
    data.comparison.currentMonthIncome - data.comparison.currentMonthExpense,
    data.comparison.previousMonthIncome - data.comparison.previousMonthExpense
  );

  const isVisible = (id: string) => !widgetPrefs.hidden.includes(id);

  return (
    <PageWrapper>
      <AnimatedItem>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
            <p className="text-sm text-muted-foreground">Visão geral das suas finanças</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[180px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current">Este mês</SelectItem>
                <SelectItem value="last">Mês passado</SelectItem>
                <SelectItem value="last3">Últimos 3 meses</SelectItem>
                <SelectItem value="last6">Últimos 6 meses</SelectItem>
                <SelectItem value="year">Este ano</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => setCustomizing(!customizing)}>
              <Settings2 className="h-4 w-4 mr-2" />{customizing ? "Fechar" : "Customizar"}
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.open("/api/export/pdf", "_blank")}>
              <FileDown className="h-4 w-4 mr-2" />Exportar PDF
            </Button>
          </div>
        </div>
      </AnimatedItem>
      <AnimatedItem><Separator /></AnimatedItem>

      {customizing && (
        <AnimatedItem>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm font-medium mb-3">Widgets do Dashboard</p>
              <p className="text-xs text-muted-foreground mb-3">Arraste para reordenar, toggle para mostrar/ocultar</p>
              <div className="space-y-2">
                {widgetPrefs.order.map(id => {
                  const w = ALL_WIDGETS.find(w => w.id === id);
                  if (!w) return null;
                  return (
                    <div key={id} draggable onDragStart={() => onDragStart(id)} onDragOver={e => onDragOver(e, id)} onDragEnd={() => setDragId(null)}
                      className="flex items-center gap-3 p-2 rounded-md border bg-card cursor-grab active:cursor-grabbing hover:bg-muted/50">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm flex-1">{w.label}</span>
                      <Switch checked={!widgetPrefs.hidden.includes(id)} onCheckedChange={() => toggleWidget(id)} />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </AnimatedItem>
      )}

      {/* Advanced Metrics */}
      {isVisible("advancedMetrics") && advMetrics && (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <AnimatedItem>
            <Card className="border bg-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Burn Rate</p>
                  <Flame className="h-4 w-4 text-orange-500" />
                </div>
                <p className="text-2xl font-bold mt-2"><CountUp value={advMetrics.burnRate} /></p>
                <p className="text-xs mt-1 text-muted-foreground">por dia</p>
              </CardContent>
            </Card>
          </AnimatedItem>
          <AnimatedItem>
            <Card className="border bg-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Runway</p>
                  <Clock className="h-4 w-4 text-blue-500" />
                </div>
                <p className="text-2xl font-bold mt-2">{advMetrics.runwayDays != null ? `${advMetrics.runwayDays}d` : "∞"}</p>
                <p className="text-xs mt-1 text-muted-foreground">dias de saldo restante</p>
              </CardContent>
            </Card>
          </AnimatedItem>
          <AnimatedItem>
            <Card className="border bg-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Savings Rate</p>
                  <PiggyBank className="h-4 w-4 text-emerald-500" />
                </div>
                <p className="text-2xl font-bold mt-2">{advMetrics.savingsRate.toFixed(1)}%</p>
                <p className={`text-xs mt-1 ${advMetrics.savingsRate >= 20 ? "text-emerald-500" : advMetrics.savingsRate >= 0 ? "text-amber-500" : "text-red-500"}`}>
                  {advMetrics.savingsRate >= 20 ? "Excelente" : advMetrics.savingsRate >= 0 ? "Pode melhorar" : "Negativo"}
                </p>
              </CardContent>
            </Card>
          </AnimatedItem>
          <AnimatedItem>
            <Card className="border bg-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Net Worth Trend</p>
                  <Activity className="h-4 w-4 text-violet-500" />
                </div>
                <div className="mt-2 h-10">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={advMetrics.netWorthTrend}>
                      <Line type="monotone" dataKey="value" stroke="hsl(256, 77%, 60%)" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-xs mt-1 text-muted-foreground">últimos 6 meses</p>
              </CardContent>
            </Card>
          </AnimatedItem>
        </div>
      )}

      {/* Metric Cards */}
      {isVisible("metrics") && <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <AnimatedItem>
          <Card className="border bg-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Saldo Total</p>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold mt-2"><CountUp value={data.totalBalance} /></p>
              <div className="flex items-center gap-2 mt-1">
                <p className={`text-xs ${balanceChange.positive ? "text-emerald-500" : "text-red-500"}`}>
                  {balanceChange.value} vs mês anterior
                </p>
              </div>
              {data.monthlyData.length > 1 && (
                <div className="mt-2 h-8">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.monthlyData.map(m => ({ v: m.income - m.expense }))}>
                      <Line type="monotone" dataKey="v" stroke="hsl(256, 77%, 60%)" strokeWidth={1.5} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </AnimatedItem>
        <AnimatedItem>
          <Card className="border bg-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Receitas</p>
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="text-2xl font-bold mt-2"><CountUp value={data.totalIncome} /></p>
              <p className={`text-xs mt-1 ${incomeChange.positive ? "text-emerald-500" : "text-red-500"}`}>
                {incomeChange.value} vs mês anterior
              </p>
              {data.monthlyData.length > 1 && (
                <div className="mt-2 h-8">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.monthlyData.map(m => ({ v: m.income }))}>
                      <Line type="monotone" dataKey="v" stroke="hsl(142, 71%, 45%)" strokeWidth={1.5} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </AnimatedItem>
        <AnimatedItem>
          <Card className="border bg-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Despesas</p>
                <TrendingDown className="h-4 w-4 text-red-500" />
              </div>
              <p className="text-2xl font-bold mt-2"><CountUp value={data.totalExpense} /></p>
              <p className={`text-xs mt-1 ${!expenseChange.positive ? "text-emerald-500" : "text-red-500"}`}>
                {expenseChange.value} vs mês anterior
              </p>
              {data.monthlyData.length > 1 && (
                <div className="mt-2 h-8">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.monthlyData.map(m => ({ v: m.expense }))}>
                      <Line type="monotone" dataKey="v" stroke="hsl(0, 84%, 60%)" strokeWidth={1.5} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </AnimatedItem>
        <AnimatedItem>
          <Card className="border bg-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Contas</p>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold mt-2">{data.accountBalances.length}</p>
              <p className="text-xs mt-1 text-muted-foreground">contas ativas</p>
            </CardContent>
          </Card>
        </AnimatedItem>
      </div>}

      {/* Favorites */}
      {isVisible("favorites") && favorites && (favorites.accounts?.length > 0 || favorites.transactions?.length > 0 || favorites.categories?.length > 0) && (
        <AnimatedItem>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                Favoritos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 flex-wrap">
                {favorites.accounts?.map((a: { id: string; name: string; color: string; balance: number }) => (
                  <div key={a.id} className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-muted/30">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: a.color }} />
                    <span className="text-sm font-medium">{a.name}</span>
                    <span className={`text-sm font-bold ${a.balance >= 0 ? "text-emerald-500" : "text-red-500"}`}>{formatCurrency(a.balance)}</span>
                  </div>
                ))}
                {favorites.categories?.map((c: { id: string; name: string; color: string }) => (
                  <div key={c.id} className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-muted/30">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                    <span className="text-sm">{c.name}</span>
                  </div>
                ))}
                {favorites.transactions?.map((t: { id: string; description: string; amount: number; type: string }) => (
                  <div key={t.id} className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-muted/30">
                    <span className="text-sm">{t.description}</span>
                    <span className={`text-sm font-bold ${t.type === "income" ? "text-emerald-500" : "text-red-500"}`}>
                      {t.type === "income" ? "+" : "-"}{formatCurrency(t.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </AnimatedItem>
      )}

      {/* Balance History */}
      {isVisible("balanceHistory") && balanceHistory.length > 0 && (
        <AnimatedItem>
          <Card>
            <CardHeader><CardTitle className="text-sm font-medium">Evolução do Patrimônio</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={(() => {
                  const grouped = new Map<string, number>();
                  for (const h of balanceHistory) {
                    const d = new Date(h.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
                    grouped.set(d, (grouped.get(d) || 0) + h.balance);
                  }
                  return Array.from(grouped.entries()).map(([date, total]) => ({ date, total }));
                })()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.1} />
                  <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="total" name="Patrimônio" stroke="hsl(256, 77%, 60%)" fill="hsl(256, 77%, 60%)" fillOpacity={0.1} strokeWidth={2} animationDuration={1200} />
                  <Brush dataKey="date" height={20} stroke="hsl(var(--muted-foreground))" fill="hsl(var(--muted))" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </AnimatedItem>
      )}

      {/* Charts */}
      {isVisible("charts") && <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <AnimatedItem>
          <Card>
            <CardHeader><CardTitle className="text-sm font-medium">Receitas vs Despesas</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data.monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.1} />
                  <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted))", fillOpacity: 0.3 }} />
                  <Bar dataKey="income" name="Receitas" fill="hsl(256, 77%, 60%)" radius={[4, 4, 0, 0]} animationDuration={800} />
                  <Bar dataKey="expense" name="Despesas" fill="hsl(var(--muted-foreground))" fillOpacity={0.4} radius={[4, 4, 0, 0]} animationDuration={800} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </AnimatedItem>

        <AnimatedItem>
          <Card>
            <CardHeader><CardTitle className="text-sm font-medium">Gastos por Categoria</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={data.categoryBreakdown} cx="50%" cy="45%" outerRadius={90} innerRadius={55} dataKey="total" nameKey="name" paddingAngle={2} label={false} labelLine={false}>
                    {data.categoryBreakdown.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} strokeWidth={0} />))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                  <Legend content={renderLegend} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </AnimatedItem>
      </div>}

      {/* Insights */}
      {isVisible("insights") && insights.length > 0 && (
        <AnimatedItem>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-amber-500" />
                Insights Financeiros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {insights.map((insight, i) => (
                  <div
                    key={i}
                    className={`rounded-lg border p-4 ${
                      insight.type === "warning" ? "border-amber-500/30 bg-amber-500/5" :
                      insight.type === "success" ? "border-emerald-500/30 bg-emerald-500/5" :
                      insight.type === "tip" ? "border-violet-500/30 bg-violet-500/5" :
                      "border-border bg-muted/30"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-xl">{insight.icon}</span>
                      <div>
                        <p className="text-sm font-medium">{insight.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">{insight.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </AnimatedItem>
      )}

      {/* Comparison, Projection, Busted Budgets */}
      {isVisible("comparison") && <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <AnimatedItem>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">Comparativo Mensal</p>
                <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Receitas (atual)</span><span className="font-medium text-emerald-600 dark:text-emerald-400">{formatCurrency(data.comparison.currentMonthIncome)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Receitas (anterior)</span><span className="text-muted-foreground">{formatCurrency(data.comparison.previousMonthIncome)}</span></div>
                <Separator />
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Despesas (atual)</span><span className="font-medium text-red-600 dark:text-red-400">{formatCurrency(data.comparison.currentMonthExpense)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Despesas (anterior)</span><span className="text-muted-foreground">{formatCurrency(data.comparison.previousMonthExpense)}</span></div>
              </div>
            </CardContent>
          </Card>
        </AnimatedItem>

        <AnimatedItem>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">Projeção do Mês</p>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Média diária</span><span className="font-medium">{formatCurrency(data.projection.dailyAvgExpense)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Projeção total</span><span className="font-medium text-red-600 dark:text-red-400">{formatCurrency(data.projection.projectedExpense)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Dias restantes</span><span className="font-medium">{data.projection.daysRemaining}</span></div>
              </div>
            </CardContent>
          </Card>
        </AnimatedItem>

        <AnimatedItem>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">Orçamentos</p>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </div>
              {data.bustedBudgets.length === 0 ? (
                <div className="flex items-center gap-2"><Badge variant="success">OK</Badge><span className="text-sm text-muted-foreground">Tudo dentro do limite</span></div>
              ) : (
                <div className="space-y-2">
                  {data.bustedBudgets.map((b) => (
                    <div key={b.id} className="flex justify-between text-sm"><span className="text-muted-foreground">{b.category}</span><Badge variant="danger">{formatCurrency(b.spent)} / {formatCurrency(b.limit)}</Badge></div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </AnimatedItem>
      </div>}

      {/* Account Balances */}
      {isVisible("accountBalances") && data.accountBalances.length > 0 && (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {data.accountBalances.map((acc) => {
            const accHistory = balanceHistory.filter((h: { accountId: string }) => h.accountId === acc.id).map((h: { balance: number }) => ({ v: h.balance }));
            return (
              <AnimatedItem key={acc.id}>
                <Card className="transition-colors hover:border-primary/50">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: acc.color }} />
                      <p className="text-sm font-medium">{acc.name}</p>
                    </div>
                    <p className={`text-xl font-bold ${acc.balance >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                      {formatCurrency(acc.balance)}
                    </p>
                    {accHistory.length > 1 && (
                      <div className="mt-2 h-8">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={accHistory}>
                            <Line type="monotone" dataKey="v" stroke={acc.color} strokeWidth={1.5} dot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </AnimatedItem>
            );
          })}
        </div>
      )}

      {/* Dashboard Widgets - Payables, Recurring, Goals, Calendar */}
      <AnimatedItem>
        <DashboardWidgets />
      </AnimatedItem>

      {/* Activity Feed */}
      <AnimatedItem>
        <ActivityFeed limit={8} />
      </AnimatedItem>

      {/* Recent Transactions */}
      {isVisible("recentTransactions") && <AnimatedItem>
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Transações Recentes</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-border/50 hover:bg-transparent">
                    <TableHead className="text-xs text-muted-foreground font-medium">Descrição</TableHead>
                    <TableHead className="text-xs text-muted-foreground font-medium">Categoria</TableHead>
                    <TableHead className="text-xs text-muted-foreground font-medium">Data</TableHead>
                    <TableHead className="text-xs text-muted-foreground font-medium text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.recentTransactions.map((t) => (
                    <TableRow key={t.id} className="border-b border-border/50 hover:bg-muted/50">
                      <TableCell className="text-sm font-medium">{t.description}</TableCell>
                      <TableCell><Badge variant="secondary" className="text-xs">{t.category.name}</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDate(t.date)}</TableCell>
                      <TableCell className={`text-sm font-semibold text-right ${t.type === "income" ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                        {t.type === "income" ? "+" : "-"}{formatCurrency(t.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </AnimatedItem>}
    </PageWrapper>
  );
}
