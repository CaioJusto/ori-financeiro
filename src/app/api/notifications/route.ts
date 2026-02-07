import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";

export async function GET(req: NextRequest) {
  const { error, tenant } = await requirePermission("notifications:read");
  if (error) return error;
  const url = new URL(req.url);
  const type = url.searchParams.get("type");
  const readFilter = url.searchParams.get("read");
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { tenantId: tenant.tenantId, OR: [{ userId: tenant.userId }, { userId: null }] };
  if (type) where.type = type;
  if (readFilter === "true") where.read = true;
  if (readFilter === "false") where.read = false;

  const notifications = await prisma.notification.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return NextResponse.json(notifications);
}

export async function POST(req: NextRequest) {
  const { error, tenant } = await requirePermission("notifications:write");
  if (error) return error;
  const body = await req.json();
  const notification = await prisma.notification.create({
    data: {
      userId: body.userId || tenant.userId,
      title: body.title,
      message: body.message,
      type: body.type || "info",
      link: body.link || null,
      tenantId: tenant.tenantId,
    },
  });
  return NextResponse.json(notification);
}

export async function DELETE(req: NextRequest) {
  const { error, tenant } = await requirePermission("notifications:write");
  if (error) return error;
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (id) {
    await prisma.notification.delete({ where: { id, tenantId: tenant.tenantId } });
  }
  return NextResponse.json({ ok: true });
}
