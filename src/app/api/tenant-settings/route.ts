import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";

export async function GET() {
  const { error, tenant } = await requirePermission("settings:read");
  if (error) return error;
  let settings = await prisma.tenantSettings.findUnique({ where: { tenantId: tenant.tenantId } });
  if (!settings) {
    settings = await prisma.tenantSettings.create({ data: { tenantId: tenant.tenantId } });
  }
  return NextResponse.json(settings);
}

export async function PUT(req: NextRequest) {
  const { error, tenant } = await requirePermission("settings:write");
  if (error) return error;
  const body = await req.json();
  const settings = await prisma.tenantSettings.upsert({
    where: { tenantId: tenant.tenantId },
    create: { tenantId: tenant.tenantId, ...body },
    update: body,
  });
  return NextResponse.json(settings);
}
