import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/tenant";

export async function GET() {
  const { error, tenant } = await requireTenant();
  if (error) return error;

  const progress = await prisma.onboardingProgress.findUnique({
    where: { tenantId: tenant.tenantId },
  });

  if (!progress) {
    // Check what steps are already done
    const [accounts, categories, goals] = await Promise.all([
      prisma.account.count({ where: { tenantId: tenant.tenantId } }),
      prisma.category.count({ where: { tenantId: tenant.tenantId } }),
      prisma.savingsGoal.count({ where: { tenantId: tenant.tenantId } }),
    ]);

    const completedSteps: string[] = ["welcome"];
    if (accounts > 0) completedSteps.push("accounts");
    if (categories > 0) completedSteps.push("categories");
    if (goals > 0) completedSteps.push("goals");

    return NextResponse.json({
      completedSteps,
      skipped: false,
      completed: completedSteps.length >= 5,
    });
  }

  return NextResponse.json({
    completedSteps: progress.completedSteps,
    skipped: progress.skipped,
    completed: progress.completed,
  });
}

export async function POST(req: NextRequest) {
  const { error, tenant } = await requireTenant();
  if (error) return error;

  const { step, skip, complete } = await req.json();

  const existing = await prisma.onboardingProgress.findUnique({
    where: { tenantId: tenant.tenantId },
  });

  if (existing) {
    const steps = existing.completedSteps as string[];
    if (step && !steps.includes(step)) steps.push(step);

    await prisma.onboardingProgress.update({
      where: { tenantId: tenant.tenantId },
      data: {
        completedSteps: steps,
        skipped: skip || existing.skipped,
        completed: complete || existing.completed,
      },
    });
  } else {
    await prisma.onboardingProgress.create({
      data: {
        tenantId: tenant.tenantId,
        completedSteps: step ? [step] : [],
        skipped: skip || false,
        completed: complete || false,
      },
    });
  }

  return NextResponse.json({ ok: true });
}
