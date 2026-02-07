import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";

export async function GET() {
  const { error, tenant } = await requirePermission("reports.view");
  if (error) return error;

  const tid = tenant.tenantId;
  const now = new Date();
  const months = 6;

  // Get all income transactions for the past 6 months
  const startDate = new Date(now.getFullYear(), now.getMonth() - months, 1);
  const transactions = await prisma.transaction.findMany({
    where: { tenantId: tid, type: "income", date: { gte: startDate } },
    include: { contact: true },
    orderBy: { date: "asc" },
  });

  // Detect recurring patterns: same description + similar amount appearing monthly
  const patterns: Record<string, { amounts: number[]; months: Set<string>; contact: string | null; lastDate: Date }> = {};

  for (const tx of transactions) {
    const key = tx.description.toLowerCase().trim();
    if (!patterns[key]) patterns[key] = { amounts: [], months: new Set(), contact: null, lastDate: tx.date };
    patterns[key].amounts.push(tx.amount);
    patterns[key].months.add(`${tx.date.getFullYear()}-${String(tx.date.getMonth() + 1).padStart(2, "0")}`);
    patterns[key].contact = tx.contact?.name || null;
    if (tx.date > patterns[key].lastDate) patterns[key].lastDate = tx.date;
  }

  // Consider recurring if appears in 3+ months
  const recurringItems: { description: string; avgAmount: number; contact: string | null; monthCount: number; lastDate: Date }[] = [];
  for (const [desc, data] of Object.entries(patterns)) {
    if (data.months.size >= 3) {
      const avg = data.amounts.reduce((a, b) => a + b, 0) / data.amounts.length;
      recurringItems.push({
        description: desc,
        avgAmount: Math.round(avg * 100) / 100,
        contact: data.contact,
        monthCount: data.months.size,
        lastDate: data.lastDate,
      });
    }
  }

  const currentMRR = recurringItems.reduce((s, i) => s + i.avgAmount, 0);

  // MRR by month
  const mrrByMonth: Record<string, number> = {};
  for (let i = months; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    mrrByMonth[key] = 0;
  }

  for (const tx of transactions) {
    const key = tx.description.toLowerCase().trim();
    if (patterns[key]?.months.size >= 3) {
      const mKey = `${tx.date.getFullYear()}-${String(tx.date.getMonth() + 1).padStart(2, "0")}`;
      if (mrrByMonth[mKey] !== undefined) mrrByMonth[mKey] += tx.amount;
    }
  }

  const sortedMonths = Object.keys(mrrByMonth).sort();
  const mrrValues = sortedMonths.map(m => Math.round(mrrByMonth[m] * 100) / 100);

  // Growth rate
  const lastTwo = mrrValues.slice(-2);
  const growthRate = lastTwo.length === 2 && lastTwo[0] > 0
    ? Math.round(((lastTwo[1] - lastTwo[0]) / lastTwo[0]) * 10000) / 100
    : 0;

  // Churn: recurring items that stopped appearing in the last month
  const lastMonth = sortedMonths[sortedMonths.length - 1];
  const prevMonth = sortedMonths[sortedMonths.length - 2];
  let churnAmount = 0;
  let newAmount = 0;

  if (lastMonth && prevMonth) {
    const lastMonthTxs = transactions.filter(t => {
      const k = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, "0")}`;
      return k === lastMonth;
    }).map(t => t.description.toLowerCase().trim());
    const prevMonthTxs = transactions.filter(t => {
      const k = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, "0")}`;
      return k === prevMonth;
    }).map(t => t.description.toLowerCase().trim());

    for (const item of recurringItems) {
      if (prevMonthTxs.includes(item.description) && !lastMonthTxs.includes(item.description)) {
        churnAmount += item.avgAmount;
      }
      if (!prevMonthTxs.includes(item.description) && lastMonthTxs.includes(item.description)) {
        newAmount += item.avgAmount;
      }
    }
  }

  const churnRate = currentMRR > 0 ? Math.round((churnAmount / currentMRR) * 10000) / 100 : 0;

  // Revenue by client
  const byClient: Record<string, number> = {};
  for (const item of recurringItems) {
    const client = item.contact || item.description;
    byClient[client] = (byClient[client] || 0) + item.avgAmount;
  }

  return NextResponse.json({
    currentMRR: Math.round(currentMRR * 100) / 100,
    mrrHistory: { months: sortedMonths, values: mrrValues },
    growthRate,
    churnRate,
    churnAmount: Math.round(churnAmount * 100) / 100,
    newRevenue: Math.round(newAmount * 100) / 100,
    recurringItems,
    byClient,
  });
}
