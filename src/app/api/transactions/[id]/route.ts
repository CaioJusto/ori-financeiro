import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, tenant } = await requirePermission("transactions:read");
  if (error) return error;
  const { id } = await params;
  const transaction = await prisma.transaction.findUnique({
    where: { id, tenantId: tenant.tenantId },
    include: { account: true, category: true, tags: { include: { tag: true } } },
  });
  if (!transaction) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(transaction);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, tenant } = await requirePermission("transactions:write");
  if (error) return error;
  const { id } = await params;
  await prisma.transaction.delete({ where: { id, tenantId: tenant.tenantId } });
  await logAudit("delete", "transaction", id, {}, tenant.tenantId);
  return NextResponse.json({ ok: true });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, tenant } = await requirePermission("transactions:write");
  if (error) return error;
  const { id } = await params;
  const body = await req.json();
  const data: Record<string, unknown> = {};
  if (body.notes !== undefined) data.notes = body.notes;
  if (body.description !== undefined) data.description = body.description;
  if (body.amount !== undefined) data.amount = parseFloat(body.amount);
  const transaction = await prisma.transaction.update({
    where: { id, tenantId: tenant.tenantId },
    data,
    include: { account: true, category: true, tags: { include: { tag: true } } },
  });
  await logAudit("update", "transaction", id, body, tenant.tenantId);
  return NextResponse.json(transaction);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, tenant } = await requirePermission("transactions:write");
  if (error) return error;
  const { id } = await params;
  const url = new URL(req.url);
  if (url.searchParams.get("action") === "duplicate") {
    const original = await prisma.transaction.findUnique({
      where: { id, tenantId: tenant.tenantId },
      include: { tags: true },
    });
    if (!original) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const duplicate = await prisma.transaction.create({
      data: {
        description: original.description,
        amount: original.amount,
        type: original.type,
        date: new Date(),
        accountId: original.accountId,
        categoryId: original.categoryId,
        notes: original.notes,
        tenantId: tenant.tenantId,
        ...(original.tags.length > 0
          ? { tags: { create: original.tags.map((t) => ({ tagId: t.tagId })) } }
          : {}),
      },
      include: { account: true, category: true, tags: { include: { tag: true } } },
    });
    return NextResponse.json(duplicate);
  }
  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
