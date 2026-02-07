import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, tenant } = await requirePermission("goals:write");
  if (error) return error;
  const { id } = await params;
  const body = await req.json();
  const data: Record<string, unknown> = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.targetAmount !== undefined) data.targetAmount = parseFloat(body.targetAmount);
  if (body.currentAmount !== undefined) data.currentAmount = parseFloat(body.currentAmount);
  if (body.deadline !== undefined) data.deadline = body.deadline ? new Date(body.deadline) : null;
  const goal = await prisma.savingsGoal.update({ where: { id, tenantId: tenant.tenantId }, data });
  return NextResponse.json(goal);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, tenant } = await requirePermission("goals:write");
  if (error) return error;
  const { id } = await params;
  await prisma.savingsGoal.delete({ where: { id, tenantId: tenant.tenantId } });
  return NextResponse.json({ ok: true });
}
