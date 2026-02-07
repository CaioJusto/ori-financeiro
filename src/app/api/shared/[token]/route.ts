import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const report = await prisma.sharedReport.findUnique({ where: { token } });
  if (!report) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (new Date() > report.expiresAt) return NextResponse.json({ error: "Expired" }, { status: 410 });

  const filters = JSON.parse(report.filters);
  const tid = report.tenantId;

  let data: unknown = null;
  if (report.reportType === "monthly") {
    const month = filters.month || new Date().toISOString().slice(0, 7);
    const [year, m] = month.split("-").map(Number);
    const from = new Date(year, m - 1, 1);
    const to = new Date(year, m, 0, 23, 59, 59);
    const transactions = await prisma.transaction.findMany({
      where: { date: { gte: from, lte: to }, tenantId: tid },
      include: { category: true, account: true },
      orderBy: { date: "desc" },
    });
    const income = transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expense = transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    data = { month, transactions, income, expense, balance: income - expense };
  } else if (report.reportType === "category") {
    const transactions = await prisma.transaction.findMany({
      include: { category: true },
      where: { type: "expense", tenantId: tid },
    });
    const catMap = new Map<string, { name: string; total: number; count: number }>();
    for (const t of transactions) {
      const e = catMap.get(t.categoryId) || { name: t.category.name, total: 0, count: 0 };
      e.total += t.amount; e.count++;
      catMap.set(t.categoryId, e);
    }
    data = { categories: Array.from(catMap.values()).sort((a, b) => b.total - a.total) };
  } else {
    const transactions = await prisma.transaction.findMany({
      where: { tenantId: tid },
      include: { category: true, account: true },
      orderBy: { date: "desc" },
      take: 50,
    });
    data = { transactions };
  }

  return NextResponse.json({ reportType: report.reportType, filters, createdAt: report.createdAt, expiresAt: report.expiresAt, data });
}
