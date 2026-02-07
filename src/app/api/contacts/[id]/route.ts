import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, tenant } = await requirePermission("contacts:read");
  if (error) return error;
  const { id } = await params;
  const contact = await prisma.contact.findUnique({
    where: { id, tenantId: tenant.tenantId },
    include: {
      transactions: {
        include: { category: true, account: true },
        orderBy: { date: "desc" },
      },
    },
  });
  if (!contact) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(contact);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, tenant } = await requirePermission("contacts:write");
  if (error) return error;
  const { id } = await params;
  const body = await req.json();
  const contact = await prisma.contact.update({
    where: { id, tenantId: tenant.tenantId },
    data: {
      name: body.name,
      phone: body.phone || null,
      email: body.email || null,
      notes: body.notes || null,
    },
  });
  return NextResponse.json(contact);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, tenant } = await requirePermission("contacts:write");
  if (error) return error;
  const { id } = await params;
  await prisma.contact.delete({ where: { id, tenantId: tenant.tenantId } });
  return NextResponse.json({ ok: true });
}
