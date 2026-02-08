import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

function generateCode(): string {
  return crypto.randomBytes(4).toString("hex").toUpperCase();
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const codes = await prisma.inviteCode.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(codes);
  } catch (error) {
    console.error("Error fetching invite codes:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const code = body.code?.toUpperCase() || generateCode();

    const existing = await prisma.inviteCode.findUnique({ where: { code } });
    if (existing) {
      return NextResponse.json({ error: "Código já existe" }, { status: 400 });
    }

    const inviteCode = await prisma.inviteCode.create({
      data: {
        code,
        createdBy: (session.user as any).id || session.user.email || "system",
      },
    });

    return NextResponse.json(inviteCode);
  } catch (error) {
    console.error("Error creating invite code:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });
    }

    await prisma.inviteCode.update({
      where: { id },
      data: { active: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deactivating invite code:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
