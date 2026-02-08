import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";

export async function GET() {
  const { error, tenant } = await requirePermission("transactions:read");
  if (error) return error;

  const conversations = await prisma.chatConversation.findMany({
    where: { tenantId: tenant.tenantId, userId: tenant.userId },
    orderBy: { updatedAt: "desc" },
    include: { messages: { take: 1, orderBy: { createdAt: "desc" } } },
  });

  return NextResponse.json(conversations);
}

export async function POST(req: NextRequest) {
  const { error, tenant } = await requirePermission("transactions:read");
  if (error) return error;

  const body = await req.json().catch(() => ({}));
  const conversation = await prisma.chatConversation.create({
    data: {
      title: body.title || "Nova conversa",
      tenantId: tenant.tenantId,
      userId: tenant.userId,
    },
  });

  return NextResponse.json(conversation);
}

export async function DELETE(req: NextRequest) {
  const { error, tenant } = await requirePermission("transactions:read");
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  await prisma.chatConversation.deleteMany({
    where: { id, tenantId: tenant.tenantId, userId: tenant.userId },
  });

  return NextResponse.json({ success: true });
}
