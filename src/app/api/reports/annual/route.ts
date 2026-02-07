import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";

export async function GET(req: NextRequest) {
  const { error, tenant } = await requirePermission("reports:read");
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));

  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31, 23, 59, 59);

  const transactions = await prisma.transaction.findMany({
    where: { date: { gte: start, lte: end }, tenantId: tenant.tenantId },
    include: { category: true, account: true },
    orderBy: { date: "asc" },
  });

  const months = Array.from({ length: 12 }, (_, i) => {
    const monthName = new Date(year, i).toLocaleDateString("pt-BR", { month: "short" });
    const monthTxs = transactions.filter(t => new Date(t.date).getMonth() === i);
    const income = monthTxs.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expense = monthTxs.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    return { month: monthName, income, expense, balance: income - expense, count: monthTxs.length };
  });

  const totalIncome = transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  const catMap: Record<string, { name: string; total: number }> = {};
  transactions.filter(t => t.type === "expense").forEach(t => {
    if (!catMap[t.category.name]) catMap[t.category.name] = { name: t.category.name, total: 0 };
    catMap[t.category.name].total += t.amount;
  });
  const topCategories = Object.values(catMap).sort((a, b) => b.total - a.total).slice(0, 10);

  return NextResponse.json({
    year, months, totalIncome, totalExpense, balance: totalIncome - totalExpense,
    totalTransactions: transactions.length, topCategories,
  });
}
