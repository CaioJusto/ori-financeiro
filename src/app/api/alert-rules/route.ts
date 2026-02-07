import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";

export async function GET() {
  const { error, tenant } = await requirePermission("settings.view");
  if (error) return error;

  const rules = await prisma.alertRule.findMany({
    where: { tenantId: tenant.tenantId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(rules);
}

export async function POST(req: NextRequest) {
  const { error, tenant } = await requirePermission("settings.edit");
  if (error) return error;

  const { name, condition, action } = await req.json();
  if (!name || !condition || !action) {
    return NextResponse.json({ error: "name, condition, action required" }, { status: 400 });
  }

  const rule = await prisma.alertRule.create({
    data: { tenantId: tenant.tenantId, name, condition, action },
  });
  return NextResponse.json(rule, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const { error, tenant } = await requirePermission("settings.edit");
  if (error) return error;

  const { id, ...data } = await req.json();
  const rule = await prisma.alertRule.updateMany({
    where: { id, tenantId: tenant.tenantId },
    data,
  });
  return NextResponse.json(rule);
}

export async function DELETE(req: NextRequest) {
  const { error, tenant } = await requirePermission("settings.edit");
  if (error) return error;

  const { id } = await req.json();
  await prisma.alertRule.deleteMany({ where: { id, tenantId: tenant.tenantId } });
  return NextResponse.json({ ok: true });
}
