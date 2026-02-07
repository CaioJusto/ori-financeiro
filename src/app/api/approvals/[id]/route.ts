import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const tenantId = (session.user as any).tenantId;
  const userId = (session.user as any).id;
  const { id } = await params;
  const { status, notes } = await req.json();

  const approval = await prisma.expenseApproval.update({
    where: { id, tenantId },
    data: { status, notes, approvedBy: status !== "PENDING" ? userId : null },
  });

  // Create notification
  await prisma.notification.create({
    data: {
      title: status === "APPROVED" ? "Despesa Aprovada" : "Despesa Rejeitada",
      message: `Sua solicitação de aprovação foi ${status === "APPROVED" ? "aprovada" : "rejeitada"}.${notes ? ` Nota: ${notes}` : ""}`,
      type: status === "APPROVED" ? "success" : "warning",
      userId: approval.requestedBy,
      tenantId,
    },
  });

  return NextResponse.json(approval);
}
