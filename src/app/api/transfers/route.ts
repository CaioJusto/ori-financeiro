import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";

export async function GET() {
  const { error, tenant } = await requirePermission("transfers:read");
  if (error) return error;
  const transfers = await prisma.transfer.findMany({
    where: { tenantId: tenant.tenantId },
    include: { fromAccount: true, toAccount: true },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(transfers);
}

export async function POST(req: NextRequest) {
  const { error, tenant } = await requirePermission("transfers:write");
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
  const transfer = await prisma.transfer.create({
    data: {
      amount: parseFloat(body.amount),
      description: body.description || "Transferência",
      fromAccountId: body.fromAccountId,
      toAccountId: body.toAccountId,
      date: new Date(body.date),
      tenantId: tenant.tenantId,
    },
    include: { fromAccount: true, toAccount: true },
  });
  return NextResponse.json(transfer);
}
