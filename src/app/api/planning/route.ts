import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";

export async function GET(req: NextRequest) {
  const { error, tenant } = await requirePermission("planning:read");
  if (error) return error;
  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { tenantId: tenant.tenantId };
  if (month) where.month = month;
  const plannings = await prisma.planning.findMany({
    where,
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(plannings);
}

export async function POST(req: NextRequest) {
  const { error, tenant } = await requirePermission("planning:write");
  if (error) return error;
  const body = await req.json();
  const planning = await prisma.planning.create({
    data: {
      month: body.month,
      categoryId: body.categoryId,
      plannedAmount: parseFloat(body.plannedAmount),
      tenantId: tenant.tenantId,
    },
    include: { category: true },
  });
  return NextResponse.json(planning);
}
