import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";

export async function POST() {
  return GET();
}

export async function GET() {
  const { error, tenant } = await requirePermission("insights.view");
  if (error) return error;

  const now = new Date();
  const curMonth = now.getMonth(), curYear = now.getFullYear();

  const transactions = await prisma.transaction.findMany({
    where: { tenantId: tenant.tenantId },
    include: { category: true, account: true },
  });

  const insights: { icon: string; text: string; type: "info" | "warning" | "success" | "tip" }[] = [];

  // Group by month
  const monthlyExpense = new Map<string, number>();
  const monthlyCatExpense = new Map<string, Map<string, number>>();

  for (const t of transactions) {
    if (t.type !== "expense") continue;
    const d = new Date(t.date);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    monthlyExpense.set(key, (monthlyExpense.get(key) || 0) + t.amount);

    if (!monthlyCatExpense.has(key)) monthlyCatExpense.set(key, new Map());
    const catMap = monthlyCatExpense.get(key)!;
    catMap.set(t.category.name, (catMap.get(t.category.name) || 0) + t.amount);
  }

  const curKey = `${curYear}-${curMonth}`;
  const curExpense = monthlyExpense.get(curKey) || 0;

  // Average monthly expense (excluding current)
  const pastMonths = Array.from(monthlyExpense.entries()).filter(([k]) => k !== curKey);
  const avgExpense = pastMonths.length > 0 ? pastMonths.reduce((s, [, v]) => s + v, 0) / pastMonths.length : 0;

  if (avgExpense > 0) {
    const pct = ((curExpense - avgExpense) / avgExpense) * 100;
    if (pct > 10) {
      insights.push({ icon: "📈", text: `Seus gastos este mês estão ${pct.toFixed(0)}% acima da média mensal (R$ ${avgExpense.toFixed(0)})`, type: "warning" });
    } else if (pct < -10) {
      insights.push({ icon: "📉", text: `Parabéns! Seus gastos estão ${Math.abs(pct).toFixed(0)}% abaixo da média mensal`, type: "success" });
    }
  }

  // Category comparison with average
  const curCats = monthlyCatExpense.get(curKey);
  if (curCats) {
    for (const [catName, curAmount] of curCats) {
      const pastCatAmounts: number[] = [];
      for (const [k, catMap] of monthlyCatExpense) {
        if (k === curKey) continue;
        if (catMap.has(catName)) pastCatAmounts.push(catMap.get(catName)!);
      }
      if (pastCatAmounts.length >= 2) {
        const avg = pastCatAmounts.reduce((s, v) => s + v, 0) / pastCatAmounts.length;
        const pct = ((curAmount - avg) / avg) * 100;
        if (pct > 30) {
          insights.push({ icon: "⚠️", text: `Você gastou ${pct.toFixed(0)}% mais em ${catName} este mês comparado à média (R$ ${avg.toFixed(0)})`, type: "warning" });
        }
      }
    }
  }

  // Largest single expense this month
  const curMonthTx = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === curMonth && d.getFullYear() === curYear && t.type === "expense";
  }).sort((a, b) => b.amount - a.amount);

  if (curMonthTx.length > 0) {
    const biggest = curMonthTx[0];
    insights.push({ icon: "💸", text: `Maior gasto do mês: "${biggest.description}" — R$ ${biggest.amount.toFixed(2)} em ${biggest.category.name}`, type: "info" });
  }

  // Income vs expense ratio
  const curIncome = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === curMonth && d.getFullYear() === curYear && t.type === "income";
  }).reduce((s, t) => s + t.amount, 0);

  if (curIncome > 0 && curExpense > 0) {
    const savingsRate = ((curIncome - curExpense) / curIncome) * 100;
    if (savingsRate >= 20) {
      insights.push({ icon: "🎯", text: `Excelente taxa de poupança: ${savingsRate.toFixed(0)}% da renda está sendo economizada`, type: "success" });
    } else if (savingsRate > 0) {
      insights.push({ icon: "💡", text: `Você está poupando ${savingsRate.toFixed(0)}% da renda. Tente chegar a 20%!`, type: "tip" });
    } else {
      insights.push({ icon: "🚨", text: `Atenção: gastos excedem a renda em R$ ${(curExpense - curIncome).toFixed(0)} este mês`, type: "warning" });
    }
  }

  // Day of week spending pattern
  const dayTotals = [0, 0, 0, 0, 0, 0, 0];
  const dayCounts = [0, 0, 0, 0, 0, 0, 0];
  for (const t of transactions.filter(t => t.type === "expense")) {
    const dow = new Date(t.date).getDay();
    dayTotals[dow] += t.amount;
    dayCounts[dow]++;
  }
  const dayNames = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
  let maxDay = 0;
  for (let i = 1; i < 7; i++) { if (dayTotals[i] > dayTotals[maxDay]) maxDay = i; }
  if (dayTotals[maxDay] > 0) {
    insights.push({ icon: "📅", text: `${dayNames[maxDay]} é o dia que você mais gasta (R$ ${(dayTotals[maxDay] / Math.max(dayCounts[maxDay], 1)).toFixed(0)} em média por transação)`, type: "info" });
  }

  return NextResponse.json(insights.slice(0, 5));
}
