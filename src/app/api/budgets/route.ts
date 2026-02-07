import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";

export async function GET() {
  const { error, tenant } = await requirePermission("budgets:read");
  if (error) return error;
  const budgets = await prisma.budget.findMany({ where: { tenantId: tenant.tenantId }, include: { category: true }, orderBy: { month: "desc" } });
  return NextResponse.json(budgets);
}

export async function POST(req: NextRequest) {
  const { error, tenant } = await requirePermission("budgets:write");
  if (error) return error;
  const body = await req.json();
  const budget = await prisma.budget.create({
    data: { categoryId: body.categoryId, amount: parseFloat(body.amount), month: body.month, tenantId: tenant.tenantId },
    include: { category: true },
  });
  return NextResponse.json(budget);
}
