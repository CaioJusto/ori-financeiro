import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

const DEFAULT_CATEGORIES = [
  { name: "Salário", type: "income", color: "#22c55e" },
  { name: "Freelance", type: "income", color: "#14b8a6" },
  { name: "Investimentos", type: "income", color: "#3b82f6" },
  { name: "Alimentação", type: "expense", color: "#ef4444" },
  { name: "Transporte", type: "expense", color: "#f97316" },
  { name: "Moradia", type: "expense", color: "#eab308" },
  { name: "Lazer", type: "expense", color: "#ec4899" },
  { name: "Saúde", type: "expense", color: "#14b8a6" },
  { name: "Educação", type: "expense", color: "#8b5cf6" },
];

const ALL_PERMISSIONS = [
  "transactions.view", "transactions.create", "transactions.edit", "transactions.delete", "transactions.export", "transactions.import",
  "accounts.view", "accounts.create", "accounts.edit", "accounts.delete", "accounts.view_balance",
  "categories.view", "categories.create", "categories.edit", "categories.delete",
  "budgets.view", "budgets.create", "budgets.edit", "budgets.delete",
  "goals.view", "goals.create", "goals.edit", "goals.delete",
  "recurring.view", "recurring.create", "recurring.edit", "recurring.delete", "recurring.process",
  "reports.view", "reports.export", "reports.print",
  "users.view", "users.invite", "users.edit", "users.remove", "users.change_role",
  "settings.view", "settings.edit", "settings.branding", "settings.billing",
  "tags.view", "tags.create", "tags.edit", "tags.delete",
  "contacts.view", "contacts.create", "contacts.edit", "contacts.delete",
  "rules.view", "rules.create", "rules.edit", "rules.delete",
  "transfers.view", "transfers.create",
  "installments.view", "installments.create", "installments.edit", "installments.delete",
  "dashboard.view", "dashboard.customize",
  "audit.view", "backup.create", "backup.restore",
  "credit_cards.view", "credit_cards.create", "credit_cards.edit", "credit_cards.delete",
  "payables.view", "payables.create", "payables.edit", "payables.delete",
  "planning.view", "planning.create", "planning.edit", "planning.delete",
  "objectives.view", "objectives.create", "objectives.edit", "objectives.delete",
  "notifications.view", "notifications.manage",
  "attachments.view", "attachments.create", "attachments.delete",
  "projections.view", "simulator.view", "health_score.view", "metrics.view", "insights.view", "compare.view",
  "share.create", "favorites.view", "favorites.manage",
  "balance_history.view", "balance_history.create",
  "analytics.view", "templates.view", "templates.create", "templates.edit", "templates.delete",
  "comments.view", "comments.create", "comments.delete",
  "preferences.view", "preferences.edit",
  "account_groups.view", "account_groups.create", "account_groups.edit", "account_groups.delete",
];

export async function POST(req: NextRequest) {
  try {
    const { tenantName, adminName, email, password } = await req.json();

    if (!tenantName || !adminName || !email || !password) {
      return NextResponse.json({ error: "Todos os campos são obrigatórios" }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Email inválido" }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: "Email já cadastrado" }, { status: 400 });
    }

    const slug = tenantName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + Date.now().toString(36);

    const tenant = await prisma.tenant.create({
      data: { name: tenantName, slug, systemName: tenantName },
    });

    const ownerRole = await prisma.customRole.create({
      data: { name: "OWNER", description: "Proprietário - acesso total", permissions: ALL_PERMISSIONS, isSystem: true, tenantId: tenant.id },
    });

    await prisma.customRole.create({
      data: { name: "VIEWER", description: "Visualizador", permissions: ["transactions.view", "accounts.view", "categories.view", "budgets.view", "dashboard.view", "reports.view"], isSystem: true, tenantId: tenant.id },
    });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, name: adminName, passwordHash, roleId: ownerRole.id, tenantId: tenant.id },
    });

    await prisma.userPreference.create({ data: { userId: user.id, tenantId: tenant.id } });

    await prisma.tenantSettings.create({
      data: { tenantId: tenant.id },
    });

    for (const cat of DEFAULT_CATEGORIES) {
      await prisma.category.create({ data: { ...cat, tenantId: tenant.id } });
    }

    // Assign free plan if it exists
    const freePlan = await prisma.plan.findUnique({ where: { slug: "free" } });
    if (freePlan) {
      await prisma.tenantSubscription.create({
        data: { tenantId: tenant.id, planId: freePlan.id, status: "ACTIVE" },
      });
    }

    await prisma.onboardingProgress.create({
      data: { tenantId: tenant.id, completedSteps: ["welcome"], completed: false },
    });

    return NextResponse.json({ success: true, tenantId: tenant.id, userId: user.id });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
