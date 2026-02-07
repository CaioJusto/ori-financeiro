import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";

export async function GET() {
  const { error, tenant } = await requirePermission("health-score:read");
  if (error) return error;
  const tid = tenant.tenantId;

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const transactions = await prisma.transaction.findMany({
    where: { date: { gte: startOfMonth, lte: endOfMonth }, tenantId: tid },
  });

  const income = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  const savingsRate = income > 0 ? ((income - expense) / income) * 100 : 0;
  const savingsScore = Math.min(30, Math.max(0, savingsRate * 1.5));

  const budgets = await prisma.budget.findMany({ where: { month: currentMonth, tenantId: tid } });
  let budgetScore = 25;
  if (budgets.length > 0) {
    const catExpenses: Record<string, number> = {};
    for (const t of transactions.filter((t) => t.type === "expense")) {
      catExpenses[t.categoryId] = (catExpenses[t.categoryId] || 0) + t.amount;
    }
    let withinLimit = 0;
    for (const b of budgets) {
      if ((catExpenses[b.categoryId] || 0) <= b.amount) withinLimit++;
    }
    budgetScore = (withinLimit / budgets.length) * 25;
  }

  const goals = await prisma.savingsGoal.findMany({ where: { tenantId: tid } });
  let goalsScore = 25;
  if (goals.length > 0) {
    const avgProgress = goals.reduce((s, g) => s + Math.min(1, g.currentAmount / g.targetAmount), 0) / goals.length;
    goalsScore = avgProgress * 25;
  }

  const incomeCats = new Set(transactions.filter((t) => t.type === "income").map((t) => t.categoryId));
  const divScore = Math.min(20, incomeCats.size * 5);

  const totalScore = Math.round(savingsScore + budgetScore + goalsScore + divScore);

  const tips: string[] = [];
  if (savingsRate < 20) tips.push("Tente poupar pelo menos 20% da sua receita mensal");
  if (budgetScore < 20) tips.push("Alguns orçamentos estão estourados — revise seus gastos");
  if (goals.length === 0) tips.push("Crie metas de economia para melhorar sua saúde financeira");
  if (incomeCats.size < 2) tips.push("Diversifique suas fontes de receita");
  if (totalScore >= 80) tips.push("Excelente! Continue mantendo bons hábitos financeiros 🎉");

  return NextResponse.json({
    score: totalScore,
    breakdown: {
      savings: { score: Math.round(savingsScore), max: 30, rate: Math.round(savingsRate) },
      budgets: { score: Math.round(budgetScore), max: 25, total: budgets.length },
      goals: { score: Math.round(goalsScore), max: 25, total: goals.length },
      diversification: { score: Math.round(divScore), max: 20, sources: incomeCats.size },
    },
    tips,
    income: Math.round(income * 100) / 100,
    expense: Math.round(expense * 100) / 100,
  });
}
