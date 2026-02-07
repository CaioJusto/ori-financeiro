import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";

const exchangeRates: Record<string, number> = { BRL: 1, USD: 5.0, EUR: 5.5 };

export async function GET() {
  const { error, tenant } = await requirePermission("dashboard:read");
  if (error) return error;
  const tid = tenant.tenantId;

  const [accounts, transactions, categories, transfers] = await Promise.all([
    prisma.account.findMany({ where: { tenantId: tid }, include: { transactions: true, transfersFrom: true, transfersTo: true } }),
    prisma.transaction.findMany({ where: { tenantId: tid }, include: { account: true, category: true }, orderBy: { date: "desc" } }),
    prisma.category.findMany({ where: { tenantId: tid } }),
    prisma.transfer.findMany({ where: { tenantId: tid } }),
  ]);

  const accountBalances = accounts.map((a) => {
    const income = a.transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expense = a.transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    const transferIn = a.transfersTo.reduce((s, t) => s + t.amount, 0);
    const transferOut = a.transfersFrom.reduce((s, t) => s + t.amount, 0);
    const balance = income - expense + transferIn - transferOut;
    const rate = exchangeRates[a.currency] || 1;
    return { id: a.id, name: a.name, color: a.color, type: a.type, currency: a.currency, balance, balanceBRL: balance * rate };
  });

  const totalBalance = accountBalances.reduce((s, a) => s + a.balanceBRL, 0);
  const totalIncome = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  const now = new Date();
  const monthlyData = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = d.toLocaleDateString("pt-BR", { month: "short" });
    const year = d.getFullYear();
    const m = d.getMonth();
    const monthTx = transactions.filter((t) => { const td = new Date(t.date); return td.getMonth() === m && td.getFullYear() === year; });
    monthlyData.push({
      month: `${month}/${year}`,
      income: monthTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0),
      expense: monthTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0),
    });
  }

  const categoryMap = new Map<string, { name: string; color: string; total: number }>();
  for (const t of transactions.filter((t) => t.type === "expense")) {
    const cat = categories.find((c) => c.id === t.categoryId);
    if (!cat) continue;
    const existing = categoryMap.get(cat.id) || { name: cat.name, color: cat.color, total: 0 };
    existing.total += t.amount;
    categoryMap.set(cat.id, existing);
  }

  const curMonth = now.getMonth(), curYear = now.getFullYear();
  const prevMonth = curMonth === 0 ? 11 : curMonth - 1;
  const prevYear = curMonth === 0 ? curYear - 1 : curYear;
  const curMonthTx = transactions.filter((t) => { const d = new Date(t.date); return d.getMonth() === curMonth && d.getFullYear() === curYear; });
  const prevMonthTx = transactions.filter((t) => { const d = new Date(t.date); return d.getMonth() === prevMonth && d.getFullYear() === prevYear; });
  const currentMonthIncome = curMonthTx.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const currentMonthExpense = curMonthTx.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const previousMonthIncome = prevMonthTx.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const previousMonthExpense = prevMonthTx.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(curYear, curMonth + 1, 0).getDate();
  const dailyAvgExpense = dayOfMonth > 0 ? currentMonthExpense / dayOfMonth : 0;
  const projectedExpense = dailyAvgExpense * daysInMonth;

  const budgets = await prisma.budget.findMany({
    where: { month: `${curYear}-${String(curMonth + 1).padStart(2, "0")}`, tenantId: tid },
    include: { category: true },
  });
  const bustedBudgets = budgets.filter((b) => {
    const spent = curMonthTx.filter(t => t.type === "expense" && t.categoryId === b.categoryId).reduce((s, t) => s + t.amount, 0);
    return spent > b.amount;
  }).map((b) => ({ id: b.id, category: b.category.name, limit: b.amount, spent: curMonthTx.filter(t => t.type === "expense" && t.categoryId === b.categoryId).reduce((s, t) => s + t.amount, 0) }));

  return NextResponse.json({
    totalBalance, totalIncome, totalExpense, accountBalances, monthlyData,
    categoryBreakdown: Array.from(categoryMap.values()),
    recentTransactions: transactions.slice(0, 10),
    comparison: { currentMonthIncome, currentMonthExpense, previousMonthIncome, previousMonthExpense },
    projection: { dailyAvgExpense, projectedExpense, daysRemaining: daysInMonth - dayOfMonth },
    bustedBudgets,
  });
}
