import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, tenant } = await requirePermission("credit-cards:write");
  if (error) return error;
  const { id } = await params;
  const body = await req.json();
  const card = await prisma.creditCard.update({
    where: { id, tenantId: tenant.tenantId },
    data: {
      name: body.name,
      cardLimit: body.cardLimit ? parseFloat(body.cardLimit) : undefined,
      closingDay: body.closingDay ? parseInt(body.closingDay) : undefined,
      dueDay: body.dueDay ? parseInt(body.dueDay) : undefined,
      color: body.color,
    },
  });
  return NextResponse.json(card);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, tenant } = await requirePermission("credit-cards:write");
  if (error) return error;
  const { id } = await params;
  await prisma.creditCard.delete({ where: { id, tenantId: tenant.tenantId } });
  return NextResponse.json({ ok: true });
}
