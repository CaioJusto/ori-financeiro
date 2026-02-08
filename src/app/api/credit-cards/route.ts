import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";

export async function GET() {
  const { error, tenant } = await requirePermission("credit-cards:read");
  if (error) return error;
  const cards = await prisma.creditCard.findMany({
    where: { tenantId: tenant.tenantId },
    include: { transactions: true },
    orderBy: { createdAt: "asc" },
  });

  const result = cards.map((c) => {
    const used = c.transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    return { ...c, used, available: c.cardLimit - used, transactions: undefined };
  });

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const { error, tenant } = await requirePermission("credit-cards:write");
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
  const card = await prisma.creditCard.create({
    data: {
      name: body.name,
      cardLimit: parseFloat(body.cardLimit || body.limit || 0),
      closingDay: parseInt(body.closingDay || body.closingDay || 1),
      dueDay: parseInt(body.dueDay || body.dueDay || 10),
      color: body.color || "#8b5cf6",
      tenantId: tenant.tenantId,
    },
  });
  return NextResponse.json(card);
}
