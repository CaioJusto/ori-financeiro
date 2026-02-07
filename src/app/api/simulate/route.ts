import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";

export async function POST(req: NextRequest) {
  const { error, tenant } = await requirePermission("simulate:read");
  if (error) return error;
  const tid = tenant.tenantId;

  const body = await req.json();
  const { scenario, months = 12 } = body;

  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
  const transactions = await prisma.transaction.findMany({
    where: { date: { gte: sixMonthsAgo }, tenantId: tid },
    include: { category: true },
  });

  const monthlyIncome = transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0) / 6;
  const monthlyExpense = transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0) / 6;

  const catExpenses = new Map<string, { name: string; avg: number }>();
  for (const t of transactions.filter(t => t.type === "expense")) {
    const e = catExpenses.get(t.categoryId) || { name: t.category.name, avg: 0 };
    e.avg += t.amount / 6;
    catExpenses.set(t.categoryId, e);
  }

  const accounts = await prisma.account.findMany({ where: { tenantId: tid }, include: { transactions: true, transfersFrom: true, transfersTo: true } });
  let currentBalance = 0;
  for (const a of accounts) {
    const inc = a.transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const exp = a.transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    const tIn = a.transfersTo.reduce((s, t) => s + t.amount, 0);
    const tOut = a.transfersFrom.reduce((s, t) => s + t.amount, 0);
    currentBalance += inc - exp + tIn - tOut;
  }

  const baseline: { month: number; balance: number; income: number; expense: number }[] = [];
  const projected: { month: number; balance: number; income: number; expense: number }[] = [];

  let baseBalance = currentBalance;
  let projBalance = currentBalance;

  for (let i = 1; i <= months; i++) {
    baseBalance += monthlyIncome - monthlyExpense;
    baseline.push({ month: i, balance: baseBalance, income: monthlyIncome, expense: monthlyExpense });

    let projIncome = monthlyIncome;
    let projExpense = monthlyExpense;

    if (scenario === "save_monthly") {
      projExpense -= body.amount || 0;
    } else if (scenario === "reduce_category") {
      const catId = body.categoryId;
      const reduction = (body.percentage || 0) / 100;
      const cat = catExpenses.get(catId);
      if (cat) projExpense -= cat.avg * reduction;
    } else if (scenario === "income_increase") {
      projIncome *= 1 + (body.percentage || 0) / 100;
    }

    projBalance += projIncome - projExpense;
    projected.push({ month: i, balance: projBalance, income: projIncome, expense: projExpense });
  }

  return NextResponse.json({
    currentBalance, monthlyIncome, monthlyExpense,
    categories: Array.from(catExpenses.entries()).map(([id, v]) => ({ id, ...v })),
    baseline, projected,
    savings: projected[projected.length - 1].balance - baseline[baseline.length - 1].balance,
  });
}
