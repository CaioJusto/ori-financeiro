"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useOrg } from "@/contexts/org-context";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, formatCurrencyShort } from "@/lib/format";
import { CustomTooltip } from "@/components/chart-tooltip";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

interface Transaction {
  id: string;
  amount: number;
  type: "income" | "expense" | "transfer";
  description: string;
  date: string;
  cash_account_id: string;
}

interface TagSummary {
  name: string;
  color: string;
  total: number;
}

interface AccountSummary {
  name: string;
  income: number;
  expense: number;
  net: number;
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];
const MONTH_NAMES = ["Janeiro", "Fevereiro", "Marco", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

export default function ReportsPage() {
  const { currentOrg } = useOrg();
  const supabase = createClient();
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth()); // 0-indexed
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<{ id: string; name: string }[]>([]);
  const [tags, setTags] = useState<{ id: string; name: string; color: string }[]>([]);
  const [txnTagMap, setTxnTagMap] = useState<Map<string, string[]>>(new Map());

  useEffect(() => {
    if (!currentOrg) return;
    loadReport();
  }, [currentOrg, year, month]);

  async function loadReport() {
    const orgId = currentOrg!.id;
    const startDate = `${year}-${String(month + 1).padStart(2, "0")}-01`;
    const endDate = month === 11
      ? `${year + 1}-01-01`
      : `${year}-${String(month + 2).padStart(2, "0")}-01`;

    const [txnRes, accountsRes, tagsRes] = await Promise.all([
      supabase
        .from("transactions")
        .select("id, amount, type, description, date, cash_account_id")
        .eq("organization_id", orgId)
        .gte("date", startDate)
        .lt("date", endDate)
        .order("date", { ascending: true }),
      supabase
        .from("cash_accounts")
        .select("id, name")
        .eq("organization_id", orgId),
      supabase
        .from("tags")
        .select("id, name, color")
        .eq("organization_id", orgId),
    ]);

    const txns = (txnRes.data as Transaction[]) ?? [];
    setTransactions(txns);
    setAccounts((accountsRes.data as { id: string; name: string }[]) ?? []);
    setTags((tagsRes.data as { id: string; name: string; color: string }[]) ?? []);

    // Load tag mappings
    const txnIds = txns.map((t) => t.id);
    if (txnIds.length > 0) {
      const { data: ttRaw } = await supabase
        .from("transaction_tags")
        .select("transaction_id, tag_id")
        .in("transaction_id", txnIds);

      const map = new Map<string, string[]>();
      ((ttRaw as { transaction_id: string; tag_id: string }[]) ?? []).forEach((tt) => {
        const existing = map.get(tt.transaction_id) ?? [];
        existing.push(tt.tag_id);
        map.set(tt.transaction_id, existing);
      });
      setTxnTagMap(map);
    } else {
      setTxnTagMap(new Map());
    }
  }

  // Summary calculations
  const totalIncome = useMemo(
    () => transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0),
    [transactions]
  );
  const totalExpense = useMemo(
    () => transactions.filter((t) => t.type === "expense").reduce((s, t) => s + Math.abs(t.amount), 0),
    [transactions]
  );

  // Daily breakdown for bar chart
  const dailyData = useMemo(() => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: { day: string; income: number; expense: number }[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      days.push({ day: String(d), income: 0, expense: 0 });
    }
    transactions.forEach((t) => {
      const dayNum = parseInt(t.date.split("-")[2]);
      const entry = days[dayNum - 1];
      if (entry) {
        if (t.type === "income") entry.income += t.amount;
        else if (t.type === "expense") entry.expense += Math.abs(t.amount);
      }
    });
    return days;
  }, [transactions, year, month]);

  // Tag breakdown for pie chart
  const tagSummary = useMemo(() => {
    const totals = new Map<string, number>();
    transactions
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        const tagIds = txnTagMap.get(t.id) ?? [];
        if (tagIds.length === 0) {
          totals.set("__none__", (totals.get("__none__") ?? 0) + Math.abs(t.amount));
        } else {
          tagIds.forEach((tagId) => {
            totals.set(tagId, (totals.get(tagId) ?? 0) + Math.abs(t.amount));
          });
        }
      });

    const result: TagSummary[] = [];
    totals.forEach((total, tagId) => {
      if (tagId === "__none__") {
        result.push({ name: "Sem tag", color: "#6b7280", total });
      } else {
        const tag = tags.find((t) => t.id === tagId);
        if (tag) result.push({ name: tag.name, color: tag.color, total });
      }
    });
    return result.sort((a, b) => b.total - a.total);
  }, [transactions, txnTagMap, tags]);

  // Account breakdown
  const accountSummary = useMemo(() => {
    const map = new Map<string, { income: number; expense: number }>();
    transactions.forEach((t) => {
      const entry = map.get(t.cash_account_id) ?? { income: 0, expense: 0 };
      if (t.type === "income") entry.income += t.amount;
      else if (t.type === "expense") entry.expense += Math.abs(t.amount);
      map.set(t.cash_account_id, entry);
    });

    const result: AccountSummary[] = [];
    map.forEach((val, accountId) => {
      const account = accounts.find((a) => a.id === accountId);
      result.push({
        name: account?.name ?? "Desconhecida",
        income: val.income,
        expense: val.expense,
        net: val.income - val.expense,
      });
    });
    return result;
  }, [transactions, accounts]);

  function prevMonth() {
    if (month === 0) {
      setYear((y) => y - 1);
      setMonth(11);
    } else {
      setMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (month === 11) {
      setYear((y) => y + 1);
      setMonth(0);
    } else {
      setMonth((m) => m + 1);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Relatorios</h1>
          <p className="text-muted-foreground">Resumo mensal detalhado</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-medium min-w-[160px] text-center">
            {MONTH_NAMES[month]} {year}
          </span>
          <Button variant="outline" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Receitas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{formatCurrency(totalIncome)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {transactions.filter((t) => t.type === "income").length} lancamentos
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Despesas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{formatCurrency(totalExpense)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {transactions.filter((t) => t.type === "expense").length} lancamentos
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Resultado do Mes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalIncome - totalExpense >= 0 ? "text-green-500" : "text-red-500"}`}>
              {formatCurrency(totalIncome - totalExpense)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {transactions.length} transacoes no total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Daily chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Movimentacao Diaria</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="day" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tickFormatter={(v) => formatCurrencyShort(v)} className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="income" name="Receitas" fill="#10b981" radius={[2, 2, 0, 0]} />
                <Bar dataKey="expense" name="Despesas" fill="#ef4444" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Expense by tag pie chart */}
        {tagSummary.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Despesas por Tag</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={tagSummary}
                      dataKey="total"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                    >
                      {tagSummary.map((entry, i) => (
                        <Cell key={i} fill={entry.color || COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Account breakdown table */}
        {accountSummary.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Resumo por Conta</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Conta</TableHead>
                    <TableHead className="text-right">Receitas</TableHead>
                    <TableHead className="text-right">Despesas</TableHead>
                    <TableHead className="text-right">Resultado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accountSummary.map((a) => (
                    <TableRow key={a.name}>
                      <TableCell className="font-medium">{a.name}</TableCell>
                      <TableCell className="text-right text-green-500">{formatCurrency(a.income)}</TableCell>
                      <TableCell className="text-right text-red-500">{formatCurrency(a.expense)}</TableCell>
                      <TableCell className={`text-right font-medium ${a.net >= 0 ? "text-green-500" : "text-red-500"}`}>
                        {formatCurrency(a.net)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Tag breakdown table */}
      {tagSummary.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Detalhamento por Tag</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tag</TableHead>
                  <TableHead className="text-right">Total Despesas</TableHead>
                  <TableHead className="text-right">% do Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tagSummary.map((tag) => (
                  <TableRow key={tag.name}>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        style={{ backgroundColor: tag.color + "20", color: tag.color }}
                      >
                        {tag.name}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(tag.total)}</TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {totalExpense > 0 ? ((tag.total / totalExpense) * 100).toFixed(1) : 0}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
