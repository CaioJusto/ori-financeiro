import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";

export async function GET() {
  const { error, tenant } = await requirePermission("reports:read");
  if (error) return error;

  const now = new Date();
  const months = [];

  for (let i = 2; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = d.getMonth();
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0, 23, 59, 59);

    const transactions = await prisma.transaction.findMany({
      where: { date: { gte: start, lte: end }, tenantId: tenant.tenantId },
      include: { category: true },
    });

    const income = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

    const catMap = new Map<string, { name: string; total: number }>();
    for (const t of transactions.filter((t) => t.type === "expense")) {
      const existing = catMap.get(t.categoryId) || { name: t.category.name, total: 0 };
      existing.total += t.amount;
      catMap.set(t.categoryId, existing);
    }
    const topCategories = Array.from(catMap.values()).sort((a, b) => b.total - a.total).slice(0, 3);

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const dailyExpense: number[] = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const dayTotal = transactions
        .filter((t) => t.type === "expense" && new Date(t.date).getDate() === day)
        .reduce((s, t) => s + t.amount, 0);
      dailyExpense.push(dayTotal);
    }

    months.push({
      label: d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }),
      year, month: month + 1, income, expense, balance: income - expense,
      topCategories, sparkline: dailyExpense, transactionCount: transactions.length,
    });
  }

  return NextResponse.json(months);
}
