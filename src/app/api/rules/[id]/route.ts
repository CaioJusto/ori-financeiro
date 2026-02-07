import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, tenant } = await requirePermission("rules:write");
  if (error) return error;
  const { id } = await params;
  const body = await req.json();
  const rule = await prisma.rule.update({
    where: { id, tenantId: tenant.tenantId },
    data: {
      pattern: body.pattern,
      categoryId: body.categoryId || null,
      accountId: body.accountId || null,
      tagIds: body.tagIds ? JSON.stringify(body.tagIds) : null,
      active: body.active,
    },
  });
  return NextResponse.json(rule);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, tenant } = await requirePermission("rules:write");
  if (error) return error;
  const { id } = await params;
  await prisma.rule.delete({ where: { id, tenantId: tenant.tenantId } });
  return NextResponse.json({ ok: true });
}
