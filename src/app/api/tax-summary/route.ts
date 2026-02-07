import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";

export async function GET(req: NextRequest) {
  const { error, tenant } = await requirePermission("reports:read");
  if (error) return error;
  const { searchParams } = new URL(req.url);
  const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));
  
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year + 1, 0, 1);

  const transactions = await prisma.transaction.findMany({
    where: {
      tenantId: tenant.tenantId,
      taxRelevant: true,
      date: { gte: startDate, lt: endDate },
    },
    include: { category: true },
    orderBy: { date: "asc" },
  });

  const taxCategories = await prisma.taxCategory.findMany({ where: { tenantId: tenant.tenantId } });

  // Group by category
  const byCategory: Record<string, { name: string; total: number; count: number }> = {};
  for (const tx of transactions) {
    const catName = tx.category?.name || "Sem categoria";
    if (!byCategory[catName]) byCategory[catName] = { name: catName, total: 0, count: 0 };
    byCategory[catName].total += tx.amount;
    byCategory[catName].count++;
  }

  // IRPF brackets 2024
  const brackets = [
    { min: 0, max: 2259.20, rate: 0, deduction: 0 },
    { min: 2259.21, max: 2826.65, rate: 0.075, deduction: 169.44 },
    { min: 2826.66, max: 3751.05, rate: 0.15, deduction: 381.44 },
    { min: 3751.06, max: 4664.68, rate: 0.225, deduction: 662.77 },
    { min: 4664.69, max: Infinity, rate: 0.275, deduction: 896.00 },
  ];

  const totalDeductible = transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const totalIncome = transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);

  return NextResponse.json({
    year,
    transactions: transactions.length,
    totalIncome,
    totalDeductible,
    byCategory: Object.values(byCategory),
    taxCategories,
    brackets,
  });
}
