import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";

export async function GET(req: NextRequest) {
  const { error, tenant } = await requirePermission("payables:read");
  if (error) return error;
  const { searchParams } = new URL(req.url);
  const filter = searchParams.get("filter");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { tenantId: tenant.tenantId };
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  if (filter === "overdue") {
    where.paid = false;
    where.dueDate = { lt: now };
  } else if (filter === "upcoming") {
    where.paid = false;
    where.dueDate = { gte: now };
  } else if (filter === "paid") {
    where.paid = true;
  }
  const payables = await prisma.payable.findMany({ where, orderBy: { dueDate: "asc" } });
  return NextResponse.json(payables);
}

export async function POST(req: NextRequest) {
  const { error, tenant } = await requirePermission("payables:write");
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
  const payable = await prisma.payable.create({
    data: {
      description: body.description,
      amount: parseFloat(body.amount),
      type: body.type || "expense",
      dueDate: new Date(body.dueDate),
      accountId: body.accountId || null,
      categoryId: body.categoryId || null,
      contactName: body.contactName || null,
      tenantId: tenant.tenantId,
    },
  });
  return NextResponse.json(payable);
}
