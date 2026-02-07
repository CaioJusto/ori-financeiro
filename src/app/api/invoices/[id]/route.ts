import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, tenant } = await requirePermission("invoices:read");
  if (error) return error;
  const { id } = await params;
  const invoice = await prisma.invoice.findFirst({ where: { id, tenantId: tenant.tenantId } });
  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(invoice);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, tenant } = await requirePermission("invoices:write");
  if (error) return error;
  const { id } = await params;
  const body = await req.json();
  const items = body.items || [];
  const subtotal = items.reduce((s: number, i: { quantity: number; price: number }) => s + i.quantity * i.price, 0);
  const tax = body.tax ? parseFloat(body.tax) : 0;
  const total = subtotal + tax;
  const invoice = await prisma.invoice.update({
    where: { id },
    data: {
      clientName: body.clientName,
      clientEmail: body.clientEmail || "",
      items,
      subtotal,
      tax,
      total,
      status: body.status,
      dueDate: new Date(body.dueDate),
      notes: body.notes || null,
    },
  });
  return NextResponse.json(invoice);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, tenant } = await requirePermission("invoices:write");
  if (error) return error;
  const { id } = await params;
  await prisma.invoice.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
