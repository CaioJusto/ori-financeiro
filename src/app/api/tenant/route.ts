import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";

export async function GET() {
  const { error, tenant } = await requirePermission("dashboard:read");
  if (error) return error;
  const t = await prisma.tenant.findUnique({ where: { id: tenant.tenantId } });
  if (!t) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  return NextResponse.json(t);
}

export async function PUT(req: NextRequest) {
  const { error, tenant } = await requirePermission("dashboard:read");
  if (error) return error;
  const body = await req.json();

  const allowedFields = [
    "name", "primaryColor", "secondaryColor", "accentColor",
    "backgroundColor", "textColor", "sidebarColor", "themeMode",
    "logoUrl", "logoBase64", "faviconBase64", "systemName", "favicon",
  ];

  const data: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (body[field] !== undefined) data[field] = body[field];
  }

  const t = await prisma.tenant.update({
    where: { id: tenant.tenantId },
    data,
  });
  return NextResponse.json(t);
}
