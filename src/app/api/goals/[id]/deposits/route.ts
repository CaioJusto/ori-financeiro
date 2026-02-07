import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, tenant } = await requirePermission("goals:read");
  if (error) return error;
  const { id } = await params;
  const deposits = await prisma.goalDeposit.findMany({
    where: { goalId: id, tenantId: tenant.tenantId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(deposits);
}
