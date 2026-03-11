"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrg } from "@/contexts/org-context";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, formatCurrencyShort } from "@/lib/format";
import { CustomTooltip } from "@/components/chart-tooltip";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
  TrendingUp,
  CalendarClock,
  Tag,
  BarChart3,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────

type PeriodKey = "7d" | "30d" | "3m" | "6m" | "1y" | "custom";

interface PeriodOption {
  label: string;
  key: PeriodKey;
}

interface DashboardStats {
  totalBalance: number;
  income: number;
  expense: number;
  accountCount: number;
}

interface MonthlyData {
  month: string;
  income: number;
  expense: number;
  net: number;
}

interface AccountBalance {
  name: string;
  balance: number;
}

interface CategorySpend {
  name: string;
  amount: number;
  color: string;
}

interface UpcomingBill {
  id: string;
  description: string;
  amount: number;
  next_date: string;
  type: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

const PERIOD_OPTIONS: PeriodOption[] = [
  { label: "7 dias", key: "7d" },
  { label: "30 dias", key: "30d" },
  { label: "3 meses", key: "3m" },
  { label: "6 meses", key: "6m" },
  { label: "1 ano", key: "1y" },
  { label: "Personalizado", key: "custom" },
];

const MONTH_NAMES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

const supabase = createClient();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDateRange(period: PeriodKey, customFrom: string, customTo: string): { from: string; to: string } {
  const now = new Date();
  const toDate = now.toISOString().split("T")[0];

  if (period === "custom") {
    return { from: customFrom || toDate, to: customTo || toDate };
  }

  const from = new Date(now);
  if (period === "7d") from.setDate(from.getDate() - 7);
  else if (period === "30d") from.setDate(from.getDate() - 30);
  else if (period === "3m") from.setMonth(from.getMonth() - 3);
  else if (period === "6m") from.setMonth(from.getMonth() - 6);
  else if (period === "1y") from.setFullYear(from.getFullYear() - 1);

  return { from: from.toISOString().split("T")[0], to: toDate };
}

function getPreviousRange(from: string, to: string): { from: string; to: string } {
  const fromDate = new Date(from);
  const toDate = new Date(to);
  const diffMs = toDate.getTime() - fromDate.getTime();

  const prevTo = new Date(fromDate.getTime() - 1);
  const prevFrom = new Date(prevTo.getTime() - diffMs);

  return {
    from: prevFrom.toISOString().split("T")[0],
    to: prevTo.toISOString().split("T")[0],
  };
}

function calcVariation(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return ((current - previous) / Math.abs(previous)) * 100;
}

function VariationBadge({ value, invertColors = false }: { value: number | null; invertColors?: boolean }) {
  if (value === null) return null;
  const positive = invertColors ? value <= 0 : value >= 0;
  const arrow = value >= 0 ? "↑" : "↓";
  return (
    <span className={`text-xs font-medium ${positive ? "text-green-500" : "text-red-500"}`}>
      {arrow}{Math.abs(value).toFixed(1)}%
    </span>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function StatCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-4 rounded" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-36 mb-1" />
        <Skeleton className="h-3 w-20" />
      </CardContent>
    </Card>
  );
}

function ChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-4 w-48" />
      </CardHeader>
      <CardContent>
        <Skeleton className="w-full" style={{ height }} />
      </CardContent>
    </Card>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { currentOrg } = useOrg();

  // Period state
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodKey>("30d");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  // Data state
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({ totalBalance: 0, income: 0, expense: 0, accountCount: 0 });
  const [prevStats, setPrevStats] = useState<DashboardStats>({ totalBalance: 0, income: 0, expense: 0, accountCount: 0 });
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [accountBalances, setAccountBalances] = useState<AccountBalance[]>([]);
  const [topCategories, setTopCategories] = useState<CategorySpend[]>([]);
  const [upcomingBills, setUpcomingBills] = useState<UpcomingBill[]>([]);

  const loadDashboard = useCallback(async () => {
    if (!currentOrg) return;
    setLoading(true);

    const { from, to } = getDateRange(selectedPeriod, customFrom, customTo);
    const prev = getPreviousRange(from, to);
    const orgId = currentOrg.id;

    // Upcoming bills: next 7 days from today
    const today = new Date().toISOString().split("T")[0];
    const in7days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    const [
      accountsRes,
      txCurrentRes,
      txPrevRes,
      txHistoryRes,
      categoriesRes,
      txCategoriesRes,
      upcomingRes,
    ] = await Promise.all([
      supabase.from("cash_accounts").select("name, balance").eq("organization_id", orgId),
      supabase.from("transactions").select("amount, type").eq("organization_id", orgId).gte("date", from).lte("date", to),
      supabase.from("transactions").select("amount, type").eq("organization_id", orgId).gte("date", prev.from).lte("date", prev.to),
      // For chart: last 6 months always
      supabase.from("transactions").select("amount, type, date").eq("organization_id", orgId)
        .gte("date", (() => { const d = new Date(); d.setMonth(d.getMonth() - 5); d.setDate(1); return d.toISOString().split("T")[0]; })())
        .order("date", { ascending: true }),
      supabase.from("categories").select("id, name, icon").eq("organization_id", orgId),
      // expenses with category in current period
      supabase.from("transactions").select("amount, category_id").eq("organization_id", orgId)
        .eq("type", "expense").gte("date", from).lte("date", to).not("category_id", "is", null),
      supabase.from("recurring_transactions").select("id, description, amount, next_date, type")
        .eq("organization_id", orgId).eq("is_active", true).gte("next_date", today).lte("next_date", in7days).order("next_date", { ascending: true }),
    ]);

    // Accounts
    const accounts = (accountsRes.data as { name: string; balance: number }[]) ?? [];
    setAccountBalances(accounts.filter((a) => a.balance !== 0));

    // Current stats
    const txCurrent = (txCurrentRes.data as { amount: number; type: string }[]) ?? [];
    const currentIncome = txCurrent.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const currentExpense = txCurrent.filter((t) => t.type === "expense").reduce((s, t) => s + Math.abs(t.amount), 0);
    setStats({
      totalBalance: accounts.reduce((s, a) => s + a.balance, 0),
      income: currentIncome,
      expense: currentExpense,
      accountCount: accounts.length,
    });

    // Previous stats
    const txPrev = (txPrevRes.data as { amount: number; type: string }[]) ?? [];
    const prevIncome = txPrev.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const prevExpense = txPrev.filter((t) => t.type === "expense").reduce((s, t) => s + Math.abs(t.amount), 0);
    setPrevStats({
      totalBalance: 0,
      income: prevIncome,
      expense: prevExpense,
      accountCount: 0,
    });

    // Monthly chart data (last 6 months)
    const now = new Date();
    const monthMap = new Map<string, { income: number; expense: number }>();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthMap.set(key, { income: 0, expense: 0 });
    }
    ((txHistoryRes.data as { amount: number; type: string; date: string }[]) ?? []).forEach((t) => {
      const key = t.date.slice(0, 7);
      const entry = monthMap.get(key);
      if (entry) {
        if (t.type === "income") entry.income += t.amount;
        else if (t.type === "expense") entry.expense += Math.abs(t.amount);
      }
    });
    const monthly: MonthlyData[] = [];
    monthMap.forEach((val, key) => {
      const [year, month] = key.split("-");
      monthly.push({
        month: `${MONTH_NAMES[parseInt(month) - 1]}/${year.slice(2)}`,
        income: val.income,
        expense: val.expense,
        net: val.income - val.expense,
      });
    });
    setMonthlyData(monthly);

    // Top 5 categories
    const cats = (categoriesRes.data as { id: string; name: string; icon: string | null }[]) ?? [];
    const txCats = (txCategoriesRes.data as { amount: number; category_id: string }[]) ?? [];
    const catMap = new Map<string, number>();
    txCats.forEach((t) => {
      catMap.set(t.category_id, (catMap.get(t.category_id) ?? 0) + Math.abs(t.amount));
    });
    const top5: CategorySpend[] = Array.from(catMap.entries())
      .map(([id, amount], i) => ({
        name: cats.find((c) => c.id === id)?.name ?? "Sem nome",
        amount,
        color: COLORS[i % COLORS.length],
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
    setTopCategories(top5);

    // Upcoming bills
    setUpcomingBills((upcomingRes.data as UpcomingBill[]) ?? []);

    setLoading(false);
  }, [currentOrg, selectedPeriod, customFrom, customTo]);

  useEffect(() => {
    if (selectedPeriod !== "custom") {
      loadDashboard();
    }
  }, [loadDashboard, selectedPeriod]);

  // For custom, only load when both dates are filled
  useEffect(() => {
    if (selectedPeriod === "custom" && customFrom && customTo) {
      loadDashboard();
    }
  }, [loadDashboard, selectedPeriod, customFrom, customTo]);

  const netChange = stats.income - stats.expense;
  const prevNetChange = prevStats.income - prevStats.expense;

  const incomeVariation = calcVariation(stats.income, prevStats.income);
  const expenseVariation = calcVariation(stats.expense, prevStats.expense);
  const netVariation = calcVariation(netChange, prevNetChange);

  const maxCatAmount = topCategories[0]?.amount ?? 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral das suas finanças</p>
        </div>

        {/* Period selector */}
        <div className="flex flex-wrap items-center gap-2">
          {PERIOD_OPTIONS.map((opt) => (
            <Button
              key={opt.key}
              size="sm"
              variant={selectedPeriod === opt.key ? "default" : "outline"}
              onClick={() => setSelectedPeriod(opt.key)}
            >
              {opt.label}
            </Button>
          ))}
          {selectedPeriod === "custom" && (
            <div className="flex items-center gap-2 mt-2 sm:mt-0">
              <Input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="w-[140px] h-8 text-sm"
              />
              <span className="text-muted-foreground text-sm">até</span>
              <Input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="w-[140px] h-8 text-sm"
              />
            </div>
          )}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Saldo Total</CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats.totalBalance)}</div>
                <p className="text-xs text-muted-foreground mt-1">{stats.accountCount} conta(s)</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Receitas</CardTitle>
                <ArrowUpRight className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500">{formatCurrency(stats.income)}</div>
                <div className="flex items-center gap-1 mt-1">
                  <VariationBadge value={incomeVariation} />
                  {incomeVariation !== null && (
                    <span className="text-xs text-muted-foreground">vs período anterior</span>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Despesas</CardTitle>
                <ArrowDownLeft className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-500">{formatCurrency(stats.expense)}</div>
                <div className="flex items-center gap-1 mt-1">
                  <VariationBadge value={expenseVariation} invertColors />
                  {expenseVariation !== null && (
                    <span className="text-xs text-muted-foreground">vs período anterior</span>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Resultado</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${netChange >= 0 ? "text-green-500" : "text-red-500"}`}>
                  {formatCurrency(netChange)}
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <VariationBadge value={netVariation} />
                  {netVariation !== null && (
                    <span className="text-xs text-muted-foreground">vs período anterior</span>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Charts row */}
      <div className="grid gap-4 md:grid-cols-2">
        {loading ? (
          <>
            <ChartSkeleton />
            <ChartSkeleton />
          </>
        ) : (
          <>
            {/* Monthly Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Receitas vs Despesas (6 meses)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                      <YAxis tickFormatter={(v) => formatCurrencyShort(v)} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar dataKey="income" name="Receitas" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="expense" name="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Net AreaChart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Resultado Líquido (6 meses)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyData}>
                      <defs>
                        <linearGradient id="netGradientPos" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                      <YAxis tickFormatter={(v) => formatCurrencyShort(v)} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="net"
                        name="Resultado"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        fill="url(#netGradientPos)"
                        dot={{ fill: "#3b82f6", r: 4 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Bottom cards row */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Account balances pie */}
        {loading ? (
          <ChartSkeleton height={220} />
        ) : accountBalances.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Saldo por Conta</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={accountBalances}
                      dataKey="balance"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, value }) => `${name}: ${formatCurrencyShort(value)}`}
                    >
                      {accountBalances.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Saldo por Conta</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center h-[220px] text-center gap-3">
              <Wallet className="h-10 w-10 text-muted-foreground/40" />
              <div>
                <p className="text-sm font-medium">Nenhuma conta com saldo</p>
                <p className="text-xs text-muted-foreground mt-1">Adicione contas e transações para visualizar</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Top 5 categories */}
        {loading ? (
          <Card>
            <CardHeader><Skeleton className="h-4 w-40" /></CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="space-y-1">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-2 w-full" />
                </div>
              ))}
            </CardContent>
          </Card>
        ) : topCategories.length > 0 ? (
          <Card>
            <CardHeader className="flex flex-row items-center gap-2 pb-3">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Top 5 Categorias de Gastos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {topCategories.map((cat, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium truncate max-w-[60%]">{cat.name}</span>
                    <span className="text-muted-foreground font-mono text-xs">{formatCurrency(cat.amount)}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${(cat.amount / maxCatAmount) * 100}%`,
                        backgroundColor: cat.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader className="flex flex-row items-center gap-2 pb-3">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Top 5 Categorias de Gastos</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center h-[180px] text-center gap-3">
              <BarChart3 className="h-10 w-10 text-muted-foreground/40" />
              <div>
                <p className="text-sm font-medium">Sem dados de categorias</p>
                <p className="text-xs text-muted-foreground mt-1">Categorize suas despesas para ver o ranking</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upcoming bills */}
        {loading ? (
          <Card>
            <CardHeader><Skeleton className="h-4 w-44" /></CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex justify-between items-center">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </CardContent>
          </Card>
        ) : upcomingBills.length > 0 ? (
          <Card>
            <CardHeader className="flex flex-row items-center gap-2 pb-3">
              <CalendarClock className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Próximas Contas a Pagar (7 dias)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {upcomingBills.map((bill) => (
                <div key={bill.id} className="flex items-center justify-between py-1 border-b border-border/50 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{bill.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Intl.DateTimeFormat("pt-BR").format(new Date(bill.next_date + "T12:00:00"))}
                    </p>
                  </div>
                  <span className={`text-sm font-mono font-medium ml-2 ${bill.type === "expense" ? "text-red-500" : "text-green-500"}`}>
                    {formatCurrency(Math.abs(bill.amount))}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader className="flex flex-row items-center gap-2 pb-3">
              <CalendarClock className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Próximas Contas a Pagar (7 dias)</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center h-[180px] text-center gap-3">
              <CalendarClock className="h-10 w-10 text-muted-foreground/40" />
              <div>
                <p className="text-sm font-medium">Nenhuma conta nos próximos 7 dias</p>
                <p className="text-xs text-muted-foreground mt-1">Configure transações recorrentes para ver aqui</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
