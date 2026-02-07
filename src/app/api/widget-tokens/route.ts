import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";
import { randomBytes } from "crypto";

export async function GET() {
  const { error, tenant } = await requirePermission("settings.view");
  if (error) return error;

  const tokens = await prisma.widgetToken.findMany({
    where: { tenantId: tenant.tenantId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(tokens);
}

export async function POST(req: NextRequest) {
  const { error, tenant } = await requirePermission("settings.edit");
  if (error) return error;

  const { widgetType, config } = await req.json();
  const token = `wgt_${randomBytes(24).toString("hex")}`;

  const wt = await prisma.widgetToken.create({
    data: {
      tenantId: tenant.tenantId,
      token,
      widgetType: widgetType || "balance-summary",
      config: config || {},
    },
  });
  return NextResponse.json(wt, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const { error, tenant } = await requirePermission("settings.edit");
  if (error) return error;

  const { id } = await req.json();
  await prisma.widgetToken.deleteMany({ where: { id, tenantId: tenant.tenantId } });
  return NextResponse.json({ ok: true });
}
