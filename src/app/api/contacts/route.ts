import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";

export async function GET() {
  const { error, tenant } = await requirePermission("contacts:read");
  if (error) return error;
  const contacts = await prisma.contact.findMany({
    where: { tenantId: tenant.tenantId },
    orderBy: { name: "asc" },
    include: { _count: { select: { transactions: true } } },
  });
  return NextResponse.json(contacts);
}

export async function POST(req: NextRequest) {
  const { error, tenant } = await requirePermission("contacts:write");
  if (error) return error;
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Request body is required" }, { status: 400 });
  }
  if (!body || Object.keys(body).length === 0) {
    return NextResponse.json({ error: "Request body is required" }, { status: 400 });
  }
  const contact = await prisma.contact.create({
    data: {
      name: body.name,
      phone: body.phone || null,
      email: body.email || null,
      notes: body.notes || null,
      tenantId: tenant.tenantId,
    },
  });
  return NextResponse.json(contact);
}
