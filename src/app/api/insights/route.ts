import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";

export async function GET() {
  const { error, tenant } = await requirePermission("insights:read");
  if (error) return error;

  const now = new Date();
  const curMonth = now.getMonth(), curYear = now.getFullYear();
  const prevMonth = curMonth === 0 ? 11 : curMonth - 1;
  const prevYear = curMonth === 0 ? curYear - 1 : curYear;

  const transactions = await prisma.transaction.findMany({
    where: { tenantId: tenant.tenantId },
    include: { category: true },
  });

  const curMonthTx = transactions.filter((t) => { const d = new Date(t.date); return d.getMonth() === curMonth && d.getFullYear() === curYear; });
  const prevMonthTx = transactions.filter((t) => { const d = new Date(t.date); return d.getMonth() === prevMonth && d.getFullYear() === prevYear; });

  const insights: { icon: string; title: string; description: string; type: "info" | "warning" | "success" | "tip" }[] = [];

  const expenseByCategory = new Map<string, { name: string; total: number }>();
  for (const t of curMonthTx.filter((t) => t.type === "expense")) {
    const existing = expenseByCategory.get(t.categoryId) || { name: t.category.name, total: 0 };
    existing.total += t.amount;
    expenseByCategory.set(t.categoryId, existing);
  }
  const sortedCats = Array.from(expenseByCategory.values()).sort((a, b) => b.total - a.total);
  if (sortedCats.length > 0) {
    insights.push({ icon: "📊", title: "Maior gasto do mês", description: `Seu maior gasto este mês foi em ${sortedCats[0].name}: R$ ${sortedCats[0].total.toFixed(2)}`, type: "info" });
  }

  const curExpense = curMonthTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const prevExpense = prevMonthTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  if (prevExpense > 0) {
    const pctChange = ((curExpense - prevExpense) / prevExpense) * 100;
    if (pctChange > 0) {
      insights.push({ icon: "📈", title: "Gastos aumentaram", description: `Você gastou ${pctChange.toFixed(1)}% a mais que no mês passado`, type: "warning" });
    } else {
      insights.push({ icon: "📉", title: "Gastos reduziram", description: `Você gastou ${Math.abs(pctChange).toFixed(1)}% a menos que no mês passado`, type: "success" });
    }
  }

  const monthCategoryMap = new Map<string, Set<string>>();
  for (const t of transactions.filter((t) => t.type === "expense")) {
    const d = new Date(t.date);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (!monthCategoryMap.has(t.category.name)) monthCategoryMap.set(t.category.name, new Set());
    monthCategoryMap.get(t.category.name)!.add(key);
  }
  let mostConsistent = { name: "", count: 0 };
  for (const [name, months] of monthCategoryMap) {
    if (months.size > mostConsistent.count) mostConsistent = { name, count: months.size };
  }
  if (mostConsistent.name) {
    insights.push({ icon: "🔄", title: "Categoria mais consistente", description: `${mostConsistent.name} aparece em ${mostConsistent.count} meses diferentes`, type: "info" });
  }

  if (sortedCats.length > 0) {
    const saving = sortedCats[0].total * 0.1;
    insights.push({ icon: "💡", title: "Economia potencial", description: `Se reduzir ${sortedCats[0].name} em 10%, economiza R$ ${saving.toFixed(2)}/mês`, type: "tip" });
  }

  const curIncome = curMonthTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  if (curIncome > 0 && curExpense > 0) {
    const savingsRate = ((curIncome - curExpense) / curIncome) * 100;
    insights.push({
      icon: savingsRate > 0 ? "✅" : "⚠️",
      title: "Taxa de poupança",
      description: savingsRate > 0
        ? `Você está poupando ${savingsRate.toFixed(1)}% da sua renda este mês`
        : `Seus gastos excedem sua renda em ${Math.abs(savingsRate).toFixed(1)}%`,
      type: savingsRate > 0 ? "success" : "warning",
    });
  }

  return NextResponse.json(insights);
}
