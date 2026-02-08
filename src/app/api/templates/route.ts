import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";

export async function GET() {
  const { error, tenant } = await requirePermission("transactions:read");
  if (error) return error;
  const templates = await prisma.transactionTemplate.findMany({
    where: { tenantId: tenant.tenantId },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(templates);
}

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
  if (!body.name || !body.categoryId || !body.accountId) {
    return NextResponse.json({ error: "name, categoryId, and accountId are required" }, { status: 400 });
  }
  const template = await prisma.transactionTemplate.create({
    data: {
      name: body.name,
      description: body.description || "",
      amount: body.amount || 0,
      type: body.type || "expense",
      categoryId: body.categoryId,
      accountId: body.accountId,
      contactId: body.contactId || null,
      tenantId: tenant.tenantId,
    },
  });
  return NextResponse.json(template);
}
