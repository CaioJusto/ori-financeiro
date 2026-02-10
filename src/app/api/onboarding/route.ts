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
    // No onboarding record = existing user (created before onboarding feature)
    // Only new registrations create an OnboardingProgress record
    return NextResponse.json({
      completedSteps: [],
      skipped: false,
      completed: true,
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
