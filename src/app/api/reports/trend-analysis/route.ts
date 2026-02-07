import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const tenantId = (session.user as any).tenantId;

  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  const transactions = await prisma.transaction.findMany({
    where: { tenantId, type: "expense", date: { gte: twelveMonthsAgo } },
    include: { category: true },
  });

  const categories = new Set<string>();
  const monthlyData: Record<string, Record<string, number>> = {};

  transactions.forEach(t => {
    const month = t.date.toISOString().slice(0, 7);
    const cat = t.category.name;
    categories.add(cat);
    if (!monthlyData[month]) monthlyData[month] = {};
    monthlyData[month][cat] = (monthlyData[month][cat] || 0) + t.amount;
  });

  const months = Object.keys(monthlyData).sort();
  const series = months.map(m => ({ month: m, ...monthlyData[m] }));

  return NextResponse.json({ categories: Array.from(categories), series });
}
