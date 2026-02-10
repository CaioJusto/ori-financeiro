"use client";
import { useEffect, useState, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, formatDate } from "@/lib/utils";
import { DollarSign, TrendingUp, TrendingDown, Wallet, AlertTriangle, BarChart3, ArrowUpDown, Lightbulb, FileDown, Star, Settings2, GripVertical, Flame, Clock, PiggyBank, Activity, Calendar, X, Plus } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area, Brush } from "recharts";
import { DashboardSkeleton } from "@/components/dashboard-skeleton";
import { CountUp } from "@/components/count-up";
import { Button } from "@/components/ui/button";
import { WelcomePage } from "@/components/welcome-page";
import { ActivityFeed } from "@/components/activity-feed";
import { DashboardWidgets } from "@/components/dashboard-widgets";
import { Responsive, useContainerWidth, type LayoutItem, type ResponsiveLayouts as Layouts } from "react-grid-layout";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ResponsiveGrid = Responsive as any;
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

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

interface WidgetDef {
  id: string;
  label: string;
  defaultLayout: { w: number; h: number; minW?: number; minH?: number };
}

const ALL_WIDGETS: WidgetDef[] = [
  { id: "advancedMetrics", label: "Métricas Avançadas", defaultLayout: { w: 12, h: 4, minW: 6, minH: 3 } },
  { id: "metrics", label: "Cards de Métricas", defaultLayout: { w: 12, h: 5, minW: 6, minH: 4 } },
  { id: "favorites", label: "Favoritos", defaultLayout: { w: 12, h: 4, minW: 4, minH: 3 } },
  { id: "balanceHistory", label: "Evolução do Patrimônio", defaultLayout: { w: 12, h: 7, minW: 6, minH: 5 } },
  { id: "charts", label: "Gráficos", defaultLayout: { w: 12, h: 8, minW: 6, minH: 6 } },
  { id: "insights", label: "Insights", defaultLayout: { w: 12, h: 6, minW: 4, minH: 4 } },
  { id: "comparison", label: "Comparativo / Projeção / Orçamentos", defaultLayout: { w: 12, h: 6, minW: 6, minH: 5 } },
  { id: "accountBalances", label: "Saldos por Conta", defaultLayout: { w: 12, h: 5, minW: 4, minH: 4 } },
  { id: "dashboardWidgets", label: "Contas, Recorrentes, Metas", defaultLayout: { w: 12, h: 6, minW: 6, minH: 4 } },
  { id: "activityFeed", label: "Atividade Recente", defaultLayout: { w: 12, h: 6, minW: 4, minH: 4 } },
  { id: "recentTransactions", label: "Transações Recentes", defaultLayout: { w: 12, h: 7, minW: 6, minH: 5 } },
];

function buildDefaultLayouts(): Layouts {
  let y = 0;
  const lg: LayoutItem[] = ALL_WIDGETS.map((w) => {
    const item: LayoutItem = { i: w.id, x: 0, y, w: w.defaultLayout.w, h: w.defaultLayout.h, minW: w.defaultLayout.minW, minH: w.defaultLayout.minH };
    y += w.defaultLayout.h;
    return item;
  });

  let yMd = 0;
  const md: LayoutItem[] = ALL_WIDGETS.map((w) => {
    const item: LayoutItem = { i: w.id, x: 0, y: yMd, w: Math.min(w.defaultLayout.w, 10), h: w.defaultLayout.h, minW: Math.min(w.defaultLayout.minW || 4, 10), minH: w.defaultLayout.minH };
    yMd += w.defaultLayout.h;
    return item;
  });

  let ySm = 0;
  const sm: LayoutItem[] = ALL_WIDGETS.map((w) => {
    const item: LayoutItem = { i: w.id, x: 0, y: ySm, w: 6, h: w.defaultLayout.h, minW: Math.min(w.defaultLayout.minW || 4, 6), minH: w.defaultLayout.minH };
    ySm += w.defaultLayout.h;
    return item;
  });

  return { lg, md, sm };
}

interface SavedLayout {
  layouts: Layouts;
  hiddenWidgets: string[];
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [insightsData, setInsights] = useState<Insight[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [favorites, setFavorites] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [balanceHistory, setBalanceHistory] = useState<any[]>([]);
  const [customizing, setCustomizing] = useState(false);
  const { width: gridWidth, containerRef: gridContainerRef } = useContainerWidth({ initialWidth: 1200 });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [advMetrics, setAdvMetrics] = useState<any>(null);
  const [hasAccounts, setHasAccounts] = useState<boolean | null>(null);
  const [period, setPeriod] = useState("current");
  const [layouts, setLayouts] = useState<Layouts>(buildDefaultLayouts);
  const [hiddenWidgets, setHiddenWidgets] = useState<string[]>([]);
  const [layoutLoaded, setLayoutLoaded] = useState(false);

  // Load saved layout from API
  useEffect(() => {
    fetch("/api/dashboard-layout")
      .then((r) => r.json())
      .then((saved: SavedLayout | null) => {
        if (saved && saved.layouts) {
          setLayouts(saved.layouts);
          setHiddenWidgets(saved.hiddenWidgets || []);
        }
        setLayoutLoaded(true);
      })
      .catch(() => setLayoutLoaded(true));
  }, []);

  const saveLayout = useCallback((newLayouts: Layouts, newHidden: string[]) => {
    const payload: SavedLayout = { layouts: newLayouts, hiddenWidgets: newHidden };
    fetch("/api/dashboard-layout", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => {});
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onLayoutChange = useCallback((_currentLayout: any, allLayouts: any) => {
    setLayouts(allLayouts);
    saveLayout(allLayouts, hiddenWidgets);
  }, [hiddenWidgets, saveLayout]);

  const removeWidget = useCallback((id: string) => {
    const newHidden = [...hiddenWidgets, id];
    setHiddenWidgets(newHidden);
    saveLayout(layouts, newHidden);
  }, [hiddenWidgets, layouts, saveLayout]);

  const addWidget = useCallback((id: string) => {
    const newHidden = hiddenWidgets.filter((h) => h !== id);
    setHiddenWidgets(newHidden);
    saveLayout(layouts, newHidden);
  }, [hiddenWidgets, layouts, saveLayout]);

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

  const visibleWidgets = useMemo(() => ALL_WIDGETS.filter((w) => !hiddenWidgets.includes(w.id)), [hiddenWidgets]);
  const removedWidgets = useMemo(() => ALL_WIDGETS.filter((w) => hiddenWidgets.includes(w.id)), [hiddenWidgets]);

  if (!data || !layoutLoaded) return <DashboardSkeleton />;

  if (hasAccounts === false) {
    return <WelcomePage onAccountCreated={loadDashboard} />;
  }

  const incomeChange = pctChange(data.comparison.currentMonthIncome, data.comparison.previousMonthIncome);
  const expenseChange = pctChange(data.comparison.currentMonthExpense, data.comparison.previousMonthExpense);
  const balanceChange = pctChange(
    data.comparison.currentMonthIncome - data.comparison.currentMonthExpense,
    data.comparison.previousMonthIncome - data.comparison.previousMonthExpense
  );

  const renderWidget = (id: string) => {
    switch (id) {
      case "advancedMetrics":
        if (!advMetrics) return null;
        return (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 h-full">
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
          </div>
        );

      case "metrics":
        return (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 h-full">
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
          </div>
        );

      case "favorites":
        if (!favorites || !(favorites.accounts?.length > 0 || favorites.transactions?.length > 0 || favorites.categories?.length > 0)) return null;
        return (
          <Card className="h-full overflow-auto">
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
        );

      case "balanceHistory":
        if (balanceHistory.length === 0) return null;
        return (
          <Card className="h-full overflow-hidden">
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
        );

      case "charts":
        return (
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-2 h-full">
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
          </div>
        );

      case "insights":
        if (insights.length === 0) return null;
        return (
          <Card className="h-full overflow-auto">
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
        );

      case "comparison":
        return (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-3 h-full">
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
          </div>
        );

      case "accountBalances":
        if (data.accountBalances.length === 0) return null;
        return (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 h-full">
            {data.accountBalances.map((acc) => {
              const accHistory = balanceHistory.filter((h: { accountId: string }) => h.accountId === acc.id).map((h: { balance: number }) => ({ v: h.balance }));
              return (
                <Card key={acc.id} className="transition-colors hover:border-primary/50">
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
              );
            })}
          </div>
        );

      case "dashboardWidgets":
        return <DashboardWidgets />;

      case "activityFeed":
        return <ActivityFeed limit={8} />;

      case "recentTransactions":
        return (
          <Card className="h-full overflow-auto">
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
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
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
          <Button variant={customizing ? "default" : "outline"} size="sm" onClick={() => setCustomizing(!customizing)}>
            <Settings2 className="h-4 w-4 mr-2" />{customizing ? "Salvar Layout" : "Customizar"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.open("/api/export/pdf", "_blank")}>
            <FileDown className="h-4 w-4 mr-2" />Exportar PDF
          </Button>
        </div>
      </div>
      <Separator />

      {/* Edit Mode Overlay Banner */}
      {customizing && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
          {/* Removed widgets chips */}
          {removedWidgets.length > 0 && (
            <Card className="border-dashed border-2 border-primary/40 bg-primary/5 backdrop-blur-sm">
              <CardContent className="p-4">
                <p className="text-sm font-medium mb-3 flex items-center gap-2 text-primary">
                  <Plus className="h-4 w-4" />
                  Widgets Ocultos — clique para adicionar
                </p>
                <div className="flex gap-2 flex-wrap">
                  {removedWidgets.map((w) => (
                    <button
                      key={w.id}
                      onClick={() => addWidget(w.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-sm text-primary hover:bg-primary/20 hover:border-primary/50 transition-all duration-200 cursor-pointer"
                    >
                      <Plus className="h-3 w-3" />
                      {w.label}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Grid Layout */}
      <div ref={gridContainerRef} className={`transition-all duration-300 ${customizing ? "bg-muted/30 rounded-xl p-2 -m-2 ring-1 ring-primary/10" : ""}`}>
        <ResponsiveGrid
          className={`layout ${customizing ? "editing" : ""}`}
          layouts={layouts}
          width={gridWidth}
          breakpoints={{ lg: 1200, md: 996, sm: 768 }}
          cols={{ lg: 12, md: 10, sm: 6 }}
          rowHeight={30}
          isDraggable={customizing}
          isResizable={customizing}
          onLayoutChange={onLayoutChange}
          draggableHandle=".drag-handle"
          useCSSTransforms={true}
          compactType="vertical"
          margin={[16, 16] as const}
        >
          {visibleWidgets.map((widget) => (
            <div key={widget.id} className={`relative group ${customizing ? "dashboard-widget-editing" : ""}`}>
              {customizing && (
                <>
                  {/* Drag handle bar — always visible */}
                  <div className="drag-handle absolute top-0 left-0 right-0 z-20 flex items-center justify-center gap-1 h-7 cursor-grab active:cursor-grabbing rounded-t-lg bg-primary/10 hover:bg-primary/20 border-b border-dashed border-primary/30 transition-colors">
                    <GripVertical className="h-3.5 w-3.5 text-primary/60" />
                    <span className="text-[10px] font-medium text-primary/60 select-none">{widget.label}</span>
                    <GripVertical className="h-3.5 w-3.5 text-primary/60" />
                  </div>
                  {/* Remove button — always visible */}
                  <button
                    onClick={() => removeWidget(widget.id)}
                    className="absolute top-1 right-1.5 z-30 p-1 rounded-full bg-destructive/90 text-destructive-foreground hover:bg-destructive hover:scale-110 transition-all shadow-sm"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </>
              )}
              <div className={`h-full transition-all duration-200 ${customizing ? "border-2 border-dashed border-primary/30 rounded-lg pt-7 hover:border-primary/50 hover:shadow-md" : ""}`}>
                {renderWidget(widget.id)}
              </div>
            </div>
          ))}
        </ResponsiveGrid>
      </div>
    </div>
  );
}
