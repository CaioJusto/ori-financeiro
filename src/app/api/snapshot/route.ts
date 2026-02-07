import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";

export async function GET(req: NextRequest) {
  const { error, tenant } = await requirePermission("reports.view");
  if (error) return error;

  const month = req.nextUrl.searchParams.get("month") || getCurrentMonth();
  const tid = tenant.tenantId;

  // Check for cached snapshot
  const existing = await prisma.financialSnapshot.findUnique({
    where: { tenantId_month: { tenantId: tid, month } },
  });
  if (existing) return NextResponse.json(existing);

  // Generate snapshot
  const snapshot = await generateSnapshot(tid, month);
  return NextResponse.json(snapshot);
}

export async function POST(req: NextRequest) {
  const { error, tenant } = await requirePermission("reports.view");
  if (error) return error;

  const body = await req.json();
  const month = body.month || getCurrentMonth();
  const tid = tenant.tenantId;

  const snapshot = await generateSnapshot(tid, month);

  // Save/update
  const saved = await prisma.financialSnapshot.upsert({
    where: { tenantId_month: { tenantId: tid, month } },
    create: { tenantId: tid, month, ...snapshot },
    update: snapshot,
  });

  return NextResponse.json(saved);
}

function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

async function generateSnapshot(tenantId: string, month: string) {
  const [year, m] = month.split("-").map(Number);
  const startDate = new Date(year, m - 1, 1);
  const endDate = new Date(year, m, 0);

  const transactions = await prisma.transaction.findMany({
    where: { tenantId, date: { gte: startDate, lte: endDate } },
  });

  const income = transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expense = transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const savingsRate = income > 0 ? ((income - expense) / income) * 100 : 0;

  // Budget adherence
  const budgets = await prisma.budget.findMany({ where: { tenantId, month } });
  let budgetScore = 75;
  if (budgets.length > 0) {
    const budgetTxs = await prisma.transaction.findMany({
      where: { tenantId, date: { gte: startDate, lte: endDate }, type: "expense" },
    });
    const spent: Record<string, number> = {};
    budgetTxs.forEach(t => { spent[t.categoryId] = (spent[t.categoryId] || 0) + t.amount; });
    const adherences = budgets.map(b => {
      const s = spent[b.categoryId] || 0;
      return s <= b.amount ? 100 : Math.max(0, 100 - ((s - b.amount) / b.amount) * 100);
    });
    budgetScore = Math.round(adherences.reduce((a, b) => a + b, 0) / adherences.length);
  }

  // Debt management
  const loans = await prisma.loan.findMany({ where: { tenantId, status: "ACTIVE" } });
  const totalDebt = loans.reduce((s, l) => s + l.remainingBalance, 0);
  const debtScore = totalDebt === 0 ? 95 : Math.max(20, Math.round(100 - (totalDebt / (income * 12)) * 100));

  // Investment growth
  const investments = await prisma.investment.findMany({ where: { tenantId } });
  const totalPL = investments.reduce((s, i) => s + i.profitLoss, 0);
  const totalInvested = investments.reduce((s, i) => s + i.totalInvested, 0);
  const investScore = totalInvested > 0 ? Math.min(100, Math.round(50 + (totalPL / totalInvested) * 100)) : 50;

  // Spending control (lower expense ratio = better)
  const spendingScore = income > 0 ? Math.min(100, Math.round((1 - expense / income) * 150)) : 40;

  // Savings score
  const savingsScore = Math.min(100, Math.max(0, Math.round(savingsRate * 3)));

  const overallScore = Math.round((spendingScore + savingsScore + budgetScore + debtScore + investScore) / 5);
  const overallGrade = scoreToGrade(overallScore);

  const recommendations = [];
  if (savingsRate < 20) recommendations.push("Tente economizar pelo menos 20% da sua renda mensal.");
  if (expense > income * 0.8) recommendations.push("Suas despesas estão acima de 80% da renda. Revise gastos não essenciais.");
  if (totalDebt > income * 6) recommendations.push("Sua dívida total é alta. Considere um plano de pagamento acelerado.");
  if (recommendations.length === 0) recommendations.push("Parabéns! Suas finanças estão saudáveis. Continue assim!");

  return {
    overallScore,
    overallGrade,
    spendingControl: spendingScore,
    savings: savingsScore,
    budgetAdherence: budgetScore,
    debtManagement: debtScore,
    investmentGrowth: investScore,
    recommendations,
    data: { income, expense, savingsRate: Math.round(savingsRate * 100) / 100, totalDebt, totalInvested },
  };
}

function scoreToGrade(score: number): string {
  if (score >= 95) return "A+";
  if (score >= 90) return "A";
  if (score >= 85) return "A-";
  if (score >= 80) return "B+";
  if (score >= 75) return "B";
  if (score >= 70) return "B-";
  if (score >= 65) return "C+";
  if (score >= 60) return "C";
  if (score >= 55) return "C-";
  if (score >= 50) return "D+";
  if (score >= 45) return "D";
  if (score >= 40) return "D-";
  return "F";
}
