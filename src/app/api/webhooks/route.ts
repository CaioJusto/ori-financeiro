import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";
import { randomBytes } from "crypto";

export async function GET() {
  const { error, tenant } = await requirePermission("settings.edit");
  if (error) return error;

  const webhooks = await prisma.webhook.findMany({
    where: { tenantId: tenant.tenantId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(webhooks);
}

export async function POST(req: NextRequest) {
  const { error, tenant } = await requirePermission("settings.edit");
  if (error) return error;

  const { url, events } = await req.json();
  if (!url) return NextResponse.json({ error: "URL required" }, { status: 400 });

  const webhook = await prisma.webhook.create({
    data: {
      url,
      events: events || ["transaction.created"],
      secret: randomBytes(32).toString("hex"),
      tenantId: tenant.tenantId,
    },
  });

  return NextResponse.json(webhook, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const { error, tenant } = await requirePermission("settings.edit");
  if (error) return error;

  const { id } = await req.json();
  await prisma.webhook.deleteMany({ where: { id, tenantId: tenant.tenantId } });
  return NextResponse.json({ ok: true });
}
