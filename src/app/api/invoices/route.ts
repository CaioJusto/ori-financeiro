import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";

export async function GET(req: NextRequest) {
  const { error, tenant } = await requirePermission("invoices:read");
  if (error) return error;
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { tenantId: tenant.tenantId };
  if (status && status !== "all") where.status = status;
  const invoices = await prisma.invoice.findMany({ where, orderBy: { createdAt: "desc" } });
  return NextResponse.json(invoices);
}

export async function POST(req: NextRequest) {
  const { error, tenant } = await requirePermission("invoices:write");
  if (error) return error;
  const body = await req.json();
  const items = body.items || [];
  const subtotal = items.reduce((s: number, i: { quantity: number; price: number }) => s + i.quantity * i.price, 0);
  const tax = body.tax ? parseFloat(body.tax) : 0;
  const total = subtotal + tax;
  // Generate invoice number
  const count = await prisma.invoice.count({ where: { tenantId: tenant.tenantId } });
  const number = `INV-${String(count + 1).padStart(5, "0")}`;
  const invoice = await prisma.invoice.create({
    data: {
      number,
      clientName: body.clientName,
      clientEmail: body.clientEmail || "",
      items: items,
      subtotal,
      tax,
      total,
      status: body.status || "DRAFT",
      dueDate: new Date(body.dueDate),
      notes: body.notes || null,
      tenantId: tenant.tenantId,
    },
  });
  return NextResponse.json(invoice);
}
