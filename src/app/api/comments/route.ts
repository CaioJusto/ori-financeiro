import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";

export async function GET(req: NextRequest) {
  const { error, tenant } = await requirePermission("transactions:read");
  if (error) return error;
  const url = new URL(req.url);
  const transactionId = url.searchParams.get("transactionId");
  if (!transactionId) return NextResponse.json([]);

  const comments = await prisma.comment.findMany({
    where: { transactionId, tenantId: tenant.tenantId },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(comments);
}

export async function POST(req: NextRequest) {
  const { error, tenant } = await requirePermission("transactions:write");
  if (error) return error;
  const body = await req.json();
  const comment = await prisma.comment.create({
    data: {
      transactionId: body.transactionId,
      userId: tenant.userId,
      text: body.text,
      tenantId: tenant.tenantId,
    },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  return NextResponse.json(comment);
}
