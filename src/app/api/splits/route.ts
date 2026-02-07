import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ splits: [] });
  const tenantId = (session.user as Record<string, unknown>).tenantId as string;

  const splits = await prisma.expenseSplitGroup.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ splits });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const tenantId = (session.user as Record<string, unknown>).tenantId as string;

  const { transactionId, description, splits } = await req.json();

  const group = await prisma.expenseSplitGroup.create({
    data: { transactionId, description, splits, tenantId },
  });

  return NextResponse.json({ split: group });
}
