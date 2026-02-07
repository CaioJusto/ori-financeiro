import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";

export async function GET() {
  const { error, tenant } = await requirePermission("dashboard:read");
  if (error) return error;
  const tid = tenant.tenantId;

  const [accounts, transactions] = await Promise.all([
    prisma.account.findMany({ where: { tenantId: tid }, include: { transactions: true, transfersFrom: true, transfersTo: true } }),
    prisma.transaction.findMany({ where: { tenantId: tid }, include: { account: true, category: true }, orderBy: { date: "desc" } }),
  ]);

  const accountBalances = accounts.map((a) => {
    const income = a.transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expense = a.transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    const transferIn = a.transfersTo.reduce((s, t) => s + t.amount, 0);
    const transferOut = a.transfersFrom.reduce((s, t) => s + t.amount, 0);
    return { name: a.name, balance: income - expense + transferIn - transferOut };
  });

  const totalBalance = accountBalances.reduce((s, a) => s + a.balance, 0);

  const now = new Date();
  const currentMonth = transactions.filter((t) => {
    const d = new Date(t.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const monthIncome = currentMonth.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const monthExpense = currentMonth.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  const recent = transactions.slice(0, 5).map((t) => ({
    date: new Date(t.date).toLocaleDateString("pt-BR"),
    description: t.description, type: t.type, amount: t.amount,
    account: t.account.name, category: t.category.name,
  }));

  return NextResponse.json({
    totalBalance, accountBalances,
    currentMonth: { income: monthIncome, expense: monthExpense, net: monthIncome - monthExpense },
    recentTransactions: recent,
  });
}
