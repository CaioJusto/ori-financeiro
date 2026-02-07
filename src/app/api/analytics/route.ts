import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";

export async function GET(req: NextRequest) {
  const { error, tenant } = await requirePermission("dashboard:read");
  if (error) return error;
  const tid = tenant.tenantId;
  const url = new URL(req.url);
  const months = parseInt(url.searchParams.get("months") || "6");

  const since = new Date();
  since.setMonth(since.getMonth() - months);

  const transactions = await prisma.transaction.findMany({
    where: { tenantId: tid, date: { gte: since }, archived: false },
    include: { category: true, account: true },
    orderBy: { date: "asc" },
  });

  // Day of week heatmap
  const dayOfWeekSpending: number[] = [0, 0, 0, 0, 0, 0, 0];
  const dayOfWeekCount: number[] = [0, 0, 0, 0, 0, 0, 0];
  // Category trends (month -> category -> amount)
  const categoryTrends: Record<string, Record<string, number>> = {};
  // Income vs Expense by month
  const monthlyRatio: Record<string, { income: number; expense: number }> = {};
  // Payee ranking
  const payeeMap: Record<string, number> = {};
  // Category avg
  const categoryTotals: Record<string, { total: number; count: number; name: string; color: string }> = {};

  for (const t of transactions) {
    const d = new Date(t.date);
    const dow = d.getDay();
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

    if (t.type === "expense") {
      dayOfWeekSpending[dow] += t.amount;
      dayOfWeekCount[dow]++;

      if (!categoryTrends[monthKey]) categoryTrends[monthKey] = {};
      categoryTrends[monthKey][t.category.name] = (categoryTrends[monthKey][t.category.name] || 0) + t.amount;

      const desc = t.description.toLowerCase().trim();
      payeeMap[desc] = (payeeMap[desc] || 0) + t.amount;

      if (!categoryTotals[t.categoryId]) categoryTotals[t.categoryId] = { total: 0, count: 0, name: t.category.name, color: t.category.color };
      categoryTotals[t.categoryId].total += t.amount;
      categoryTotals[t.categoryId].count++;
    }

    if (!monthlyRatio[monthKey]) monthlyRatio[monthKey] = { income: 0, expense: 0 };
    if (t.type === "income") monthlyRatio[monthKey].income += t.amount;
    if (t.type === "expense") monthlyRatio[monthKey].expense += t.amount;
  }

  const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const spendingByDay = dayNames.map((name, i) => ({ name, total: Math.round(dayOfWeekSpending[i] * 100) / 100, avg: dayOfWeekCount[i] ? Math.round((dayOfWeekSpending[i] / dayOfWeekCount[i]) * 100) / 100 : 0 }));

  // Category trends as array
  const allCategories = new Set<string>();
  Object.values(categoryTrends).forEach(m => Object.keys(m).forEach(c => allCategories.add(c)));
  const categoryTrendData = Object.entries(categoryTrends).sort(([a], [b]) => a.localeCompare(b)).map(([month, cats]) => {
    const entry: Record<string, string | number> = { month };
    allCategories.forEach(c => { entry[c] = Math.round((cats[c] || 0) * 100) / 100; });
    return entry;
  });

  const incomeExpenseRatio = Object.entries(monthlyRatio).sort(([a], [b]) => a.localeCompare(b)).map(([month, data]) => ({
    month,
    income: Math.round(data.income * 100) / 100,
    expense: Math.round(data.expense * 100) / 100,
    ratio: data.expense > 0 ? Math.round((data.income / data.expense) * 100) / 100 : 0,
  }));

  const topPayees = Object.entries(payeeMap).sort(([, a], [, b]) => b - a).slice(0, 10).map(([name, total]) => ({ name, total: Math.round(total * 100) / 100 }));

  const categoryAvg = Object.values(categoryTotals).map(c => ({ name: c.name, color: c.color, total: Math.round(c.total * 100) / 100, avg: Math.round((c.total / c.count) * 100) / 100, count: c.count })).sort((a, b) => b.total - a.total);

  // 7-day and 30-day moving averages
  const expensesByDate: Record<string, number> = {};
  transactions.filter(t => t.type === "expense").forEach(t => {
    const key = new Date(t.date).toISOString().split("T")[0];
    expensesByDate[key] = (expensesByDate[key] || 0) + t.amount;
  });
  const sortedDates = Object.keys(expensesByDate).sort();
  const movingAvg = sortedDates.map((date, i) => {
    const last7 = sortedDates.slice(Math.max(0, i - 6), i + 1);
    const last30 = sortedDates.slice(Math.max(0, i - 29), i + 1);
    const avg7 = last7.reduce((s, d) => s + (expensesByDate[d] || 0), 0) / last7.length;
    const avg30 = last30.reduce((s, d) => s + (expensesByDate[d] || 0), 0) / last30.length;
    return { date, amount: Math.round((expensesByDate[date] || 0) * 100) / 100, avg7: Math.round(avg7 * 100) / 100, avg30: Math.round(avg30 * 100) / 100 };
  });

  return NextResponse.json({
    spendingByDay,
    categoryTrendData,
    categoryNames: Array.from(allCategories),
    incomeExpenseRatio,
    topPayees,
    categoryAvg,
    movingAvg,
  });
}
