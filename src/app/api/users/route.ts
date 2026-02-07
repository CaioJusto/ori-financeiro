import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";
import bcrypt from "bcryptjs";

export async function GET() {
  const { error, tenant } = await requirePermission("users.view");
  if (error) return error;
  const users = await prisma.user.findMany({
    where: { tenantId: tenant.tenantId },
    select: { id: true, email: true, name: true, roleId: true, role: { select: { id: true, name: true } }, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const { error, tenant } = await requirePermission("users.invite");
  if (error) return error;

  const body = await req.json();
  const { email, name, password, roleId } = body;

  if (!email || !name || !password) {
    return NextResponse.json({ error: "email, name, and password are required" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email already in use" }, { status: 409 });
  }

  // Validate roleId belongs to this tenant
  let targetRoleId = roleId;
  if (!targetRoleId) {
    // Default to VIEWER role
    const viewerRole = await prisma.customRole.findFirst({
      where: { tenantId: tenant.tenantId, name: "VIEWER", isSystem: true },
    });
    targetRoleId = viewerRole?.id;
  }

  if (targetRoleId) {
    const role = await prisma.customRole.findFirst({
      where: { id: targetRoleId, tenantId: tenant.tenantId },
    });
    if (!role) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email,
      name,
      passwordHash,
      roleId: targetRoleId,
      tenantId: tenant.tenantId,
    },
    select: { id: true, email: true, name: true, roleId: true, role: { select: { id: true, name: true } }, createdAt: true },
  });

  return NextResponse.json(user, { status: 201 });
}
