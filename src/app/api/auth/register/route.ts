import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, companyName } = await request.json();

    // Validações
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Todos os campos são obrigatórios" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "A senha deve ter no mínimo 6 caracteres" },
        { status: 400 }
      );
    }

    // Verifica se o email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Este email já está em uso" },
        { status: 400 }
      );
    }

    // Gera slug único para o tenant
    const baseSlug = (companyName || name)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    let slug = baseSlug;
    let slugExists = await prisma.tenant.findUnique({ where: { slug } });
    let counter = 1;

    while (slugExists) {
      slug = `${baseSlug}-${counter}`;
      slugExists = await prisma.tenant.findUnique({ where: { slug } });
      counter++;
    }

    // Hash da senha
    const passwordHash = await bcrypt.hash(password, 10);

    // Cria tenant, role e usuário em uma transação
    const result = await prisma.$transaction(async (tx) => {
      // 1. Cria o tenant (organização)
      const tenant = await tx.tenant.create({
        data: {
          name: companyName || name,
          slug,
          systemName: "Ori Financeiro",
          primaryColor: "#7c3aed",
          secondaryColor: "#6d28d9",
          accentColor: "#8b5cf6",
        },
      });

      // 2. Cria as roles padrão (Owner, Admin, Manager, Viewer)
      const ownerRole = await tx.customRole.create({
        data: {
          name: "Owner",
          description: "Proprietário da conta com acesso total",
          tenantId: tenant.id,
          isSystem: true,
          permissions: [
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
            "audit.view",
            "backup.create", "backup.restore",
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
          ],
        },
      });

      // 3. Cria o usuário como Owner
      const user = await tx.user.create({
        data: {
          name,
          email,
          passwordHash,
          tenantId: tenant.id,
          roleId: ownerRole.id,
        },
      });

      // 4. Cria configurações padrão do tenant
      await tx.tenantSettings.create({
        data: {
          tenantId: tenant.id,
          fiscalYearStartMonth: 1,
          defaultCurrency: "BRL",
          autoCategorization: true,
          lowBalanceThreshold: 500,
          budgetWarningPercent: 80,
          budgetCriticalPercent: 100,
          dataRetentionMonths: 60,
          approvalThreshold: 1000,
        },
      });

      // 5. Cria categorias padrão
      const expenseCategories = [
        { name: "Alimentação", icon: "utensils", color: "#ef4444" },
        { name: "Transporte", icon: "car", color: "#f59e0b" },
        { name: "Moradia", icon: "home", color: "#8b5cf6" },
        { name: "Saúde", icon: "heart", color: "#ec4899" },
        { name: "Educação", icon: "book", color: "#3b82f6" },
        { name: "Lazer", icon: "smile", color: "#10b981" },
        { name: "Outros", icon: "more-horizontal", color: "#6b7280" },
      ];

      const incomeCategories = [
        { name: "Salário", icon: "briefcase", color: "#10b981" },
        { name: "Freelance", icon: "laptop", color: "#06b6d4" },
        { name: "Investimentos", icon: "trending-up", color: "#8b5cf6" },
        { name: "Outros", icon: "dollar-sign", color: "#6b7280" },
      ];

      for (const cat of expenseCategories) {
        await tx.category.create({
          data: {
            name: cat.name,
            type: "expense",
            icon: cat.icon,
            color: cat.color,
            tenantId: tenant.id,
          },
        });
      }

      for (const cat of incomeCategories) {
        await tx.category.create({
          data: {
            name: cat.name,
            type: "income",
            icon: cat.icon,
            color: cat.color,
            tenantId: tenant.id,
          },
        });
      }

      // 6. Cria plano gratuito e vincula ao tenant
      const freePlan = await tx.plan.upsert({
        where: { slug: "free" },
        update: {},
        create: {
          name: "Plano Gratuito",
          slug: "free",
          price: 0,
          currency: "BRL",
          interval: "MONTHLY",
          features: [
            "Até 2 contas bancárias",
            "100 transações por mês",
            "Relatórios básicos",
            "1 usuário",
          ],
          maxUsers: 1,
          maxAccounts: 2,
          maxTransactionsPerMonth: 100,
          active: true,
        },
      });

      await tx.tenantSubscription.create({
        data: {
          tenantId: tenant.id,
          planId: freePlan.id,
          status: "ACTIVE",
          startDate: new Date(),
        },
      });

      return { tenant, user };
    });

    return NextResponse.json(
      {
        message: "Conta criada com sucesso!",
        tenant: result.tenant.slug,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erro ao criar conta:", error);
    return NextResponse.json(
      { error: "Erro ao criar conta. Tente novamente." },
      { status: 500 }
    );
  }
}
