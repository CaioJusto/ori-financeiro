import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";

export async function GET() {
  const { error, tenant } = await requirePermission("reports:read");
  if (error) return error;
  const tid = tenant.tenantId;

  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const transactions = await prisma.transaction.findMany({
    where: { date: { gte: sixMonthsAgo }, tenantId: tid },
  });

  const monthlyMap: Record<string, { income: number; expense: number }> = {};
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthlyMap[key] = { income: 0, expense: 0 };
  }

  for (const t of transactions) {
    const key = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, "0")}`;
    if (monthlyMap[key]) {
      if (t.type === "income") monthlyMap[key].income += t.amount;
      else monthlyMap[key].expense += t.amount;
    }
  }

  const months = Object.entries(monthlyMap).map(([month, data]) => ({
    month, income: Math.round(data.income * 100) / 100,
    expense: Math.round(data.expense * 100) / 100,
    balance: Math.round((data.income - data.expense) * 100) / 100,
  }));

  const last3 = months.slice(-3);
  const avgIncome = last3.reduce((s, m) => s + m.income, 0) / (last3.length || 1);
  const avgExpense = last3.reduce((s, m) => s + m.expense, 0) / (last3.length || 1);
  const avgBalance = avgIncome - avgExpense;

  const allTx = await prisma.transaction.findMany({ where: { tenantId: tid } });
  let currentBalance = 0;
  for (const t of allTx) currentBalance += t.type === "income" ? t.amount : -t.amount;

  const projections = [];
  let projBal = currentBalance;
  for (let i = 1; i <= 3; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    projBal += avgBalance;
    projections.push({
      month: key, income: Math.round(avgIncome * 100) / 100,
      expense: Math.round(avgExpense * 100) / 100, balance: Math.round(projBal * 100) / 100, projected: true,
    });
  }

  return NextResponse.json({
    historical: months.map((m) => ({ ...m, projected: false })), projections,
    avgIncome: Math.round(avgIncome * 100) / 100, avgExpense: Math.round(avgExpense * 100) / 100,
    currentBalance: Math.round(currentBalance * 100) / 100,
  });
}
