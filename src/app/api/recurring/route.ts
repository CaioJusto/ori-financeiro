import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";

export async function GET() {
  const { error, tenant } = await requirePermission("recurring:read");
  if (error) return error;
  const items = await prisma.recurring.findMany({ where: { tenantId: tenant.tenantId }, include: { account: true, category: true }, orderBy: { createdAt: "desc" } });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const { error, tenant } = await requirePermission("recurring:write");
  if (error) return error;
  const body = await req.json();
  const item = await prisma.recurring.create({
    data: {
      description: body.description, amount: parseFloat(body.amount), type: body.type,
      accountId: body.accountId, categoryId: body.categoryId, frequency: body.frequency,
      dayOfMonth: parseInt(body.dayOfMonth) || 1, active: body.active !== false,
      tenantId: tenant.tenantId,
    },
    include: { account: true, category: true },
  });
  return NextResponse.json(item);
}
