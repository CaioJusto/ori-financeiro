import { prisma } from "@/lib/prisma";

type ToolHandler = (tenantId: string, params: Record<string, unknown>) => Promise<unknown>;

export const mcpTools: Record<string, { description: string; handler: ToolHandler }> = {
  list_accounts: {
    description: "List all accounts with balances",
    handler: async (tenantId) => {
      const accounts = await prisma.account.findMany({
        where: { tenantId },
        include: { transactions: true, transfersFrom: true, transfersTo: true },
      });
      return accounts.map((a) => {
        const income = a.transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
        const expense = a.transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
        const tIn = a.transfersTo.reduce((s, t) => s + t.amount, 0);
        const tOut = a.transfersFrom.reduce((s, t) => s + t.amount, 0);
        return { id: a.id, name: a.name, type: a.type, currency: a.currency, color: a.color, balance: income - expense + tIn - tOut };
      });
    },
  },

  get_account: {
    description: "Get account details by id",
    handler: async (tenantId, params) => {
      const account = await prisma.account.findFirst({
        where: { id: params.id as string, tenantId },
        include: { transactions: true, transfersFrom: true, transfersTo: true },
      });
      if (!account) return { error: "Account not found" };
      const income = account.transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
      const expense = account.transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
      const tIn = account.transfersTo.reduce((s, t) => s + t.amount, 0);
      const tOut = account.transfersFrom.reduce((s, t) => s + t.amount, 0);
      return { ...account, balance: income - expense + tIn - tOut, transactions: undefined, transfersFrom: undefined, transfersTo: undefined };
    },
  },

  list_transactions: {
    description: "List transactions with filters (dateFrom, dateTo, accountId, categoryId, search, type, limit)",
    handler: async (tenantId, params) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const where: any = { tenantId };
      if (params.accountId) where.accountId = params.accountId;
      if (params.categoryId) where.categoryId = params.categoryId;
      if (params.type) where.type = params.type;
      if (params.search) where.description = { contains: params.search as string, mode: "insensitive" };
      if (params.dateFrom || params.dateTo) {
        where.date = {};
        if (params.dateFrom) where.date.gte = new Date(params.dateFrom as string);
        if (params.dateTo) where.date.lte = new Date(params.dateTo as string);
      }
      return prisma.transaction.findMany({
        where,
        include: { account: { select: { name: true } }, category: { select: { name: true } } },
        orderBy: { date: "desc" },
        take: Math.min(Number(params.limit) || 50, 200),
      });
    },
  },

  create_transaction: {
    description: "Create a new transaction (description, amount, type, date, accountId, categoryId)",
    handler: async (tenantId, params) => {
      if (!params.description || !params.amount || !params.type || !params.date || !params.accountId || !params.categoryId) {
        return { error: "Missing required fields: description, amount, type, date, accountId, categoryId" };
      }
      return prisma.transaction.create({
        data: {
          description: params.description as string,
          amount: Number(params.amount),
          type: params.type as string,
          date: new Date(params.date as string),
          accountId: params.accountId as string,
          categoryId: params.categoryId as string,
          tenantId,
        },
      });
    },
  },

  get_summary: {
    description: "Get financial summary (total balance, income, expenses for a period). Params: dateFrom, dateTo",
    handler: async (tenantId, params) => {
      const accounts = await prisma.account.findMany({
        where: { tenantId },
        include: { transactions: true, transfersFrom: true, transfersTo: true },
      });
      const totalBalance = accounts.reduce((sum, a) => {
        const inc = a.transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
        const exp = a.transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
        const tIn = a.transfersTo.reduce((s, t) => s + t.amount, 0);
        const tOut = a.transfersFrom.reduce((s, t) => s + t.amount, 0);
        return sum + inc - exp + tIn - tOut;
      }, 0);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const dateFilter: any = {};
      if (params.dateFrom) dateFilter.gte = new Date(params.dateFrom as string);
      if (params.dateTo) dateFilter.lte = new Date(params.dateTo as string);

      const txWhere = Object.keys(dateFilter).length > 0
        ? { tenantId, date: dateFilter }
        : { tenantId, date: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } };

      const transactions = await prisma.transaction.findMany({ where: txWhere });
      const income = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
      const expenses = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

      return { totalBalance, income, expenses, net: income - expenses, transactionCount: transactions.length };
    },
  },

  list_categories: {
    description: "List all categories",
    handler: async (tenantId) => {
      return prisma.category.findMany({ where: { tenantId }, orderBy: { name: "asc" } });
    },
  },

  list_budgets: {
    description: "List budgets with current spending",
    handler: async (tenantId) => {
      const now = new Date();
      const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      const budgets = await prisma.budget.findMany({
        where: { tenantId, month },
        include: { category: true },
      });
      const transactions = await prisma.transaction.findMany({
        where: {
          tenantId, type: "expense",
          date: { gte: new Date(now.getFullYear(), now.getMonth(), 1), lte: new Date(now.getFullYear(), now.getMonth() + 1, 0) },
        },
      });
      return budgets.map((b) => {
        const spent = transactions.filter((t) => t.categoryId === b.categoryId).reduce((s, t) => s + t.amount, 0);
        return { id: b.id, category: b.category.name, budgeted: b.amount, spent, remaining: b.amount - spent, percentUsed: b.amount > 0 ? (spent / b.amount) * 100 : 0 };
      });
    },
  },

  get_cashflow: {
    description: "Get cash flow projection for next N months (default 3)",
    handler: async (tenantId, params) => {
      const months = Number(params.months) || 3;
      const recurring = await prisma.recurring.findMany({ where: { tenantId, active: true } });
      const projection = [];
      for (let i = 0; i < months; i++) {
        const date = new Date();
        date.setMonth(date.getMonth() + i + 1);
        const monthIncome = recurring.filter((r) => r.type === "income").reduce((s, r) => s + r.amount, 0);
        const monthExpense = recurring.filter((r) => r.type === "expense").reduce((s, r) => s + r.amount, 0);
        projection.push({
          month: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
          projectedIncome: monthIncome, projectedExpense: monthExpense, projectedNet: monthIncome - monthExpense,
        });
      }
      return projection;
    },
  },

  list_goals: {
    description: "List savings goals with progress",
    handler: async (tenantId) => {
      const goals = await prisma.savingsGoal.findMany({ where: { tenantId } });
      return goals.map((g) => ({
        id: g.id, name: g.name, targetAmount: g.targetAmount, currentAmount: g.currentAmount,
        progress: g.targetAmount > 0 ? (g.currentAmount / g.targetAmount) * 100 : 0,
        deadline: g.deadline,
      }));
    },
  },

  list_recurring: {
    description: "List recurring transactions",
    handler: async (tenantId) => {
      return prisma.recurring.findMany({
        where: { tenantId },
        include: { account: { select: { name: true } }, category: { select: { name: true } } },
      });
    },
  },

  list_invoices: {
    description: "List invoices",
    handler: async (tenantId) => {
      return prisma.invoice.findMany({ where: { tenantId }, orderBy: { createdAt: "desc" } });
    },
  },

  create_invoice: {
    description: "Create a new invoice (number, clientName, items, subtotal, total, dueDate)",
    handler: async (tenantId, params) => {
      if (!params.number || !params.clientName || !params.total || !params.dueDate) {
        return { error: "Missing required fields" };
      }
      return prisma.invoice.create({
        data: {
          number: params.number as string,
          clientName: params.clientName as string,
          clientEmail: (params.clientEmail as string) || "",
          items: (params.items as object) || [],
          subtotal: Number(params.subtotal) || Number(params.total),
          total: Number(params.total),
          tax: Number(params.tax) || 0,
          dueDate: new Date(params.dueDate as string),
          notes: (params.notes as string) || null,
          tenantId,
        },
      });
    },
  },

  get_insights: {
    description: "Get AI-generated financial insights",
    handler: async (tenantId) => {
      const now = new Date();
      const transactions = await prisma.transaction.findMany({
        where: { tenantId, date: { gte: new Date(now.getFullYear(), now.getMonth(), 1) } },
        include: { category: true },
      });
      const income = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
      const expense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
      const insights = [];
      if (expense > income) insights.push({ type: "warning", message: `Gastos (R$${expense.toFixed(2)}) excedem receitas (R$${income.toFixed(2)}) este mês` });
      if (income > 0) insights.push({ type: "info", message: `Taxa de poupança: ${(((income - expense) / income) * 100).toFixed(1)}%` });
      const catSpend = new Map<string, number>();
      transactions.filter((t) => t.type === "expense").forEach((t) => catSpend.set(t.category.name, (catSpend.get(t.category.name) || 0) + t.amount));
      const topCat = Array.from(catSpend.entries()).sort((a, b) => b[1] - a[1])[0];
      if (topCat) insights.push({ type: "tip", message: `Maior gasto: ${topCat[0]} (R$${topCat[1].toFixed(2)})` });
      return insights;
    },
  },

  search_transactions: {
    description: "Full-text search across transactions (query, limit)",
    handler: async (tenantId, params) => {
      const query = (params.query as string) || "";
      if (!query) return { error: "query parameter required" };
      return prisma.transaction.findMany({
        where: {
          tenantId,
          OR: [
            { description: { contains: query, mode: "insensitive" } },
            { notes: { contains: query, mode: "insensitive" } },
          ],
        },
        include: { account: { select: { name: true } }, category: { select: { name: true } } },
        orderBy: { date: "desc" },
        take: Math.min(Number(params.limit) || 50, 200),
      });
    },
  },
};
