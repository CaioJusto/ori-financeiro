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

  const data: Record<string, unknown> = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.primaryColor !== undefined) data.primaryColor = body.primaryColor;
  if (body.secondaryColor !== undefined) data.secondaryColor = body.secondaryColor;
  if (body.accentColor !== undefined) data.accentColor = body.accentColor;
  if (body.logoUrl !== undefined) data.logoUrl = body.logoUrl;
  if (body.systemName !== undefined) data.systemName = body.systemName;
  if (body.favicon !== undefined) data.favicon = body.favicon;

  const t = await prisma.tenant.update({
    where: { id: tenant.tenantId },
    data,
  });
  return NextResponse.json(t);
}
