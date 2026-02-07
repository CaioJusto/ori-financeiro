import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, tenant } = await requirePermission("budgets:write");
  if (error) return error;
  const { id } = await params;
  const body = await req.json();
  const budget = await prisma.budget.update({
    where: { id, tenantId: tenant.tenantId },
    data: { categoryId: body.categoryId, amount: parseFloat(body.amount), month: body.month },
    include: { category: true },
  });
  return NextResponse.json(budget);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, tenant } = await requirePermission("budgets:write");
  if (error) return error;
  const { id } = await params;
  await prisma.budget.delete({ where: { id, tenantId: tenant.tenantId } });
  return NextResponse.json({ ok: true });
}
