import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";
import { randomBytes, createHash } from "crypto";

export async function GET() {
  const { error, tenant } = await requirePermission("settings.edit");
  if (error) return error;

  const keys = await prisma.apiKey.findMany({
    where: { tenantId: tenant.tenantId },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, keyPrefix: true, permissions: true, lastUsed: true, expiresAt: true, active: true, createdAt: true },
  });

  return NextResponse.json(keys);
}

export async function POST(req: NextRequest) {
  const { error, tenant } = await requirePermission("settings.edit");
  if (error) return error;

  const { name, permissions, expiresAt } = await req.json();
  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const rawKey = `ori_${randomBytes(32).toString("hex")}`;
  const keyHash = createHash("sha256").update(rawKey).digest("hex");
  const keyPrefix = rawKey.slice(0, 12);

  const key = await prisma.apiKey.create({
    data: {
      name,
      keyHash,
      keyPrefix,
      permissions: permissions || [],
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      tenantId: tenant.tenantId,
    },
  });

  return NextResponse.json({ ...key, rawKey }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const { error, tenant } = await requirePermission("settings.edit");
  if (error) return error;

  const { id } = await req.json();
  await prisma.apiKey.deleteMany({ where: { id, tenantId: tenant.tenantId } });
  return NextResponse.json({ ok: true });
}
