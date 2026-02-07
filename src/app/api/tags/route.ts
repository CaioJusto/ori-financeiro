import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";

export async function GET() {
  const { error, tenant } = await requirePermission("tags:read");
  if (error) return error;
  const tags = await prisma.tag.findMany({ where: { tenantId: tenant.tenantId }, orderBy: { name: "asc" } });
  return NextResponse.json(tags);
}

export async function POST(req: NextRequest) {
  const { error, tenant } = await requirePermission("tags:write");
  if (error) return error;
  const body = await req.json();
  const tag = await prisma.tag.create({ data: { name: body.name, color: body.color || "#6b7280", tenantId: tenant.tenantId } });
  return NextResponse.json(tag);
}
