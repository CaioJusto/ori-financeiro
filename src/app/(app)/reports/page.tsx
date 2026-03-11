"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
  category_id: string | null;
}

interface CategorySummary {
  name: string;
  color: string;
  total: number;
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
  const [categories, setCategories] = useState<{ id: string; name: string; icon: string | null }[]>([]);
  const [txnTagMap, setTxnTagMap] = useState<Map<string, string[]>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentOrg) return;
    loadReport();
  }, [currentOrg, year, month]);

  async function loadReport() {
    setLoading(true);
    const orgId = currentOrg!.id;
    const startDate = `${year}-${String(month + 1).padStart(2, "0")}-01`;
    const endDate = month === 11
      ? `${year + 1}-01-01`
      : `${year}-${String(month + 2).padStart(2, "0")}-01`;

    const [txnRes, accountsRes, tagsRes, categoriesRes] = await Promise.all([
      supabase
        .from("transactions")
        .select("id, amount, type, description, date, cash_account_id, category_id")
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
      supabase
        .from("categories")
        .select("id, name, icon")
        .eq("organization_id", orgId),
    ]);

    const txns = (txnRes.data as Transaction[]) ?? [];
    setTransactions(txns);
    setAccounts((accountsRes.data as { id: string; name: string }[]) ?? []);
    setTags((tagsRes.data as { id: string; name: string; color: string }[]) ?? []);
    setCategories((categoriesRes.data as { id: string; name: string; icon: string | null }[]) ?? []);

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
    setLoading(false);
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

  // Category breakdown
  const categorySummary = useMemo(() => {
    const totals = new Map<string, number>();
    transactions
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        const key = t.category_id ?? "__none__";
        totals.set(key, (totals.get(key) ?? 0) + Math.abs(t.amount));
      });

    const result: CategorySummary[] = [];
    totals.forEach((total, catId) => {
      if (catId === "__none__") {
        result.push({ name: "Sem categoria", color: "#6b7280", total });
      } else {
        const cat = categories.find((c) => c.id === catId);
        if (cat) result.push({ name: cat.name, color: cat.icon ?? "#6366f1", total });
      }
    });
    return result.sort((a, b) => b.total - a.total);
  }, [transactions, categories]);

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

  function exportCSV() {
    const monthLabel = `${MONTH_NAMES[month]}_${year}`;
    const lines: string[] = [];

    // Transactions
    lines.push("=== Transacoes ===");
    lines.push("Data,Descricao,Tipo,Valor,Conta");
    transactions.forEach((t) => {
      const accountName = accounts.find((a) => a.id === t.cash_account_id)?.name ?? "";
      const typeLabel = t.type === "income" ? "Receita" : t.type === "expense" ? "Despesa" : "Transferencia";
      lines.push(`${t.date},"${t.description.replace(/"/g, '""')}",${typeLabel},${t.amount},"${accountName.replace(/"/g, '""')}"`);
    });

    lines.push("");
    lines.push("=== Resumo por Tag ===");
    lines.push("Tag,Total Despesas,% do Total");
    tagSummary.forEach((tag) => {
      const pct = totalExpense > 0 ? ((tag.total / totalExpense) * 100).toFixed(1) : "0";
      lines.push(`"${tag.name.replace(/"/g, '""')}",${tag.total},${pct}%`);
    });

    lines.push("");
    lines.push("=== Resumo por Categoria ===");
    lines.push("Categoria,Total Despesas,% do Total");
    categorySummary.forEach((cat) => {
      const pct = totalExpense > 0 ? ((cat.total / totalExpense) * 100).toFixed(1) : "0";
      lines.push(`"${cat.name.replace(/"/g, '""')}",${cat.total},${pct}%`);
    });

    lines.push("");
    lines.push("=== Resumo por Conta ===");
    lines.push("Conta,Receitas,Despesas,Resultado");
    accountSummary.forEach((a) => {
      lines.push(`"${a.name.replace(/"/g, '""')}",${a.income},${a.expense},${a.net}`);
    });

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `relatorio_${monthLabel}.csv`;
    link.click();
    URL.revokeObjectURL(url);
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
          <Button variant="outline" onClick={exportCSV} disabled={loading || transactions.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {loading ? (
        <>
          {/* Summary cards skeleton */}
          <div className="grid gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-32" />
                  <Skeleton className="h-3 w-20 mt-2" />
                </CardContent>
              </Card>
            ))}
          </div>
          {/* Chart skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-4 w-36" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[250px] w-full" />
            </CardContent>
          </Card>
          {/* Bottom cards skeleton */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <Skeleton className="h-4 w-28" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[300px] w-full" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Skeleton className="h-4 w-28" />
              </CardHeader>
              <CardContent>
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full mb-2" />
                ))}
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <>
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

          {/* Category breakdown */}
          <div className="grid gap-4 md:grid-cols-2">
            {categorySummary.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Despesas por Categoria</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categorySummary}
                          dataKey="total"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={90}
                          label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                        >
                          {categorySummary.map((entry, i) => (
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

            {categorySummary.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Detalhamento por Categoria</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Categoria</TableHead>
                        <TableHead className="text-right">Total Despesas</TableHead>
                        <TableHead className="text-right">% do Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categorySummary.map((cat) => (
                        <TableRow key={cat.name}>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              style={{ backgroundColor: cat.color + "20", color: cat.color }}
                            >
                              {cat.name}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono">{formatCurrency(cat.total)}</TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {totalExpense > 0 ? ((cat.total / totalExpense) * 100).toFixed(1) : 0}%
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
        </>
      )}
    </div>
  );
}
