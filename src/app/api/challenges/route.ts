import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";

export async function GET() {
  const { error, tenant } = await requirePermission("goals.view");
  if (error) return error;

  const challenges = await prisma.challenge.findMany({
    where: { tenantId: tenant.tenantId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(challenges);
}

export async function POST(req: NextRequest) {
  const { error, tenant } = await requirePermission("goals.create");
  if (error) return error;

  const body = await req.json();
  const { name, type, target, endDate, rules } = body;

  if (!name || !type) return NextResponse.json({ error: "Name and type required" }, { status: 400 });

  // Auto-calculate target for known types
  let finalTarget = target || 0;
  if (type === "52_WEEK" && !target) finalTarget = (52 * 53) / 2; // 1+2+3...+52 = 1378
  if (type === "30_DAY" && !target) finalTarget = 30;

  const challenge = await prisma.challenge.create({
    data: {
      name, type,
      target: finalTarget,
      endDate: endDate ? new Date(endDate) : null,
      rules: JSON.stringify(rules || {}),
      tenantId: tenant.tenantId,
    },
  });

  return NextResponse.json(challenge, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const { error, tenant } = await requirePermission("goals.edit");
  if (error) return error;

  const { id, progress, streak, status, badges } = await req.json();
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = {};
  if (progress !== undefined) data.progress = progress;
  if (streak !== undefined) data.streak = streak;
  if (status !== undefined) data.status = status;
  if (badges !== undefined) data.badges = JSON.stringify(badges);

  const challenge = await prisma.challenge.updateMany({
    where: { id, tenantId: tenant.tenantId },
    data,
  });

  return NextResponse.json(challenge);
}

export async function DELETE(req: NextRequest) {
  const { error, tenant } = await requirePermission("goals.delete");
  if (error) return error;

  const { id } = await req.json();
  await prisma.challenge.deleteMany({ where: { id, tenantId: tenant.tenantId } });
  return NextResponse.json({ ok: true });
}
