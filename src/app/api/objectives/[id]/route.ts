import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, tenant } = await requirePermission("objectives:write");
  if (error) return error;
  const { id } = await params;
  const body = await req.json();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.description !== undefined) data.description = body.description;
  if (body.targetDate !== undefined) data.targetDate = new Date(body.targetDate);
  if (body.targetAmount !== undefined) data.targetAmount = parseFloat(body.targetAmount);
  if (body.priority !== undefined) data.priority = body.priority;
  if (body.status !== undefined) data.status = body.status;
  if (body.milestones !== undefined) data.milestones = JSON.stringify(body.milestones);
  const objective = await prisma.objective.update({ where: { id, tenantId: tenant.tenantId }, data });
  await logAudit("update", "objective", id, body, tenant.tenantId);
  return NextResponse.json({ ...objective, milestones: JSON.parse(objective.milestones) });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, tenant } = await requirePermission("objectives:write");
  if (error) return error;
  const { id } = await params;
  await prisma.objective.delete({ where: { id, tenantId: tenant.tenantId } });
  await logAudit("delete", "objective", id, {}, tenant.tenantId);
  return NextResponse.json({ ok: true });
}
