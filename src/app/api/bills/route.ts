import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";

export async function POST(req: NextRequest) {
  const { error, tenant } = await requirePermission("transactions:write");
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
  if (!body.description || !body.amount) {
    return NextResponse.json({ error: "description and amount are required" }, { status: 400 });
  }
  const accountId = body.accountId || (await prisma.account.findFirst({ where: { tenantId: tenant.tenantId } }))?.id;
  const categoryId = body.categoryId || (await prisma.category.findFirst({ where: { tenantId: tenant.tenantId, type: "expense" } }))?.id;
  if (!accountId || !categoryId) {
    return NextResponse.json({ error: "No account or category available" }, { status: 400 });
  }
  const bill = await prisma.transaction.create({
    data: {
      description: body.description,
      amount: parseFloat(body.amount),
      type: "expense",
      date: body.dueDate ? new Date(body.dueDate) : new Date(),
      accountId,
      categoryId,
      tenantId: tenant.tenantId,
    },
  });
  return NextResponse.json(bill);
}

export async function GET() {
  const { error, tenant } = await requirePermission("transactions:read");
  if (error) return error;
  const bills = await prisma.transaction.findMany({
    where: { tenantId: tenant.tenantId, type: "expense" },
    include: { account: true, category: true },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(bills);
}
