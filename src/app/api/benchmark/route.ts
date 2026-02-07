import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";

// Brazilian household spending averages (IBGE-inspired)
const NATIONAL_AVERAGES = {
  "Moradia": 36.6,
  "Alimentação": 17.5,
  "Transporte": 18.1,
  "Saúde": 8.0,
  "Educação": 4.7,
  "Lazer": 3.8,
  "Tecnologia": 3.3,
  "Outros": 8.0,
};

const RECOMMENDED_503020 = {
  necessidades: 50, // Moradia, Alimentação, Transporte, Saúde
  desejos: 30,      // Lazer, Tecnologia, etc
  poupanca: 20,     // Savings
};

export async function GET() {
  const { error, tenant } = await requirePermission("reports.view");
  if (error) return error;

  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
  const tid = tenant.tenantId;

  const transactions = await prisma.transaction.findMany({
    where: { tenantId: tid, date: { gte: startDate } },
    include: { category: true },
  });

  const income = transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expense = transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const savings = income - expense;
  const savingsRate = income > 0 ? (savings / income) * 100 : 0;

  // Category distribution
  const byCategory: Record<string, number> = {};
  transactions.filter(t => t.type === "expense").forEach(t => {
    const cat = t.category?.name || "Outros";
    byCategory[cat] = (byCategory[cat] || 0) + t.amount;
  });

  const categoryPercentages: Record<string, number> = {};
  for (const [cat, amount] of Object.entries(byCategory)) {
    categoryPercentages[cat] = expense > 0 ? Math.round((amount / expense) * 1000) / 10 : 0;
  }

  // 50/30/20 analysis
  const necessidades = ["Moradia", "Alimentação", "Transporte", "Saúde"];
  const desejos = ["Lazer", "Tecnologia", "Educação"];
  const necessidadesTotal = Object.entries(byCategory)
    .filter(([k]) => necessidades.includes(k)).reduce((s, [, v]) => s + v, 0);
  const desejosTotal = Object.entries(byCategory)
    .filter(([k]) => desejos.includes(k)).reduce((s, [, v]) => s + v, 0);

  const ratio503020 = income > 0 ? {
    necessidades: Math.round((necessidadesTotal / income) * 1000) / 10,
    desejos: Math.round((desejosTotal / income) * 1000) / 10,
    poupanca: Math.round(savingsRate * 10) / 10,
  } : { necessidades: 0, desejos: 0, poupanca: 0 };

  // Simulated percentile rankings
  const percentiles: Record<string, number> = {};
  const cats = Object.keys(categoryPercentages);
  for (const cat of cats) {
    const nationalAvg = NATIONAL_AVERAGES[cat as keyof typeof NATIONAL_AVERAGES] || 5;
    const userPct = categoryPercentages[cat] || 0;
    // If user spends less than average, they're doing better
    if (userPct < nationalAvg) {
      percentiles[cat] = 55 + Math.round((1 - userPct / nationalAvg) * 40);
    } else {
      percentiles[cat] = Math.max(10, 50 - Math.round((userPct / nationalAvg - 1) * 30));
    }
  }

  const savingsPercentile = savingsRate >= 20 ? 85 : savingsRate >= 10 ? 65 : savingsRate >= 0 ? 40 : 15;

  // Radar chart data
  const radarCategories = Object.keys(NATIONAL_AVERAGES);
  const radarUser = radarCategories.map(c => categoryPercentages[c] || 0);
  const radarNational = radarCategories.map(c => NATIONAL_AVERAGES[c as keyof typeof NATIONAL_AVERAGES]);

  // Tips
  const tips: string[] = [];
  if (ratio503020.necessidades > 55) tips.push("Suas despesas com necessidades estão acima de 55%. Considere renegociar aluguel ou buscar alternativas de transporte.");
  if (ratio503020.desejos > 35) tips.push("Gastos com desejos acima de 35%. Revise assinaturas e compras por impulso.");
  if (ratio503020.poupanca < 15) tips.push("Sua taxa de poupança está abaixo de 15%. Automatize transferências para investimentos no dia do pagamento.");
  if (savingsRate >= 20) tips.push("Excelente taxa de poupança! Considere diversificar investimentos entre renda fixa e variável.");
  if (tips.length === 0) tips.push("Suas finanças estão bem equilibradas. Continue monitorando mensalmente.");

  return NextResponse.json({
    nationalAverages: NATIONAL_AVERAGES,
    recommended503020: RECOMMENDED_503020,
    userDistribution: categoryPercentages,
    ratio503020,
    percentiles,
    savingsPercentile,
    radar: { categories: radarCategories, user: radarUser, national: radarNational },
    tips,
    income: Math.round(income * 100) / 100,
    expense: Math.round(expense * 100) / 100,
    savingsRate: Math.round(savingsRate * 100) / 100,
  });
}
