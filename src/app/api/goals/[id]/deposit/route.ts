import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, tenant } = await requirePermission("goals:write");
  if (error) return error;
  const { id } = await params;
  const body = await req.json();
  const amount = parseFloat(body.amount);
  const note = body.note || null;

  await prisma.goalDeposit.create({
    data: { goalId: id, amount, note, tenantId: tenant.tenantId },
  });

  const goal = await prisma.savingsGoal.update({
    where: { id, tenantId: tenant.tenantId },
    data: { currentAmount: { increment: amount } },
  });
  return NextResponse.json(goal);
}
