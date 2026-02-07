import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, tenant } = await requirePermission("payables:write");
  if (error) return error;
  const { id } = await params;
  const body = await req.json();
  const payable = await prisma.payable.update({
    where: { id, tenantId: tenant.tenantId },
    data: {
      description: body.description,
      amount: parseFloat(body.amount),
      type: body.type,
      dueDate: new Date(body.dueDate),
      accountId: body.accountId || null,
      categoryId: body.categoryId || null,
      contactName: body.contactName || null,
    },
  });
  return NextResponse.json(payable);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, tenant } = await requirePermission("payables:write");
  if (error) return error;
  const { id } = await params;
  await prisma.payable.delete({ where: { id, tenantId: tenant.tenantId } });
  return NextResponse.json({ ok: true });
}
