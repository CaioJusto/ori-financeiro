import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const tenantId = (session.user as any).tenantId;
  const approvals = await prisma.expenseApproval.findMany({
    where: { tenantId },
    include: { transaction: { include: { category: true, account: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(approvals);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const tenantId = (session.user as any).tenantId;
  const userId = (session.user as any).id;
  const data = await req.json();
  const approval = await prisma.expenseApproval.create({
    data: { transactionId: data.transactionId, requestedBy: userId, status: "PENDING", tenantId },
  });
  return NextResponse.json(approval);
}
