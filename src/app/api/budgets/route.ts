import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";

export async function GET() {
  const { error, tenant } = await requirePermission("budgets:read");
  if (error) return error;
  const budgets = await prisma.budget.findMany({ where: { tenantId: tenant.tenantId }, include: { category: true }, orderBy: { month: "desc" } });
  return NextResponse.json(budgets);
}

export async function POST(req: NextRequest) {
  const { error, tenant } = await requirePermission("budgets:write");
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
  if (!body.categoryId || !body.amount) {
    return NextResponse.json({ error: "categoryId and amount are required" }, { status: 400 });
  }
  const month = body.month || new Date().toISOString().slice(0, 7);
  try {
    const budget = await prisma.budget.create({
      data: { categoryId: body.categoryId, amount: parseFloat(body.amount), month, tenantId: tenant.tenantId },
      include: { category: true },
    });
    return NextResponse.json(budget);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    if (msg.includes("Foreign key constraint")) {
      return NextResponse.json({ error: "Invalid categoryId" }, { status: 400 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
