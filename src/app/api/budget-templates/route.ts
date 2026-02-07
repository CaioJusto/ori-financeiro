import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const tenantId = (session.user as any).tenantId;
  const templates = await prisma.budgetTemplate.findMany({
    where: { OR: [{ tenantId }, { isPublic: true }] },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(templates);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const tenantId = (session.user as any).tenantId;
  const data = await req.json();
  const template = await prisma.budgetTemplate.create({
    data: { name: data.name, description: data.description || "", items: data.items || [], isPublic: data.isPublic || false, tenantId },
  });
  return NextResponse.json(template);
}
