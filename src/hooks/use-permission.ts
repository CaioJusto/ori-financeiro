"use client";
import { useSession } from "next-auth/react";

export function usePermission(permission: string): boolean {
  const { data: session } = useSession();
  if (!session?.user?.permissions) return false;
  const perms = session.user.permissions as string[];
  if (perms.includes("*")) return true;
  return perms.includes(permission);
}

export function usePermissions(): string[] {
  const { data: session } = useSession();
  if (!session?.user?.permissions) return [];
  return session.user.permissions as string[];
}

export function useHasAnyPermission(permissions: string[]): boolean {
  const { data: session } = useSession();
  if (!session?.user?.permissions) return false;
  const perms = session.user.permissions as string[];
  if (perms.includes("*")) return true;
  return permissions.some((p) => perms.includes(p));
}
