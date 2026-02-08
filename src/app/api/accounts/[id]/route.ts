import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, tenant } = await requirePermission("accounts:read");
  if (error) return error;
  const { id } = await params;
  const account = await prisma.account.findUnique({ where: { id, tenantId: tenant.tenantId } });
  if (!account) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(account);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, tenant } = await requirePermission("accounts:write");
  if (error) return error;
  const { id } = await params;
  const body = await req.json();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { balance, transactions, transfersFrom, transfersTo, id: _id, tenantId: _tid, createdAt, ...data } = body;
  const account = await prisma.account.update({ where: { id, tenantId: tenant.tenantId }, data });
  return NextResponse.json(account);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, tenant } = await requirePermission("accounts:write");
  if (error) return error;
  const { id } = await params;
  await prisma.account.delete({ where: { id, tenantId: tenant.tenantId } });
  return NextResponse.json({ ok: true });
}
