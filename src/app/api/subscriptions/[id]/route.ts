import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, tenant } = await requirePermission("subscriptions:write");
  if (error) return error;
  const { id } = await params;
  const body = await req.json();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.provider !== undefined) data.provider = body.provider;
  if (body.amount !== undefined) data.amount = parseFloat(body.amount);
  if (body.currency !== undefined) data.currency = body.currency;
  if (body.billingCycle !== undefined) data.billingCycle = body.billingCycle;
  if (body.nextBillingDate !== undefined) data.nextBillingDate = new Date(body.nextBillingDate);
  if (body.category !== undefined) data.category = body.category;
  if (body.status !== undefined) data.status = body.status;
  if (body.notes !== undefined) data.notes = body.notes;
  if (body.logoUrl !== undefined) data.logoUrl = body.logoUrl;
  if (body.status === "CANCELLED") data.cancelDate = new Date();
  const subscription = await prisma.subscription.update({ where: { id }, data });
  return NextResponse.json(subscription);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, tenant } = await requirePermission("subscriptions:write");
  if (error) return error;
  const { id } = await params;
  await prisma.subscription.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
