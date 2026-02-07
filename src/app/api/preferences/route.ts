import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";

export async function GET() {
  const { error, tenant } = await requirePermission("dashboard:read");
  if (error) return error;
  let prefs = await prisma.userPreference.findUnique({ where: { userId: tenant.userId } });
  if (!prefs) {
    prefs = await prisma.userPreference.create({ data: { userId: tenant.userId, tenantId: tenant.tenantId } });
  }
  return NextResponse.json(prefs);
}

export async function PUT(req: NextRequest) {
  const { error, tenant } = await requirePermission("dashboard:read");
  if (error) return error;
  const body = await req.json();
  const prefs = await prisma.userPreference.upsert({
    where: { userId: tenant.userId },
    create: { userId: tenant.userId, tenantId: tenant.tenantId, ...body },
    update: body,
  });
  return NextResponse.json(prefs);
}
