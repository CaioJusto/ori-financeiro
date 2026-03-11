"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useOrg } from "@/contexts/org-context";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, formatCurrencyShort } from "@/lib/format";
import { CustomTooltip } from "@/components/chart-tooltip";
import { ArrowDownLeft, ArrowUpRight, Wallet, TrendingUp } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface DashboardStats {
  totalBalance: number;
  incomeThisMonth: number;
  expenseThisMonth: number;
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

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

const supabase = createClient();

export default function DashboardPage() {
  const { currentOrg } = useOrg();
  const [stats, setStats] = useState<DashboardStats>({
    totalBalance: 0,
    incomeThisMonth: 0,
    expenseThisMonth: 0,
    accountCount: 0,
  });
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [accountBalances, setAccountBalances] = useState<AccountBalance[]>([]);

  useEffect(() => {
    if (!currentOrg) return;

    async function loadStats() {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .split("T")[0];

      // Get last 6 months start date
      const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)
        .toISOString()
        .split("T")[0];

      const [accountsRes, transactionsThisMonthRes, transactionsHistoryRes] = await Promise.all([
        supabase
          .from("cash_accounts")
          .select("name, balance")
          .eq("organization_id", currentOrg!.id),
        supabase
          .from("transactions")
          .select("amount, type")
          .eq("organization_id", currentOrg!.id)
          .gte("date", startOfMonth),
        supabase
          .from("transactions")
          .select("amount, type, date")
          .eq("organization_id", currentOrg!.id)
          .gte("date", sixMonthsAgo)
          .order("date", { ascending: true }),
      ]);

      const accounts = (accountsRes.data as { name: string; balance: number }[]) ?? [];
      const transactions = (transactionsThisMonthRes.data as { amount: number; type: string }[]) ?? [];
      const history = (transactionsHistoryRes.data as { amount: number; type: string; date: string }[]) ?? [];

      setStats({
        totalBalance: accounts.reduce((sum, a) => sum + a.balance, 0),
        incomeThisMonth: transactions
          .filter((t) => t.type === "income")
          .reduce((sum, t) => sum + t.amount, 0),
        expenseThisMonth: transactions
          .filter((t) => t.type === "expense")
          .reduce((sum, t) => sum + Math.abs(t.amount), 0),
        accountCount: accounts.length,
      });

      setAccountBalances(accounts.filter((a) => a.balance !== 0));

      // Group by month
      const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
      const monthMap = new Map<string, { income: number; expense: number }>();

      // Initialize last 6 months
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        const label = `${monthNames[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`;
        monthMap.set(key, { income: 0, expense: 0 });
      }

      history.forEach((t) => {
        const key = t.date.slice(0, 7); // YYYY-MM
        const entry = monthMap.get(key);
        if (entry) {
          if (t.type === "income") {
            entry.income += t.amount;
          } else if (t.type === "expense") {
            entry.expense += Math.abs(t.amount);
          }
        }
      });

      const monthly: MonthlyData[] = [];
      monthMap.forEach((val, key) => {
        const [year, month] = key.split("-");
        const monthIdx = parseInt(month) - 1;
        monthly.push({
          month: `${monthNames[monthIdx]}/${year.slice(2)}`,
          income: val.income,
          expense: val.expense,
          net: val.income - val.expense,
        });
      });

      setMonthlyData(monthly);
    }

    loadStats();
  }, [currentOrg]);

  const netChange = stats.incomeThisMonth - stats.expenseThisMonth;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Visao geral das suas financas
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Total</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.totalBalance)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receitas (Mes)</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {formatCurrency(stats.incomeThisMonth)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas (Mes)</CardTitle>
            <ArrowDownLeft className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {formatCurrency(stats.expenseThisMonth)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resultado (Mes)</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netChange >= 0 ? "text-green-500" : "text-red-500"}`}>
              {formatCurrency(netChange)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Monthly Income vs Expense Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Receitas vs Despesas (6 meses)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tickFormatter={(v) => formatCurrencyShort(v)} className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="income" name="Receitas" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" name="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Net Balance Trend Line Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Resultado Liquido (6 meses)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tickFormatter={(v) => formatCurrencyShort(v)} className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="net"
                    name="Resultado"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: "#3b82f6", r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Account balances pie chart */}
      {accountBalances.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Saldo por Conta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={accountBalances}
                    dataKey="balance"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
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
      )}
    </div>
  );
}
