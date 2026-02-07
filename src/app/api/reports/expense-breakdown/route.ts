import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const tenantId = (session.user as any).tenantId;
  const { searchParams } = new URL(req.url);
  const startDate = searchParams.get("startDate") || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
  const endDate = searchParams.get("endDate") || new Date().toISOString();

  const transactions = await prisma.transaction.findMany({
    where: { tenantId, type: "expense", date: { gte: new Date(startDate), lte: new Date(endDate) } },
    include: { category: { include: { parent: true } } },
  });

  const categoryMap: Record<string, { name: string; color: string; total: number; children: Record<string, { name: string; total: number }> }> = {};

  transactions.forEach(t => {
    const parentName = t.category.parent?.name || t.category.name;
    const parentColor = t.category.parent?.color || t.category.color;
    if (!categoryMap[parentName]) categoryMap[parentName] = { name: parentName, color: parentColor, total: 0, children: {} };
    categoryMap[parentName].total += t.amount;
    if (t.category.parent) {
      const childName = t.category.name;
      if (!categoryMap[parentName].children[childName]) categoryMap[parentName].children[childName] = { name: childName, total: 0 };
      categoryMap[parentName].children[childName].total += t.amount;
    }
  });

  const breakdown = Object.values(categoryMap)
    .map(c => ({ ...c, children: Object.values(c.children).sort((a, b) => b.total - a.total) }))
    .sort((a, b) => b.total - a.total);

  return NextResponse.json(breakdown);
}
