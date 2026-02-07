import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";

const exchangeRates: Record<string, number> = { BRL: 1, USD: 5.0, EUR: 5.5 };

export async function GET() {
  const { error, tenant } = await requirePermission("metrics:read");
  if (error) return error;
  const tid = tenant.tenantId;

  const now = new Date();
  const curMonth = now.getMonth();
  const curYear = now.getFullYear();

  const [accounts, transactions] = await Promise.all([
    prisma.account.findMany({ where: { tenantId: tid }, include: { transactions: true, transfersFrom: true, transfersTo: true } }),
    prisma.transaction.findMany({ where: { tenantId: tid }, orderBy: { date: "desc" } }),
  ]);

  let totalBalance = 0;
  for (const a of accounts) {
    const inc = a.transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const exp = a.transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    const tIn = a.transfersTo.reduce((s, t) => s + t.amount, 0);
    const tOut = a.transfersFrom.reduce((s, t) => s + t.amount, 0);
    totalBalance += (inc - exp + tIn - tOut) * (exchangeRates[a.currency] || 1);
  }

  const curMonthTx = transactions.filter(t => { const d = new Date(t.date); return d.getMonth() === curMonth && d.getFullYear() === curYear; });
  const monthIncome = curMonthTx.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const monthExpense = curMonthTx.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  const dayOfMonth = now.getDate();
  const burnRate = dayOfMonth > 0 ? monthExpense / dayOfMonth : 0;
  const runwayDays = burnRate > 0 ? Math.floor(totalBalance / burnRate) : Infinity;
  const savingsRate = monthIncome > 0 ? ((monthIncome - monthExpense) / monthIncome) * 100 : 0;

  const netWorthTrend = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(curYear, curMonth - i, 1);
    const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
    const label = d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
    const txUntil = transactions.filter(t => new Date(t.date) <= mEnd);
    const inc = txUntil.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const exp = txUntil.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    netWorthTrend.push({ month: label, value: inc - exp });
  }

  return NextResponse.json({
    burnRate, runwayDays: runwayDays === Infinity ? null : runwayDays,
    savingsRate, netWorthTrend, totalBalance, monthIncome, monthExpense,
  });
}
