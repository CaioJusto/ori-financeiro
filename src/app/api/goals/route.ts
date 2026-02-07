import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";

export async function GET() {
  const { error, tenant } = await requirePermission("goals:read");
  if (error) return error;
  const goals = await prisma.savingsGoal.findMany({ where: { tenantId: tenant.tenantId }, orderBy: { createdAt: "desc" } });
  return NextResponse.json(goals);
}

export async function POST(req: NextRequest) {
  const { error, tenant } = await requirePermission("goals:write");
  if (error) return error;
  const body = await req.json();
  const goal = await prisma.savingsGoal.create({
    data: {
      name: body.name, targetAmount: parseFloat(body.targetAmount),
      currentAmount: parseFloat(body.currentAmount || "0"),
      deadline: body.deadline ? new Date(body.deadline) : null,
      tenantId: tenant.tenantId,
    },
  });
  return NextResponse.json(goal);
}
