import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const tenantId = (session.user as any).tenantId;
  const { searchParams } = new URL(req.url);
  const startDate = searchParams.get("startDate") || new Date(new Date().getFullYear(), 0, 1).toISOString();
  const endDate = searchParams.get("endDate") || new Date().toISOString();

  const transactions = await prisma.transaction.findMany({
    where: { tenantId, date: { gte: new Date(startDate), lte: new Date(endDate) } },
    include: { category: true },
  });

  const income = transactions.filter(t => t.type === "income");
  const expenses = transactions.filter(t => t.type === "expense");

  const incomeByCategory: Record<string, { name: string; total: number }> = {};
  const expenseByCategory: Record<string, { name: string; total: number }> = {};

  income.forEach(t => {
    const key = t.category.name;
    if (!incomeByCategory[key]) incomeByCategory[key] = { name: key, total: 0 };
    incomeByCategory[key].total += t.amount;
  });

  expenses.forEach(t => {
    const key = t.category.name;
    if (!expenseByCategory[key]) expenseByCategory[key] = { name: key, total: 0 };
    expenseByCategory[key].total += t.amount;
  });

  const totalIncome = income.reduce((s, t) => s + t.amount, 0);
  const totalExpenses = expenses.reduce((s, t) => s + t.amount, 0);

  return NextResponse.json({
    totalIncome,
    totalExpenses,
    netProfit: totalIncome - totalExpenses,
    incomeBreakdown: Object.values(incomeByCategory).sort((a, b) => b.total - a.total),
    expenseBreakdown: Object.values(expenseByCategory).sort((a, b) => b.total - a.total),
  });
}
