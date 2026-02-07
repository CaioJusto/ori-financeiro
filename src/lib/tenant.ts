import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { LEGACY_PERMISSION_MAP } from "@/lib/permissions";

export interface TenantSession {
  tenantId: string;
  userId: string;
  email: string;
  roleId: string;
  roleName: string;
  permissions: string[];
}

export async function getTenantFromSession(): Promise<TenantSession | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) return null;

  // Load user with role to get permissions
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { role: true },
  });

  if (!user) return null;

  const permissions = (user.role.permissions as string[]) || [];

  return {
    tenantId: session.user.tenantId,
    userId: session.user.id,
    email: session.user.email!,
    roleId: user.roleId,
    roleName: user.role.name,
    permissions,
  };
}

export async function requireTenant() {
  const tenant = await getTenantFromSession();
  if (!tenant) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }), tenant: null };
  }
  return { error: null, tenant };
}

export function hasPermission(permissions: string[], permission: string): boolean {
  if (permissions.includes("*")) return true;
  // Map legacy permission strings
  const mapped = LEGACY_PERMISSION_MAP[permission] || permission;
  if (mapped === "*") return permissions.includes("*");
  return permissions.includes(mapped);
}

export async function requirePermission(permission: string) {
  const { error, tenant } = await requireTenant();
  if (error || !tenant) return { error: error || NextResponse.json({ error: "Unauthorized" }, { status: 401 }), tenant: null };
  if (!hasPermission(tenant.permissions, permission)) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }), tenant: null };
  }
  return { error: null, tenant };
}
