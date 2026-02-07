import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, tenant } = await requirePermission("transactions:write");
  if (error) return error;
  const { id } = await params;
  const body = await req.json();
  const template = await prisma.transactionTemplate.update({
    where: { id, tenantId: tenant.tenantId },
    data: { name: body.name, description: body.description, amount: body.amount, type: body.type, categoryId: body.categoryId, accountId: body.accountId },
  });
  return NextResponse.json(template);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error, tenant } = await requirePermission("transactions:write");
  if (error) return error;
  const { id } = await params;
  await prisma.transactionTemplate.delete({ where: { id, tenantId: tenant.tenantId } });
  return NextResponse.json({ ok: true });
}
