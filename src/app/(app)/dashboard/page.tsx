"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useOrg } from "@/contexts/org-context";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/format";
import { ArrowDownLeft, ArrowUpRight, Wallet, TrendingUp } from "lucide-react";

interface DashboardStats {
  totalBalance: number;
  incomeThisMonth: number;
  expenseThisMonth: number;
  accountCount: number;
}

export default function DashboardPage() {
  const { currentOrg } = useOrg();
  const [stats, setStats] = useState<DashboardStats>({
    totalBalance: 0,
    incomeThisMonth: 0,
    expenseThisMonth: 0,
    accountCount: 0,
  });
  const supabase = createClient();

  useEffect(() => {
    if (!currentOrg) return;

    async function loadStats() {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .split("T")[0];

      const [accountsRes, transactionsRes] = await Promise.all([
        supabase
          .from("cash_accounts")
          .select("balance")
          .eq("organization_id", currentOrg!.id),
        supabase
          .from("transactions")
          .select("amount, type")
          .eq("organization_id", currentOrg!.id)
          .gte("date", startOfMonth),
      ]);

      const accounts = (accountsRes.data as { balance: number }[]) ?? [];
      const transactions = (transactionsRes.data as { amount: number; type: string }[]) ?? [];

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
    }

    loadStats();
  }, [currentOrg, supabase]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral das suas finanças
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
            <CardTitle className="text-sm font-medium">Receitas (Mês)</CardTitle>
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
            <CardTitle className="text-sm font-medium">Despesas (Mês)</CardTitle>
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
            <CardTitle className="text-sm font-medium">Contas</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.accountCount}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
