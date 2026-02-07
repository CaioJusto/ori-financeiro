import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";

export async function GET(req: NextRequest) {
  const { error, tenant } = await requirePermission("goals.view");
  if (error) return error;

  const goalId = req.nextUrl.searchParams.get("goalId");
  if (!goalId) return NextResponse.json([]);

  const comments = await prisma.goalComment.findMany({
    where: { tenantId: tenant.tenantId, goalId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(comments);
}

export async function POST(req: NextRequest) {
  const { error, tenant } = await requirePermission("goals.edit");
  if (error) return error;

  const body = await req.json();
  const { goalId, text } = body;

  if (!goalId || !text) {
    return NextResponse.json({ error: "goalId and text required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: tenant.userId } });

  const comment = await prisma.goalComment.create({
    data: {
      goalId,
      userId: tenant.userId,
      userName: user?.name || "Usuário",
      text,
      tenantId: tenant.tenantId,
    },
  });

  return NextResponse.json(comment);
}
