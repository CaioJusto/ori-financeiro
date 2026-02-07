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
  const body = await req.json();
  const template = await prisma.transactionTemplate.create({
    data: {
      name: body.name,
      description: body.description,
      amount: body.amount,
      type: body.type,
      categoryId: body.categoryId,
      accountId: body.accountId,
      contactId: body.contactId || null,
      tenantId: tenant.tenantId,
    },
  });
  return NextResponse.json(template);
}
