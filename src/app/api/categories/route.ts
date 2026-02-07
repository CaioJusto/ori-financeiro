import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";

export async function GET() {
  const { error, tenant } = await requirePermission("categories:read");
  if (error) return error;

  const categories = await prisma.category.findMany({
    where: { tenantId: tenant.tenantId },
    orderBy: { name: "asc" },
    include: { parent: true, children: { orderBy: { name: "asc" } } },
  });
  return NextResponse.json(categories);
}

export async function POST(req: NextRequest) {
  const { error, tenant } = await requirePermission("categories:write");
  if (error) return error;

  const body = await req.json();
  const category = await prisma.category.create({
    data: {
      name: body.name,
      type: body.type,
      icon: body.icon || "circle",
      color: body.color || "#6b7280",
      parentId: body.parentId || null,
      tenantId: tenant.tenantId,
    },
    include: { parent: true, children: true },
  });
  return NextResponse.json(category);
}
