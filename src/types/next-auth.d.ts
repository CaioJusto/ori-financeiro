import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      roleId: string;
      permissions: string[];
      tenantId: string;
      tenantSlug: string;
    };
  }

  interface User {
    role: string;
    roleId: string;
    permissions: string[];
    tenantId: string;
    tenantSlug: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string;
    roleId: string;
    permissions: string[];
    tenantId: string;
    tenantSlug: string;
  }
}
