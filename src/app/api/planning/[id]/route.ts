import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, tenant } = await requirePermission("planning:write");
  if (error) return error;
  const { id } = await params;
  const body = await req.json();
  const planning = await prisma.planning.update({
    where: { id, tenantId: tenant.tenantId },
    data: {
      month: body.month,
      categoryId: body.categoryId,
      plannedAmount: parseFloat(body.plannedAmount),
    },
    include: { category: true },
  });
  return NextResponse.json(planning);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, tenant } = await requirePermission("planning:write");
  if (error) return error;
  const { id } = await params;
  await prisma.planning.delete({ where: { id, tenantId: tenant.tenantId } });
  return NextResponse.json({ ok: true });
}
