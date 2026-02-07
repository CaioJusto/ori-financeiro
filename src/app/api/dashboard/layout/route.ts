import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";

export async function GET() {
  const { error, tenant } = await requirePermission("dashboard:read");
  if (error) return error;
  const layout = await prisma.userDashboardLayout.findUnique({ where: { userId: tenant.userId } });
  return NextResponse.json(layout?.layout || null);
}

export async function PUT(req: NextRequest) {
  const { error, tenant } = await requirePermission("dashboard:read");
  if (error) return error;
  const body = await req.json();
  const layout = await prisma.userDashboardLayout.upsert({
    where: { userId: tenant.userId },
    create: { userId: tenant.userId, layout: body.layout, tenantId: tenant.tenantId },
    update: { layout: body.layout },
  });
  return NextResponse.json(layout);
}
