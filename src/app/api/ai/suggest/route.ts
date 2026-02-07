import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";

export async function GET(req: NextRequest) {
  const { error, tenant } = await requirePermission("transactions.view");
  if (error) return error;

  const q = req.nextUrl.searchParams.get("q") || "";
  if (q.length < 2) return NextResponse.json([]);

  const transactions = await prisma.transaction.findMany({
    where: { tenantId: tenant.tenantId, description: { contains: q, mode: "insensitive" } },
    select: { description: true, amount: true, type: true, categoryId: true, category: { select: { name: true } } },
    distinct: ["description"],
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return NextResponse.json(transactions.map(t => ({
    description: t.description,
    amount: t.amount,
    type: t.type,
    categoryId: t.categoryId,
    categoryName: t.category.name,
  })));
}
