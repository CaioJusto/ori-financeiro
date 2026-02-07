import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";

export async function GET() {
  const { error, tenant } = await requirePermission("accounts:read");
  if (error) return error;
  const groups = await prisma.accountGroup.findMany({
    where: { tenantId: tenant.tenantId },
    include: { accounts: true },
    orderBy: { order: "asc" },
  });
  return NextResponse.json(groups);
}

export async function POST(req: NextRequest) {
  const { error, tenant } = await requirePermission("accounts:write");
  if (error) return error;
  const body = await req.json();
  const group = await prisma.accountGroup.create({
    data: { name: body.name, color: body.color || "#6b7280", order: body.order || 0, tenantId: tenant.tenantId },
  });
  return NextResponse.json(group);
}
