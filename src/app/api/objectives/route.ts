import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";

export async function GET() {
  const { error, tenant } = await requirePermission("objectives:read");
  if (error) return error;
  const objectives = await prisma.objective.findMany({ where: { tenantId: tenant.tenantId }, orderBy: { createdAt: "desc" } });
  return NextResponse.json(objectives.map(o => ({ ...o, milestones: JSON.parse(o.milestones) })));
}

export async function POST(req: NextRequest) {
  const { error, tenant } = await requirePermission("objectives:write");
  if (error) return error;
  const body = await req.json();
  const objective = await prisma.objective.create({
    data: {
      name: body.name,
      description: body.description || null,
      targetDate: new Date(body.targetDate),
      targetAmount: parseFloat(body.targetAmount),
      priority: body.priority || "medium",
      status: body.status || "active",
      milestones: JSON.stringify(body.milestones || []),
      tenantId: tenant.tenantId,
    },
  });
  await logAudit("create", "objective", objective.id, body, tenant.tenantId);
  return NextResponse.json({ ...objective, milestones: JSON.parse(objective.milestones) }, { status: 201 });
}
