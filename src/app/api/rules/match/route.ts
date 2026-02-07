import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";

export async function POST(req: NextRequest) {
  const { error, tenant } = await requirePermission("rules:read");
  if (error) return error;
  const { description } = await req.json();
  if (!description) return NextResponse.json(null);

  const rules = await prisma.rule.findMany({ where: { active: true, tenantId: tenant.tenantId } });
  const desc = description.toLowerCase();

  for (const rule of rules) {
    if (desc.includes(rule.pattern.toLowerCase())) {
      return NextResponse.json({
        categoryId: rule.categoryId,
        accountId: rule.accountId,
        tagIds: rule.tagIds ? JSON.parse(rule.tagIds) : [],
      });
    }
  }

  return NextResponse.json(null);
}
