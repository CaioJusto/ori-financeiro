import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";

export async function GET(req: NextRequest) {
  const { error, tenant } = await requirePermission("reports:read");
  if (error) return error;
  const categories = await prisma.taxCategory.findMany({ where: { tenantId: tenant.tenantId }, orderBy: { name: "asc" } });
  return NextResponse.json(categories);
}

export async function POST(req: NextRequest) {
  const { error, tenant } = await requirePermission("reports:read");
  if (error) return error;
  const body = await req.json();
  const cat = await prisma.taxCategory.create({
    data: { name: body.name, type: body.type || "DEDUCTIBLE", description: body.description || "", tenantId: tenant.tenantId },
  });
  return NextResponse.json(cat);
}
