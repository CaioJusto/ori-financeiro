import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";
import { ALL_PERMISSIONS } from "@/lib/permissions";

export async function GET() {
  const { error, tenant } = await requirePermission("users.view");
  if (error) return error;

  const roles = await prisma.customRole.findMany({
    where: { tenantId: tenant.tenantId },
    include: { _count: { select: { users: true } } },
    orderBy: [{ isSystem: "desc" }, { name: "asc" }],
  });

  return NextResponse.json(roles);
}

export async function POST(req: NextRequest) {
  const { error, tenant } = await requirePermission("users.change_role");
  if (error) return error;

  const body = await req.json();
  const { name, description, permissions } = body;

  if (!name || !permissions || !Array.isArray(permissions)) {
    return NextResponse.json({ error: "name and permissions are required" }, { status: 400 });
  }

  // Validate permissions
  const valid = permissions.every((p: string) => (ALL_PERMISSIONS as readonly string[]).includes(p));
  if (!valid) {
    return NextResponse.json({ error: "Invalid permissions" }, { status: 400 });
  }

  // Check for duplicate name
  const existing = await prisma.customRole.findFirst({
    where: { tenantId: tenant.tenantId, name },
  });
  if (existing) {
    return NextResponse.json({ error: "Role name already exists" }, { status: 409 });
  }

  const role = await prisma.customRole.create({
    data: {
      name,
      description: description || "",
      permissions,
      isSystem: false,
      tenantId: tenant.tenantId,
    },
  });

  return NextResponse.json(role, { status: 201 });
}
