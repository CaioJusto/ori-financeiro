import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";

export async function GET() {
  const { error, tenant } = await requirePermission("rules:read");
  if (error) return error;
  const rules = await prisma.rule.findMany({ where: { tenantId: tenant.tenantId }, orderBy: { createdAt: "desc" } });
  return NextResponse.json(rules);
}

export async function POST(req: NextRequest) {
  const { error, tenant } = await requirePermission("rules:write");
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
  const rule = await prisma.rule.create({
    data: {
      pattern: body.pattern || body.name || body.value || "",
      categoryId: body.categoryId || null,
      accountId: body.accountId || null,
      tagIds: body.tagIds ? JSON.stringify(body.tagIds) : null,
      active: body.active ?? true,
      tenantId: tenant.tenantId,
    },
  });
  return NextResponse.json(rule);
}
