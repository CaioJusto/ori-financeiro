import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

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
];

const ADMIN_PERMISSIONS = ALL_PERMISSIONS.filter(p => p !== "settings.billing" && p !== "backup.restore");

const MANAGER_PERMISSIONS = [
  "transactions.view", "transactions.create", "transactions.edit", "transactions.export", "transactions.import",
  "accounts.view", "accounts.create", "accounts.edit", "accounts.view_balance",
  "categories.view", "categories.create", "categories.edit",
  "budgets.view", "budgets.create", "budgets.edit",
  "goals.view", "goals.create", "goals.edit",
  "recurring.view", "recurring.create", "recurring.edit",
  "transfers.view", "transfers.create",
  "installments.view", "installments.create", "installments.edit",
  "tags.view", "tags.create", "tags.edit",
  "contacts.view", "contacts.create", "contacts.edit",
  "rules.view", "rules.create", "rules.edit",
  "reports.view", "reports.export",
  "dashboard.view", "dashboard.customize",
  "credit_cards.view", "credit_cards.create", "credit_cards.edit",
  "payables.view", "payables.create", "payables.edit",
  "planning.view", "planning.create", "planning.edit",
  "objectives.view", "objectives.create", "objectives.edit",
  "notifications.view", "notifications.manage",
  "attachments.view", "attachments.create",
  "projections.view", "simulator.view", "health_score.view", "metrics.view", "insights.view", "compare.view",
  "share.create", "favorites.view", "favorites.manage",
  "balance_history.view", "balance_history.create",
  "audit.view", "backup.create",
  "analytics.view", "templates.view", "templates.create", "templates.edit",
  "comments.view", "comments.create",
  "preferences.view", "preferences.edit",
  "account_groups.view", "account_groups.create", "account_groups.edit",
];

const VIEWER_PERMISSIONS = [
  "transactions.view", "accounts.view", "accounts.view_balance",
  "categories.view", "budgets.view", "goals.view", "recurring.view",
  "transfers.view", "installments.view", "tags.view", "contacts.view", "rules.view",
  "reports.view", "reports.export", "dashboard.view",
  "credit_cards.view", "payables.view", "planning.view", "objectives.view",
  "notifications.view", "attachments.view",
  "projections.view", "simulator.view", "health_score.view", "metrics.view", "insights.view", "compare.view",
  "favorites.view", "balance_history.view", "audit.view", "share.create",
  "analytics.view", "templates.view", "comments.view", "preferences.view",
  "account_groups.view",
];

async function main() {
  // Clean all data - order matters for FK constraints
  await prisma.financialSnapshot.deleteMany();
  await prisma.goalComment.deleteMany();
  await prisma.openFinanceConnection.deleteMany();
  await prisma.openFinanceProvider.deleteMany();
  await prisma.importHistory.deleteMany();
  await prisma.expenseSplitGroup.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.tenantSubscription.deleteMany();
  await prisma.plan.deleteMany();
  await prisma.onboardingProgress.deleteMany();
  await prisma.challenge.deleteMany();
  await prisma.document.deleteMany();
  await prisma.webhook.deleteMany();
  await prisma.apiKey.deleteMany();
  await prisma.currencyRate.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.investment.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.taxCategory.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.transactionLog.deleteMany();
  await prisma.transactionTag.deleteMany();
  await prisma.transactionSplit.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.goalDeposit.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.balanceHistory.deleteMany();
  await prisma.transfer.deleteMany();
  await prisma.budget.deleteMany();
  await prisma.recurring.deleteMany();
  await prisma.installment.deleteMany();
  await prisma.planning.deleteMany();
  await prisma.payable.deleteMany();
  await prisma.savingsGoal.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.creditCard.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.transactionTemplate.deleteMany();
  await prisma.accountReconciliation.deleteMany();
  await prisma.category.deleteMany();
  await prisma.account.deleteMany();
  await prisma.accountGroup.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.sharedReport.deleteMany();
  await prisma.objective.deleteMany();
  await prisma.rule.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.userDashboardLayout.deleteMany();
  await prisma.userPreference.deleteMany();
  await prisma.tenantSettings.deleteMany();
  await prisma.user.deleteMany();
  await prisma.customRole.deleteMany();
  await prisma.tenant.deleteMany();

  const tenant = await prisma.tenant.create({
    data: {
      name: "Ori Financeiro Demo",
      slug: "demo",
      primaryColor: "#7c3aed",
      secondaryColor: "#6d28d9",
      accentColor: "#8b5cf6",
      systemName: "Ori Financeiro",
    },
  });

  const tid = tenant.id;

  // Tenant settings
  await prisma.tenantSettings.create({
    data: { tenantId: tid, fiscalYearStartMonth: 1, defaultCurrency: "BRL", autoCategorization: true, lowBalanceThreshold: 500, budgetWarningPercent: 80, budgetCriticalPercent: 100 },
  });

  // Roles
  const ownerRole = await prisma.customRole.create({
    data: { name: "OWNER", description: "Proprietário - acesso total", permissions: ALL_PERMISSIONS, isSystem: true, tenantId: tid },
  });
  await prisma.customRole.create({
    data: { name: "ADMIN", description: "Administrador", permissions: ADMIN_PERMISSIONS, isSystem: true, tenantId: tid },
  });
  await prisma.customRole.create({
    data: { name: "MANAGER", description: "Gerente", permissions: MANAGER_PERMISSIONS, isSystem: true, tenantId: tid },
  });
  await prisma.customRole.create({
    data: { name: "VIEWER", description: "Visualizador", permissions: VIEWER_PERMISSIONS, isSystem: true, tenantId: tid },
  });

  const passwordHash = await bcrypt.hash("admin123", 10);
  const user = await prisma.user.create({
    data: { email: "admin@ori.com", name: "Admin", passwordHash, roleId: ownerRole.id, tenantId: tid },
  });

  // User preferences
  await prisma.userPreference.create({
    data: { userId: user.id, tenantId: tid },
  });

  // Account groups
  const grpCorrente = await prisma.accountGroup.create({ data: { name: "Contas Correntes", color: "#3b82f6", order: 0, tenantId: tid } });
  const grpInvest = await prisma.accountGroup.create({ data: { name: "Investimentos", color: "#22c55e", order: 1, tenantId: tid } });

  // Accounts
  const pessoal = await prisma.account.create({ data: { name: "Conta Pessoal", type: "personal", color: "#3b82f6", groupId: grpCorrente.id, tenantId: tid } });
  const empresa = await prisma.account.create({ data: { name: "Conta Empresarial", type: "business", color: "#8b5cf6", groupId: grpCorrente.id, tenantId: tid } });
  const poupanca = await prisma.account.create({ data: { name: "Poupança", type: "savings", color: "#22c55e", groupId: grpInvest.id, tenantId: tid } });

  // Categories
  const salario = await prisma.category.create({ data: { name: "Salário", type: "income", color: "#22c55e", tenantId: tid } });
  const freelance = await prisma.category.create({ data: { name: "Freelance", type: "income", color: "#14b8a6", tenantId: tid } });
  const investimentosCat = await prisma.category.create({ data: { name: "Investimentos", type: "income", color: "#3b82f6", tenantId: tid } });
  const vendas = await prisma.category.create({ data: { name: "Vendas", type: "income", color: "#f97316", tenantId: tid } });
  const alimentacao = await prisma.category.create({ data: { name: "Alimentação", type: "expense", color: "#ef4444", tenantId: tid } });
  const transporte = await prisma.category.create({ data: { name: "Transporte", type: "expense", color: "#f97316", tenantId: tid } });
  const moradia = await prisma.category.create({ data: { name: "Moradia", type: "expense", color: "#eab308", tenantId: tid } });
  const lazer = await prisma.category.create({ data: { name: "Lazer", type: "expense", color: "#ec4899", tenantId: tid } });
  const saude = await prisma.category.create({ data: { name: "Saúde", type: "expense", color: "#14b8a6", tenantId: tid } });
  const educacao = await prisma.category.create({ data: { name: "Educação", type: "expense", color: "#8b5cf6", tenantId: tid } });
  const tecnologia = await prisma.category.create({ data: { name: "Tecnologia", type: "expense", color: "#6366f1", tenantId: tid } });

  // Rules for auto-categorization
  await prisma.rule.create({ data: { pattern: "supermercado", categoryId: alimentacao.id, active: true, tenantId: tid } });
  await prisma.rule.create({ data: { pattern: "restaurante", categoryId: alimentacao.id, active: true, tenantId: tid } });
  await prisma.rule.create({ data: { pattern: "uber", categoryId: transporte.id, active: true, tenantId: tid } });
  await prisma.rule.create({ data: { pattern: "combustível", categoryId: transporte.id, active: true, tenantId: tid } });
  await prisma.rule.create({ data: { pattern: "aluguel", categoryId: moradia.id, active: true, tenantId: tid } });
  await prisma.rule.create({ data: { pattern: "salário", categoryId: salario.id, active: true, tenantId: tid } });

  // Transactions
  const now = new Date();
  const txs: { description: string; amount: number; type: string; date: Date; accountId: string; categoryId: string }[] = [];

  for (let i = 5; i >= 0; i--) {
    const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = month.getFullYear();
    const m = month.getMonth();

    txs.push({ description: "Salário mensal", amount: 8500, type: "income", date: new Date(y, m, 5), accountId: pessoal.id, categoryId: salario.id });
    txs.push({ description: "Projeto freelance", amount: 2000 + Math.random() * 3000, type: "income", date: new Date(y, m, 15), accountId: empresa.id, categoryId: freelance.id });
    if (i % 2 === 0) txs.push({ description: "Rendimento investimento", amount: 350 + Math.random() * 200, type: "income", date: new Date(y, m, 20), accountId: poupanca.id, categoryId: investimentosCat.id });
    if (i % 3 === 0) txs.push({ description: "Venda de produto", amount: 1500 + Math.random() * 1000, type: "income", date: new Date(y, m, 25), accountId: empresa.id, categoryId: vendas.id });

    txs.push({ description: "Supermercado", amount: 800 + Math.random() * 400, type: "expense", date: new Date(y, m, 3), accountId: pessoal.id, categoryId: alimentacao.id });
    txs.push({ description: "Restaurante", amount: 150 + Math.random() * 200, type: "expense", date: new Date(y, m, 10), accountId: pessoal.id, categoryId: alimentacao.id });
    txs.push({ description: "Combustível", amount: 250 + Math.random() * 100, type: "expense", date: new Date(y, m, 7), accountId: pessoal.id, categoryId: transporte.id });
    txs.push({ description: "Uber/99", amount: 80 + Math.random() * 60, type: "expense", date: new Date(y, m, 18), accountId: pessoal.id, categoryId: transporte.id });
    txs.push({ description: "Aluguel", amount: 2200, type: "expense", date: new Date(y, m, 1), accountId: pessoal.id, categoryId: moradia.id });
    txs.push({ description: "Condomínio", amount: 450, type: "expense", date: new Date(y, m, 1), accountId: pessoal.id, categoryId: moradia.id });
    txs.push({ description: "Cinema/Streaming", amount: 80 + Math.random() * 50, type: "expense", date: new Date(y, m, 12), accountId: pessoal.id, categoryId: lazer.id });
    txs.push({ description: "Plano de saúde", amount: 550, type: "expense", date: new Date(y, m, 5), accountId: pessoal.id, categoryId: saude.id });
    txs.push({ description: "Curso online", amount: 200 + Math.random() * 100, type: "expense", date: new Date(y, m, 8), accountId: pessoal.id, categoryId: educacao.id });
    txs.push({ description: "Software/Hosting", amount: 150 + Math.random() * 100, type: "expense", date: new Date(y, m, 10), accountId: empresa.id, categoryId: tecnologia.id });
  }

  for (const tx of txs) {
    await prisma.transaction.create({ data: { ...tx, amount: Math.round(tx.amount * 100) / 100, tenantId: tid } });
  }

  // Budgets
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  await prisma.budget.create({ data: { categoryId: alimentacao.id, amount: 1500, month: currentMonth, tenantId: tid } });
  await prisma.budget.create({ data: { categoryId: transporte.id, amount: 500, month: currentMonth, tenantId: tid } });
  await prisma.budget.create({ data: { categoryId: lazer.id, amount: 300, month: currentMonth, tenantId: tid } });

  // Transfers
  await prisma.transfer.create({ data: { amount: 2000, description: "Reserva mensal", fromAccountId: pessoal.id, toAccountId: poupanca.id, date: new Date(now.getFullYear(), now.getMonth(), 6), tenantId: tid } });
  await prisma.transfer.create({ data: { amount: 3000, description: "Lucro para pessoal", fromAccountId: empresa.id, toAccountId: pessoal.id, date: new Date(now.getFullYear(), now.getMonth() - 1, 15), tenantId: tid } });

  // Goals
  await prisma.savingsGoal.create({ data: { name: "Reserva de emergência", targetAmount: 50000, currentAmount: 15000, deadline: new Date(now.getFullYear() + 1, 6, 1), tenantId: tid } });
  await prisma.savingsGoal.create({ data: { name: "Viagem", targetAmount: 10000, currentAmount: 3500, deadline: new Date(now.getFullYear() + 1, 0, 1), tenantId: tid } });

  // Transaction templates
  await prisma.transactionTemplate.create({ data: { name: "Almoço", description: "Almoço restaurante", amount: 35, type: "expense", categoryId: alimentacao.id, accountId: pessoal.id, tenantId: tid } });
  await prisma.transactionTemplate.create({ data: { name: "Combustível", description: "Abastecimento", amount: 200, type: "expense", categoryId: transporte.id, accountId: pessoal.id, tenantId: tid } });

  // Notifications
  await prisma.notification.create({ data: { userId: user.id, title: "Bem-vindo!", message: "Seu sistema financeiro está configurado.", type: "success", tenantId: tid } });
  await prisma.notification.create({ data: { userId: user.id, title: "Orçamento de Alimentação", message: "Você atingiu 80% do orçamento de Alimentação.", type: "warning", link: "/budgets", tenantId: tid } });

  // Recurring
  await prisma.recurring.create({ data: { description: "Aluguel", amount: 2200, type: "expense", accountId: pessoal.id, categoryId: moradia.id, frequency: "monthly", dayOfMonth: 1, tenantId: tid } });

  // Payables
  await prisma.payable.create({ data: { description: "Conta de luz", amount: 250, type: "expense", dueDate: new Date(now.getFullYear(), now.getMonth(), 15), tenantId: tid } });
  await prisma.payable.create({ data: { description: "Internet", amount: 120, type: "expense", dueDate: new Date(now.getFullYear(), now.getMonth(), 20), tenantId: tid } });

  // Invoices
  await prisma.invoice.create({
    data: {
      number: "INV-00001", clientName: "Empresa ABC", clientEmail: "contato@abc.com",
      items: [{ description: "Consultoria", quantity: 10, price: 500 }, { description: "Suporte", quantity: 5, price: 200 }],
      subtotal: 6000, tax: 300, total: 6300, status: "SENT", dueDate: new Date(now.getFullYear(), now.getMonth(), 25), tenantId: tid,
    },
  });
  await prisma.invoice.create({
    data: {
      number: "INV-00002", clientName: "Cliente XYZ", clientEmail: "xyz@email.com",
      items: [{ description: "Desenvolvimento", quantity: 1, price: 15000 }],
      subtotal: 15000, tax: 750, total: 15750, status: "DRAFT", dueDate: new Date(now.getFullYear(), now.getMonth() + 1, 10), tenantId: tid,
    },
  });

  // Investments
  await prisma.investment.create({ data: { type: "STOCK", ticker: "PETR4", name: "Petrobras PN", quantity: 100, avgPrice: 28.50, currentPrice: 32.80, totalInvested: 2850, currentValue: 3280, profitLoss: 430, tenantId: tid } });
  await prisma.investment.create({ data: { type: "FUND", name: "FII XPLG11", quantity: 50, avgPrice: 95, currentPrice: 102.5, totalInvested: 4750, currentValue: 5125, profitLoss: 375, tenantId: tid } });
  await prisma.investment.create({ data: { type: "CRYPTO", ticker: "BTC", name: "Bitcoin", quantity: 0.05, avgPrice: 350000, currentPrice: 420000, totalInvested: 17500, currentValue: 21000, profitLoss: 3500, tenantId: tid } });
  await prisma.investment.create({ data: { type: "FIXED_INCOME", name: "CDB Banco Inter 120% CDI", quantity: 1, avgPrice: 10000, currentPrice: 10850, totalInvested: 10000, currentValue: 10850, profitLoss: 850, tenantId: tid } });

  // Subscriptions
  await prisma.subscription.create({ data: { name: "Netflix", provider: "Netflix Inc", amount: 55.90, billingCycle: "MONTHLY", nextBillingDate: new Date(now.getFullYear(), now.getMonth(), 15), category: "Streaming", status: "ACTIVE", tenantId: tid } });
  await prisma.subscription.create({ data: { name: "Spotify", provider: "Spotify AB", amount: 21.90, billingCycle: "MONTHLY", nextBillingDate: new Date(now.getFullYear(), now.getMonth(), 20), category: "Música", status: "ACTIVE", tenantId: tid } });
  await prisma.subscription.create({ data: { name: "GitHub Pro", provider: "GitHub", amount: 4, currency: "USD", billingCycle: "MONTHLY", nextBillingDate: new Date(now.getFullYear(), now.getMonth(), 10), category: "Desenvolvimento", status: "ACTIVE", tenantId: tid } });
  await prisma.subscription.create({ data: { name: "Adobe Creative Cloud", provider: "Adobe", amount: 290, billingCycle: "YEARLY", nextBillingDate: new Date(now.getFullYear() + 1, 2, 1), category: "Design", status: "ACTIVE", tenantId: tid } });

  // Tax categories
  await prisma.taxCategory.create({ data: { name: "Saúde", type: "DEDUCTIBLE", description: "Despesas médicas dedutíveis", tenantId: tid } });
  await prisma.taxCategory.create({ data: { name: "Educação", type: "DEDUCTIBLE", description: "Despesas com educação", tenantId: tid } });
  await prisma.taxCategory.create({ data: { name: "Salário", type: "TAXABLE", description: "Rendimentos tributáveis", tenantId: tid } });

  // Currency rates
  await prisma.currencyRate.create({ data: { fromCurrency: "USD", toCurrency: "BRL", rate: 5.0, tenantId: tid } });
  await prisma.currencyRate.create({ data: { fromCurrency: "EUR", toCurrency: "BRL", rate: 5.5, tenantId: tid } });

  // Challenges
  await prisma.challenge.create({
    data: { name: "Desafio 52 Semanas", type: "52_WEEK", target: 1378, progress: 78, streak: 12, tenantId: tid },
  });
  await prisma.challenge.create({
    data: { name: "30 Dias Sem Gastos", type: "30_DAY", target: 30, progress: 8, streak: 8, tenantId: tid },
  });

  // Documents
  await prisma.document.create({
    data: { name: "Comprovante Aluguel Jan.pdf", type: "pdf", size: 245000, path: "/uploads/comprovante-aluguel.pdf", tags: '["aluguel","comprovante"]', uploadedBy: user.id, tenantId: tid },
  });

  // Onboarding (completed for demo)
  await prisma.onboardingProgress.create({
    data: { tenantId: tid, completedSteps: ["welcome","accounts","categories","import","goals","done"], completed: true },
  });

  // Audit logs
  await prisma.auditLog.create({
    data: { action: "CREATE", entity: "Account", entityId: pessoal.id, changes: '{"name":"Conta Pessoal"}', before: '{}', after: '{"name":"Conta Pessoal"}', userId: user.id, userName: "Admin", tenantId: tid },
  });

  // Loans
  await prisma.loan.create({ data: { name: "Financiamento Carro", type: "CAR", principal: 45000, interestRate: 12.5, monthlyPayment: 1200, totalPaid: 14400, remainingBalance: 35000, startDate: new Date("2024-01-15"), endDate: new Date("2028-01-15"), tenantId: tid } });
  await prisma.loan.create({ data: { name: "Empréstimo Pessoal", type: "PERSONAL", principal: 10000, interestRate: 18, monthlyPayment: 500, totalPaid: 3000, remainingBalance: 8200, startDate: new Date("2024-06-01"), tenantId: tid } });

  // Scheduled Reports
  await prisma.scheduledReport.create({ data: { name: "Resumo Mensal", reportType: "SUMMARY", frequency: "MONTHLY", nextSend: new Date("2026-03-01"), tenantId: tid } });

  // Budget Templates
  await prisma.budgetTemplate.create({ data: { name: "Regra 50/30/20", description: "50% necessidades, 30% desejos, 20% poupança", items: [{ categoryName: "Moradia", amount: 50 }, { categoryName: "Lazer", amount: 30 }, { categoryName: "Poupança", amount: 20 }], isPublic: true, tenantId: tid } });

  // Alert Rules
  await prisma.alertRule.create({ data: { tenantId: tid, name: "Saldo baixo", condition: { type: "balance_below", value: 500 }, action: { type: "create_notification" } } });
  await prisma.alertRule.create({ data: { tenantId: tid, name: "Transação alta", condition: { type: "transaction_amount_above", value: 1000 }, action: { type: "create_notification" } } });

  // Bank Connection (simulated)
  await prisma.bankConnection.create({ data: { tenantId: tid, bankName: "Nubank", bankLogo: "💜", status: "CONNECTED", lastSync: new Date(), accountId: pessoal.id } });

  // Plans
  const freePlan = await prisma.plan.create({
    data: { name: "Free", slug: "free", price: 0, currency: "BRL", interval: "MONTHLY", features: ["Dashboard básico"], maxUsers: 1, maxAccounts: 2, maxTransactionsPerMonth: 100 },
  });
  const starterPlan = await prisma.plan.create({
    data: { name: "Starter", slug: "starter", price: 29, currency: "BRL", interval: "MONTHLY", features: ["Relatórios avançados", "Suporte email"], maxUsers: 3, maxAccounts: 10, maxTransactionsPerMonth: -1 },
  });
  const proPlan = await prisma.plan.create({
    data: { name: "Pro", slug: "pro", price: 79, currency: "BRL", interval: "MONTHLY", features: ["API access", "MCP Server", "Importação OFX", "Divisão de despesas"], maxUsers: 10, maxAccounts: -1, maxTransactionsPerMonth: -1 },
  });
  await prisma.plan.create({
    data: { name: "Enterprise", slug: "enterprise", price: 199, currency: "BRL", interval: "MONTHLY", features: ["Tudo do Pro", "Suporte prioritário", "Branding customizado", "SLA garantido", "Onboarding dedicado"], maxUsers: -1, maxAccounts: -1, maxTransactionsPerMonth: -1 },
  });

  // Assign demo tenant to Pro plan
  await prisma.tenantSubscription.create({
    data: { tenantId: tid, planId: proPlan.id, status: "ACTIVE" },
  });

  // Sample expense split
  const firstTx = await prisma.transaction.findFirst({ where: { tenantId: tid } });
  if (firstTx) {
    await prisma.expenseSplitGroup.create({
      data: {
        transactionId: firstTx.id,
        description: "Almoço de equipe",
        splits: [
          { userId: user.id, userName: "Admin", amount: 50, paid: true },
          { userId: "guest-1", userName: "Maria", amount: 50, paid: false },
          { userId: "guest-2", userName: "João", amount: 50, paid: false },
        ],
        tenantId: tid,
      },
    });
  }

  // Open Finance Provider (simulated)
  const pluggyProvider = await prisma.openFinanceProvider.create({
    data: { tenantId: tid, provider: "PLUGGY", clientId: "demo_pluggy_id", clientSecret: "demo_pluggy_secret", active: true },
  });
  await prisma.openFinanceConnection.create({
    data: { tenantId: tid, providerId: pluggyProvider.id, externalId: "sim_nubank_1", institutionName: "Nubank", institutionLogo: "💜", status: "CONNECTED", consentId: "consent_demo_1", lastSync: new Date(), accountId: pessoal.id, metadata: { institutionId: "nubank", type: "digital_bank", simulated: true } },
  });
  await prisma.openFinanceConnection.create({
    data: { tenantId: tid, providerId: pluggyProvider.id, externalId: "sim_itau_1", institutionName: "Itaú Unibanco", institutionLogo: "🟠", status: "CONNECTED", consentId: "consent_demo_2", lastSync: new Date(), metadata: { institutionId: "itau", type: "bank", simulated: true } },
  });

  // Financial Snapshot
  await prisma.financialSnapshot.create({
    data: {
      tenantId: tid, month: currentMonth, overallScore: 72, overallGrade: "B-",
      spendingControl: 68, savings: 75, budgetAdherence: 80, debtManagement: 65, investmentGrowth: 72,
      recommendations: ["Tente economizar pelo menos 20% da renda.", "Revise gastos com transporte.", "Diversifique investimentos."],
      data: { income: 10500, expense: 7800, savingsRate: 25.7, totalDebt: 43200, totalInvested: 40255 },
    },
  });

  // Goal comments
  const firstGoal = await prisma.savingsGoal.findFirst({ where: { tenantId: tid } });
  if (firstGoal) {
    await prisma.goalComment.create({ data: { goalId: firstGoal.id, userId: user.id, userName: "Admin", text: "Depositei R$ 500 este mês! 🎉", tenantId: tid } });
    await prisma.goalComment.create({ data: { goalId: firstGoal.id, userId: user.id, userName: "Admin", text: "Meta de 30% atingida!", tenantId: tid } });
  }

  // Invite codes
  const inviteCodes = ["ORI2025A", "ORI2025B", "ORI2025C", "ORI2025D", "ORI2025E"];
  for (const code of inviteCodes) {
    await prisma.inviteCode.upsert({
      where: { code },
      update: {},
      create: { code, createdBy: user.id },
    });
  }
  console.log("✅ 5 códigos de convite criados:", inviteCodes.join(", "));

  console.log("✅ Seed concluído! Login: admin@ori.com / admin123");
}

main().catch(console.error).finally(() => prisma.$disconnect());
