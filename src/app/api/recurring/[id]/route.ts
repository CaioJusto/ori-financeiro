import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, tenant } = await requirePermission("recurring:write");
  if (error) return error;
  const { id } = await params;
  const body = await req.json();
  const data: Record<string, unknown> = {};
  if (body.description !== undefined) data.description = body.description;
  if (body.amount !== undefined) data.amount = parseFloat(body.amount);
  if (body.type !== undefined) data.type = body.type;
  if (body.accountId !== undefined) data.accountId = body.accountId;
  if (body.categoryId !== undefined) data.categoryId = body.categoryId;
  if (body.frequency !== undefined) data.frequency = body.frequency;
  if (body.dayOfMonth !== undefined) data.dayOfMonth = parseInt(body.dayOfMonth as string);
  if (body.active !== undefined) data.active = body.active;
  const item = await prisma.recurring.update({ where: { id, tenantId: tenant.tenantId }, data, include: { account: true, category: true } });
  return NextResponse.json(item);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, tenant } = await requirePermission("recurring:write");
  if (error) return error;
  const { id } = await params;
  await prisma.recurring.delete({ where: { id, tenantId: tenant.tenantId } });
  return NextResponse.json({ ok: true });
}
