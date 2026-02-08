import { prisma } from "@/lib/prisma";
import { TenantSession } from "@/lib/tenant";
import { ParsedIntent } from "./intent-parser";
import { FINANCIAL_TIPS } from "@/data/financial-tips";

function formatCurrency(value: number): string {
  return `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("pt-BR");
}

function progressBar(pct: number, width = 10): string {
  const filled = Math.round((Math.min(pct, 100) / 100) * width);
  return "[" + "█".repeat(filled) + "░".repeat(width - filled) + "] " + pct.toFixed(0) + "%";
}

function statusEmoji(pct: number): string {
  if (pct > 100) return "🔴";
  if (pct > 80) return "🟡";
  return "🟢";
}

function asciiBarChart(data: [string, number][], maxWidth = 15): string {
  if (!data.length) return "";
  const maxVal = Math.max(...data.map(d => d[1]));
  return data.map(([label, val]) => {
    const barLen = maxVal > 0 ? Math.round((val / maxVal) * maxWidth) : 0;
    return `${label.padEnd(14)} ${"█".repeat(barLen)}${"░".repeat(maxWidth - barLen)} ${formatCurrency(val)}`;
  }).join("\n");
}

function followUpSuggestions(suggestions: string[]): string {
  return "\n\n---\n💬 " + suggestions.join(" · ");
}

export async function executeIntent(intent: ParsedIntent, tenant: TenantSession): Promise<string> {
  const { action, params } = intent;
  const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;

  try {
    switch (action) {
      case "greeting":
        return "👋 Olá! Sou seu assistente financeiro. Como posso ajudar?\n\nPosso criar transações, consultar saldos, mostrar relatórios e muito mais. Digite **ajuda** para ver os comandos disponíveis." + followUpSuggestions(["Resumo do mês", "Meu saldo", "Dica financeira"]);

      case "help":
        return `🤖 **Comandos disponíveis:**\n\n**💸 Transações:**\n- "gastei R$50 em alimentação"\n- "recebi R$3000 de salário"\n- "transferir R$500 da pessoal para empresarial"\n- "parcelar compra de R$600 em 3x"\n- "agendar pagamento de R$100 para dia 15"\n- "deletar última transação"\n\n**📊 Consultas:**\n- "qual meu saldo?"\n- "resumo do mês"\n- "quanto gastei esse mês?"\n- "gastos em alimentação"\n- "transações acima de R$500"\n- "média de gastos mensais"\n\n**📈 Análises:**\n- "comparar gastos de janeiro vs fevereiro"\n- "qual categoria mais gastei?"\n- "previsão de gastos pro mês"\n- "quanto posso gastar por dia?"\n\n**🎯 Gestão:**\n- "como estão meus orçamentos?"\n- "quanto falta pra minha meta?"\n- "contas a vencer essa semana"\n- "listar minhas contas"\n- "criar conta Nubank"\n\n**💡 Dicas:**\n- "dica financeira"\n- "como economizar?"\n- "análise dos meus gastos"`;

      case "create_expense": {
        if (!params.amount) return "❌ Não entendi o valor. Tente algo como: **gastei R$50 em alimentação**";
        const accounts = await prisma.account.findMany({ where: { tenantId: tenant.tenantId }, take: 1 });
        if (!accounts.length) return "❌ Nenhuma conta encontrada. Crie uma conta primeiro: **criar conta Minha Conta**";
        
        let categoryId: string | undefined;
        if (params.category) {
          const cat = await prisma.category.findFirst({
            where: { tenantId: tenant.tenantId, type: "expense", name: { contains: params.category, mode: "insensitive" } },
          });
          if (cat) categoryId = cat.id;
        }
        if (!categoryId) {
          const defaultCat = await prisma.category.findFirst({ where: { tenantId: tenant.tenantId, type: "expense" } });
          if (!defaultCat) return "❌ Nenhuma categoria de despesa encontrada.";
          categoryId = defaultCat.id;
        }

        const tx = await prisma.transaction.create({
          data: {
            description: params.description || params.category || "Despesa via chat",
            amount: params.amount,
            type: "expense",
            date: new Date(params.date || new Date()),
            accountId: accounts[0].id,
            categoryId,
            tenantId: tenant.tenantId,
          },
          include: { category: true, account: true },
        });
        return `✅ **Despesa registrada!**\n\n- **Valor:** ${formatCurrency(tx.amount)}\n- **Categoria:** ${tx.category.name}\n- **Conta:** ${tx.account.name}\n- **Data:** ${formatDate(tx.date)}` + followUpSuggestions(["Resumo do mês", "Quanto gastei?", "Deletar transação"]);
      }

      case "create_income": {
        if (!params.amount) return "❌ Não entendi o valor. Tente algo como: **recebi R$3000 de salário**";
        const accounts = await prisma.account.findMany({ where: { tenantId: tenant.tenantId }, take: 1 });
        if (!accounts.length) return "❌ Nenhuma conta encontrada.";
        const incomeCat = await prisma.category.findFirst({ where: { tenantId: tenant.tenantId, type: "income" } });
        if (!incomeCat) return "❌ Nenhuma categoria de receita encontrada.";

        const tx = await prisma.transaction.create({
          data: {
            description: params.description || "Receita via chat",
            amount: params.amount,
            type: "income",
            date: new Date(params.date || new Date()),
            accountId: accounts[0].id,
            categoryId: incomeCat.id,
            tenantId: tenant.tenantId,
          },
          include: { category: true, account: true },
        });
        return `✅ **Receita registrada!**\n\n- **Valor:** ${formatCurrency(tx.amount)}\n- **Categoria:** ${tx.category.name}\n- **Conta:** ${tx.account.name}\n- **Data:** ${formatDate(tx.date)}` + followUpSuggestions(["Meu saldo", "Resumo do mês"]);
      }

      case "create_transfer": {
        if (!params.amount) return "❌ Não entendi o valor da transferência.";
        const allAccounts = await prisma.account.findMany({ where: { tenantId: tenant.tenantId } });
        if (allAccounts.length < 2) return "❌ Você precisa de pelo menos 2 contas para transferir.";

        const fromAcc = params.accountFrom ? allAccounts.find(a => a.name.toLowerCase().includes(params.accountFrom!.toLowerCase())) : allAccounts[0];
        const toAcc = params.accountTo ? allAccounts.find(a => a.name.toLowerCase().includes(params.accountTo!.toLowerCase())) : allAccounts[1];
        if (!fromAcc || !toAcc) return `❌ Conta não encontrada. Contas disponíveis: ${allAccounts.map(a => a.name).join(", ")}`;

        await prisma.transfer.create({
          data: {
            amount: params.amount,
            fromAccountId: fromAcc.id,
            toAccountId: toAcc.id,
            date: new Date(params.date || new Date()),
            tenantId: tenant.tenantId,
          },
        });
        return `✅ **Transferência realizada!**\n\n- **Valor:** ${formatCurrency(params.amount)}\n- **De:** ${fromAcc.name}\n- **Para:** ${toAcc.name}` + followUpSuggestions(["Meu saldo", "Listar contas"]);
      }

      case "create_installment": {
        if (!params.amount) return "❌ Não entendi o valor. Tente: **parcelar compra de R$600 em 3x**";
        const installments = params.installments || 3;
        const perInstallment = params.amount / installments;
        
        const accounts = await prisma.account.findMany({ where: { tenantId: tenant.tenantId }, take: 1 });
        if (!accounts.length) return "❌ Nenhuma conta encontrada.";
        
        let categoryId: string | undefined;
        if (params.category) {
          const cat = await prisma.category.findFirst({
            where: { tenantId: tenant.tenantId, type: "expense", name: { contains: params.category, mode: "insensitive" } },
          });
          if (cat) categoryId = cat.id;
        }
        if (!categoryId) {
          const defaultCat = await prisma.category.findFirst({ where: { tenantId: tenant.tenantId, type: "expense" } });
          if (!defaultCat) return "❌ Nenhuma categoria de despesa encontrada.";
          categoryId = defaultCat.id;
        }

        const baseDate = new Date(params.date || new Date());
        const created = [];
        for (let i = 0; i < installments; i++) {
          const txDate = new Date(baseDate);
          txDate.setMonth(txDate.getMonth() + i);
          const tx = await prisma.transaction.create({
            data: {
              description: `${params.description || "Compra parcelada"} (${i + 1}/${installments})`,
              amount: perInstallment,
              type: "expense",
              date: txDate,
              accountId: accounts[0].id,
              categoryId,
              tenantId: tenant.tenantId,
            },
          });
          created.push(tx);
        }

        return `✅ **Compra parcelada registrada!**\n\n- **Total:** ${formatCurrency(params.amount)}\n- **Parcelas:** ${installments}x de ${formatCurrency(perInstallment)}\n- **Início:** ${formatDate(baseDate)}\n- **Fim:** ${formatDate(new Date(baseDate.getFullYear(), baseDate.getMonth() + installments - 1, baseDate.getDate()))}` + followUpSuggestions(["Resumo do mês", "Quanto gastei?"]);
      }

      case "create_scheduled": {
        if (!params.amount) return "❌ Não entendi o valor. Tente: **agendar pagamento de R$100 para dia 15**";
        
        const accounts = await prisma.account.findMany({ where: { tenantId: tenant.tenantId }, take: 1 });
        if (!accounts.length) return "❌ Nenhuma conta encontrada.";
        const defaultCat = await prisma.category.findFirst({ where: { tenantId: tenant.tenantId, type: "expense" } });
        if (!defaultCat) return "❌ Nenhuma categoria encontrada.";

        const txDate = new Date(params.date || new Date());
        await prisma.transaction.create({
          data: {
            description: params.description || "Pagamento agendado",
            amount: params.amount,
            type: "expense",
            date: txDate,
            accountId: accounts[0].id,
            categoryId: defaultCat.id,
            tenantId: tenant.tenantId,
          },
        });

        return `✅ **Pagamento agendado!**\n\n- **Valor:** ${formatCurrency(params.amount)}\n- **Data:** ${formatDate(txDate)}\n\n⚠️ _Nota: O pagamento foi registrado como despesa na data indicada._` + followUpSuggestions(["Contas a pagar", "Resumo do mês"]);
      }

      case "delete_last_transaction": {
        const last = await prisma.transaction.findFirst({
          where: { tenantId: tenant.tenantId },
          orderBy: { createdAt: "desc" },
          include: { category: true },
        });
        if (!last) return "❌ Nenhuma transação encontrada.";
        await prisma.transaction.delete({ where: { id: last.id } });
        return `✅ **Transação deletada:**\n\n- ${last.description} - ${formatCurrency(last.amount)} (${last.type === "expense" ? "despesa" : "receita"})`;
      }

      case "query_expenses": {
        const month = params.month || currentMonth;
        const [year, mon] = month.split("-").map(Number);
        const startDate = new Date(year, mon - 1, 1);
        const endDate = new Date(year, mon, 0, 23, 59, 59);

        const expenses = await prisma.transaction.findMany({
          where: { tenantId: tenant.tenantId, type: "expense", date: { gte: startDate, lte: endDate } },
          include: { category: true },
          orderBy: { amount: "desc" },
        });

        if (!expenses.length) return "📊 Nenhuma despesa encontrada neste período.";
        const total = expenses.reduce((s, t) => s + t.amount, 0);
        const byCategory: [string, number][] = [];
        const catMap: Record<string, number> = {};
        expenses.forEach(t => { catMap[t.category.name] = (catMap[t.category.name] || 0) + t.amount; });
        Object.entries(catMap).sort((a, b) => b[1] - a[1]).forEach(([cat, val]) => byCategory.push([cat, val]));
        
        let response = `📊 **Gastos de ${String(mon).padStart(2, "0")}/${year}**\n\n**Total:** ${formatCurrency(total)}\n\n**Por categoria:**\n\`\`\`\n${asciiBarChart(byCategory)}\n\`\`\``;
        return response + followUpSuggestions(["Qual categoria mais gastei?", "Previsão do mês", "Comparar meses"]);
      }

      case "query_expenses_by_category": {
        const month = params.month || currentMonth;
        const [year, mon] = month.split("-").map(Number);
        const startDate = new Date(year, mon - 1, 1);
        const endDate = new Date(year, mon, 0, 23, 59, 59);

        const cat = params.category ? await prisma.category.findFirst({
          where: { tenantId: tenant.tenantId, name: { contains: params.category, mode: "insensitive" } },
        }) : null;

        const where: Record<string, unknown> = { tenantId: tenant.tenantId, type: "expense", date: { gte: startDate, lte: endDate } };
        if (cat) where.categoryId = cat.id;

        const expenses = await prisma.transaction.findMany({
          where, include: { category: true }, orderBy: { date: "desc" },
        });

        if (!expenses.length) return `📊 Nenhum gasto em **${params.category || "categoria"}** neste período.`;
        const total = expenses.reduce((s, t) => s + t.amount, 0);
        let response = `📊 **Gastos em ${cat?.name || params.category}** (${String(mon).padStart(2, "0")}/${year})\n\n**Total:** ${formatCurrency(total)}\n\n**Transações:**\n`;
        expenses.slice(0, 10).forEach(t => {
          response += `- ${formatDate(t.date)} | ${t.description} | ${formatCurrency(t.amount)}\n`;
        });
        if (expenses.length > 10) response += `\n_...e mais ${expenses.length - 10} transações_`;
        return response + followUpSuggestions(["Transações acima de R$100", "Resumo do mês"]);
      }

      case "query_expenses_by_amount": {
        const month = params.month || currentMonth;
        const [year, mon] = month.split("-").map(Number);
        const startDate = new Date(year, mon - 1, 1);
        const endDate = new Date(year, mon, 0, 23, 59, 59);
        const minAmount = params.minAmount || 500;

        const expenses = await prisma.transaction.findMany({
          where: { tenantId: tenant.tenantId, type: "expense", date: { gte: startDate, lte: endDate }, amount: { gte: minAmount } },
          include: { category: true },
          orderBy: { amount: "desc" },
        });

        if (!expenses.length) return `📊 Nenhuma transação acima de ${formatCurrency(minAmount)} neste período.`;
        const total = expenses.reduce((s, t) => s + t.amount, 0);
        let response = `📊 **Transações acima de ${formatCurrency(minAmount)}** (${String(mon).padStart(2, "0")}/${year})\n\n**Total:** ${formatCurrency(total)} | **Quantidade:** ${expenses.length}\n\n`;
        expenses.slice(0, 15).forEach(t => {
          response += `- ${formatDate(t.date)} | **${t.description}** | ${formatCurrency(t.amount)} | ${t.category.name}\n`;
        });
        if (expenses.length > 15) response += `\n_...e mais ${expenses.length - 15}_`;
        return response + followUpSuggestions(["Resumo do mês", "Análise de gastos"]);
      }

      case "query_balance": {
        const accounts = await prisma.account.findMany({
          where: { tenantId: tenant.tenantId },
          include: { transactions: true, transfersFrom: true, transfersTo: true },
        });
        if (!accounts.length) return "❌ Nenhuma conta encontrada.";
        
        let response = "💳 **Saldo das contas:**\n\n";
        let totalBalance = 0;
        accounts.forEach(a => {
          const income = a.transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
          const expense = a.transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
          const transferIn = a.transfersTo.reduce((s, t) => s + t.amount, 0);
          const transferOut = a.transfersFrom.reduce((s, t) => s + t.amount, 0);
          const balance = income - expense + transferIn - transferOut;
          totalBalance += balance;
          const icon = balance >= 0 ? "🟢" : "🔴";
          response += `${icon} **${a.name}:** ${formatCurrency(balance)}\n`;
        });
        response += `\n**💰 Total:** ${formatCurrency(totalBalance)}`;
        return response + followUpSuggestions(["Resumo do mês", "Quanto posso gastar por dia?"]);
      }

      case "monthly_summary": {
        const month = params.month || currentMonth;
        const [year, mon] = month.split("-").map(Number);
        const startDate = new Date(year, mon - 1, 1);
        const endDate = new Date(year, mon, 0, 23, 59, 59);

        const transactions = await prisma.transaction.findMany({
          where: { tenantId: tenant.tenantId, date: { gte: startDate, lte: endDate } },
        });

        const income = transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
        const expense = transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
        const balance = income - expense;
        const savingsRate = income > 0 ? ((balance / income) * 100) : 0;

        let response = `📋 **Resumo de ${String(mon).padStart(2, "0")}/${year}**\n\n`;
        response += `- 📈 **Receitas:** ${formatCurrency(income)}\n`;
        response += `- 📉 **Despesas:** ${formatCurrency(expense)}\n`;
        response += `- ${balance >= 0 ? "✅" : "⚠️"} **Saldo:** ${formatCurrency(balance)}\n`;
        response += `- 📊 **Transações:** ${transactions.length}\n`;
        response += `- 💰 **Taxa de economia:** ${progressBar(savingsRate)}`;
        return response + followUpSuggestions(["Análise de gastos", "Previsão do mês", "Comparar meses"]);
      }

      case "budget_status": {
        const month = params.month || currentMonth;
        const budgets = await prisma.budget.findMany({
          where: { tenantId: tenant.tenantId, month },
          include: { category: true },
        });
        if (!budgets.length) return "📊 Nenhum orçamento definido para este mês.";

        const [year, mon] = month.split("-").map(Number);
        const startDate = new Date(year, mon - 1, 1);
        const endDate = new Date(year, mon, 0, 23, 59, 59);

        let response = `🎯 **Status dos Orçamentos (${String(mon).padStart(2, "0")}/${year}):**\n\n`;
        for (const b of budgets) {
          const spent = await prisma.transaction.aggregate({
            where: { tenantId: tenant.tenantId, categoryId: b.categoryId, type: "expense", date: { gte: startDate, lte: endDate } },
            _sum: { amount: true },
          });
          const used = spent._sum.amount || 0;
          const pct = (used / b.amount) * 100;
          response += `${statusEmoji(pct)} **${b.category.name}:** ${formatCurrency(used)} / ${formatCurrency(b.amount)}\n   ${progressBar(pct)}\n`;
        }
        return response + followUpSuggestions(["Quanto posso gastar por dia?", "Previsão do mês"]);
      }

      case "goal_progress": {
        const where: Record<string, unknown> = { tenantId: tenant.tenantId };
        if (params.goalName) where.name = { contains: params.goalName, mode: "insensitive" };
        const goals = await prisma.savingsGoal.findMany({ where });
        if (!goals.length) return "🎯 Nenhuma meta encontrada.";

        let response = "🎯 **Progresso das Metas:**\n\n";
        goals.forEach(g => {
          const pct = (g.currentAmount / g.targetAmount) * 100;
          const remaining = g.targetAmount - g.currentAmount;
          response += `**${g.name}**\n${progressBar(pct)} ${formatCurrency(g.currentAmount)} / ${formatCurrency(g.targetAmount)}\nFaltam ${formatCurrency(remaining)}${g.deadline ? ` até ${formatDate(g.deadline)}` : ""}\n\n`;
        });
        return response + followUpSuggestions(["Dica financeira", "Como economizar?"]);
      }

      case "upcoming_bills": {
        const now = new Date();
        const endOfWeek = new Date(now); endOfWeek.setDate(now.getDate() + 7);
        const payables = await prisma.payable.findMany({
          where: { tenantId: tenant.tenantId, paid: false, dueDate: { gte: now, lte: endOfWeek } },
          orderBy: { dueDate: "asc" },
        });
        if (!payables.length) return "✅ Nenhuma conta a vencer nos próximos 7 dias!";

        let response = "📅 **Contas a vencer esta semana:**\n\n";
        let total = 0;
        payables.forEach(p => {
          total += p.amount;
          response += `- ${formatDate(p.dueDate)} | **${p.description}** | ${formatCurrency(p.amount)}\n`;
        });
        response += `\n**Total:** ${formatCurrency(total)}`;
        return response + followUpSuggestions(["Meu saldo", "Resumo do mês"]);
      }

      case "monthly_report": {
        const month = params.month || currentMonth;
        const [year, mon] = month.split("-").map(Number);
        const startDate = new Date(year, mon - 1, 1);
        const endDate = new Date(year, mon, 0, 23, 59, 59);

        const transactions = await prisma.transaction.findMany({
          where: { tenantId: tenant.tenantId, date: { gte: startDate, lte: endDate } },
          include: { category: true },
        });

        const income = transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
        const expense = transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
        const byCategory: Record<string, number> = {};
        transactions.filter(t => t.type === "expense").forEach(t => {
          byCategory[t.category.name] = (byCategory[t.category.name] || 0) + t.amount;
        });

        let response = `📊 **Relatório de ${String(mon).padStart(2, "0")}/${year}**\n\n`;
        response += `| Indicador | Valor |\n|-----------|-------|\n`;
        response += `| Receitas | ${formatCurrency(income)} |\n`;
        response += `| Despesas | ${formatCurrency(expense)} |\n`;
        response += `| Saldo | ${formatCurrency(income - expense)} |\n`;
        response += `| Transações | ${transactions.length} |\n\n`;
        
        if (Object.keys(byCategory).length) {
          const sorted: [string, number][] = Object.entries(byCategory).sort((a, b) => b[1] - a[1]).slice(0, 5);
          response += `**Top Despesas por Categoria:**\n\`\`\`\n${asciiBarChart(sorted)}\n\`\`\``;
        }
        return response + followUpSuggestions(["Comparar meses", "Análise de gastos"]);
      }

      case "create_account": {
        const name = params.accountName || "Nova Conta";
        const account = await prisma.account.create({
          data: { name, tenantId: tenant.tenantId },
        });
        return `✅ **Conta criada!**\n\n- **Nome:** ${account.name}\n- **Tipo:** ${account.type}`;
      }

      case "list_accounts": {
        const accounts = await prisma.account.findMany({
          where: { tenantId: tenant.tenantId },
          include: { transactions: true, transfersFrom: true, transfersTo: true },
        });
        if (!accounts.length) return "❌ Nenhuma conta encontrada.";

        let response = "💳 **Suas Contas:**\n\n";
        accounts.forEach(a => {
          const income = a.transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
          const expense = a.transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
          const transferIn = a.transfersTo.reduce((s, t) => s + t.amount, 0);
          const transferOut = a.transfersFrom.reduce((s, t) => s + t.amount, 0);
          const balance = income - expense + transferIn - transferOut;
          response += `- **${a.name}** (${a.type}) — ${formatCurrency(balance)}\n`;
        });
        return response;
      }

      case "financial_tip": {
        const tip = FINANCIAL_TIPS[Math.floor(Math.random() * FINANCIAL_TIPS.length)];
        return `💡 **${tip.title}**\n\n${tip.content}` + followUpSuggestions(["Outra dica", "Como economizar?", "Análise de gastos"]);
      }

      case "savings_suggestions": {
        const now = new Date();
        const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        const expenses = await prisma.transaction.findMany({
          where: { tenantId: tenant.tenantId, type: "expense", date: { gte: startDate, lte: endDate } },
          include: { category: true },
        });

        const byCategory: Record<string, number> = {};
        expenses.forEach(t => { byCategory[t.category.name] = (byCategory[t.category.name] || 0) + t.amount; });
        const sorted = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);

        let response = "💡 **Sugestões para Economizar:**\n\n";
        if (sorted.length) {
          response += `Suas maiores categorias de gasto:\n\`\`\`\n${asciiBarChart(sorted.slice(0, 3) as [string, number][])}\n\`\`\`\n`;
          response += `\n**Dicas:**\n`;
          response += `- Revise os gastos na categoria **${sorted[0][0]}** — é onde mais sai dinheiro\n`;
          response += `- Defina um orçamento para cada categoria\n`;
          response += `- Use a regra 50/30/20: necessidades, desejos, poupança\n`;
          response += `- Configure alertas de orçamento para ser avisado quando estiver perto do limite`;
        } else {
          response += "Ainda não há gastos registrados este mês para analisar.";
        }
        return response;
      }

      case "spending_analysis": {
        const month = params.month || currentMonth;
        const [year, mon] = month.split("-").map(Number);
        const startDate = new Date(year, mon - 1, 1);
        const endDate = new Date(year, mon, 0, 23, 59, 59);

        const expenses = await prisma.transaction.findMany({
          where: { tenantId: tenant.tenantId, type: "expense", date: { gte: startDate, lte: endDate } },
          include: { category: true },
        });
        const totalExpense = expenses.reduce((s, t) => s + t.amount, 0);

        const prevStart = new Date(year, mon - 2, 1);
        const prevEnd = new Date(year, mon - 1, 0, 23, 59, 59);
        const prevExpenses = await prisma.transaction.findMany({
          where: { tenantId: tenant.tenantId, type: "expense", date: { gte: prevStart, lte: prevEnd } },
        });
        const prevTotal = prevExpenses.reduce((s, t) => s + t.amount, 0);

        const byCategory: Record<string, number> = {};
        expenses.forEach(t => { byCategory[t.category.name] = (byCategory[t.category.name] || 0) + t.amount; });

        let response = `📊 **Análise de Gastos (${String(mon).padStart(2, "0")}/${year})**\n\n`;
        response += `**Total de despesas:** ${formatCurrency(totalExpense)}\n`;
        if (prevTotal > 0) {
          const change = ((totalExpense - prevTotal) / prevTotal * 100);
          const icon = change > 0 ? "📈 🔴" : "📉 🟢";
          response += `**Variação vs mês anterior:** ${icon} ${change > 0 ? "+" : ""}${change.toFixed(1)}%\n`;
        }
        
        const sorted: [string, number][] = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
        if (sorted.length) {
          response += `\n**Distribuição por categoria:**\n\`\`\`\n${asciiBarChart(sorted)}\n\`\`\``;
        }
        return response + followUpSuggestions(["Comparar meses", "Previsão do mês", "Como economizar?"]);
      }

      case "period_comparison": {
        const month1 = params.month || currentMonth;
        const now = new Date();
        const month2 = params.month2 || `${now.getFullYear()}-${String(now.getMonth()).padStart(2, "0")}`;
        
        const getMonthData = async (month: string) => {
          const [y, m] = month.split("-").map(Number);
          const start = new Date(y, m - 1, 1);
          const end = new Date(y, m, 0, 23, 59, 59);
          const txs = await prisma.transaction.findMany({
            where: { tenantId: tenant.tenantId, date: { gte: start, lte: end } },
            include: { category: true },
          });
          const income = txs.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
          const expense = txs.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
          const byCategory: Record<string, number> = {};
          txs.filter(t => t.type === "expense").forEach(t => {
            byCategory[t.category.name] = (byCategory[t.category.name] || 0) + t.amount;
          });
          return { income, expense, byCategory, count: txs.length };
        };

        const d1 = await getMonthData(month1);
        const d2 = await getMonthData(month2);
        const [, m1] = month1.split("-").map(Number);
        const [, m2] = month2.split("-").map(Number);
        const monthNames = ["", "Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

        let response = `📊 **Comparação: ${monthNames[m1]} vs ${monthNames[m2]}**\n\n`;
        response += `| | ${monthNames[m1]} | ${monthNames[m2]} | Variação |\n|---|---|---|---|\n`;
        response += `| Receitas | ${formatCurrency(d1.income)} | ${formatCurrency(d2.income)} | ${d2.income > 0 ? ((d1.income - d2.income) / d2.income * 100).toFixed(0) + "%" : "-"} |\n`;
        response += `| Despesas | ${formatCurrency(d1.expense)} | ${formatCurrency(d2.expense)} | ${d2.expense > 0 ? ((d1.expense - d2.expense) / d2.expense * 100).toFixed(0) + "%" : "-"} |\n`;
        response += `| Saldo | ${formatCurrency(d1.income - d1.expense)} | ${formatCurrency(d2.income - d2.expense)} | - |\n`;

        const changeExpense = d2.expense > 0 ? ((d1.expense - d2.expense) / d2.expense * 100) : 0;
        response += `\n${changeExpense > 0 ? "🔴 Gastos aumentaram" : "🟢 Gastos diminuíram"} ${Math.abs(changeExpense).toFixed(0)}% em relação ao mês anterior.`;
        return response + followUpSuggestions(["Análise de gastos", "Previsão do mês"]);
      }

      case "top_spending_category": {
        const month = params.month || currentMonth;
        const [year, mon] = month.split("-").map(Number);
        const startDate = new Date(year, mon - 1, 1);
        const endDate = new Date(year, mon, 0, 23, 59, 59);

        const expenses = await prisma.transaction.findMany({
          where: { tenantId: tenant.tenantId, type: "expense", date: { gte: startDate, lte: endDate } },
          include: { category: true },
        });

        if (!expenses.length) return "📊 Nenhuma despesa encontrada neste período.";
        
        const byCategory: Record<string, number> = {};
        expenses.forEach(t => { byCategory[t.category.name] = (byCategory[t.category.name] || 0) + t.amount; });
        const sorted: [string, number][] = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
        const total = expenses.reduce((s, t) => s + t.amount, 0);
        const topPct = (sorted[0][1] / total * 100);

        let response = `🏆 **Categoria com mais gastos (${String(mon).padStart(2, "0")}/${year}):**\n\n`;
        response += `**${sorted[0][0]}** — ${formatCurrency(sorted[0][1])} (${topPct.toFixed(0)}% do total)\n\n`;
        response += `**Ranking completo:**\n\`\`\`\n${asciiBarChart(sorted)}\n\`\`\``;
        return response + followUpSuggestions(["Gastos em " + sorted[0][0], "Como economizar?"]);
      }

      case "spending_forecast": {
        const month = params.month || currentMonth;
        const [year, mon] = month.split("-").map(Number);
        const startDate = new Date(year, mon - 1, 1);
        const endDate = new Date(year, mon, 0, 23, 59, 59);
        const daysInMonth = endDate.getDate();
        const now = new Date();
        const daysPassed = Math.min(now.getDate(), daysInMonth);

        const expenses = await prisma.transaction.findMany({
          where: { tenantId: tenant.tenantId, type: "expense", date: { gte: startDate, lte: endDate } },
        });
        const totalSoFar = expenses.reduce((s, t) => s + t.amount, 0);
        const dailyAvg = daysPassed > 0 ? totalSoFar / daysPassed : 0;
        const projected = dailyAvg * daysInMonth;
        const remaining = projected - totalSoFar;

        let response = `🔮 **Previsão de Gastos (${String(mon).padStart(2, "0")}/${year})**\n\n`;
        response += `- **Gasto até agora:** ${formatCurrency(totalSoFar)} (${daysPassed} dias)\n`;
        response += `- **Média diária:** ${formatCurrency(dailyAvg)}\n`;
        response += `- **Projeção para o mês:** ${formatCurrency(projected)}\n`;
        response += `- **Estimativa restante:** ${formatCurrency(remaining)} nos próximos ${daysInMonth - daysPassed} dias\n\n`;
        response += `${progressBar((daysPassed / daysInMonth) * 100)} do mês`;

        // Compare with budget
        const budgets = await prisma.budget.findMany({ where: { tenantId: tenant.tenantId, month } });
        if (budgets.length) {
          const totalBudget = budgets.reduce((s, b) => s + b.amount, 0);
          const budgetPct = (projected / totalBudget) * 100;
          response += `\n\n${statusEmoji(budgetPct)} Projeção vs orçamento total: ${progressBar(budgetPct)}`;
        }
        return response + followUpSuggestions(["Quanto posso gastar por dia?", "Status orçamento"]);
      }

      case "daily_budget": {
        const month = params.month || currentMonth;
        const [year, mon] = month.split("-").map(Number);
        const startDate = new Date(year, mon - 1, 1);
        const endDate = new Date(year, mon, 0, 23, 59, 59);
        const daysInMonth = endDate.getDate();
        const now = new Date();
        const daysRemaining = Math.max(daysInMonth - now.getDate(), 1);

        const budgets = await prisma.budget.findMany({ where: { tenantId: tenant.tenantId, month } });
        const totalBudget = budgets.reduce((s, b) => s + b.amount, 0);

        const expenses = await prisma.transaction.findMany({
          where: { tenantId: tenant.tenantId, type: "expense", date: { gte: startDate, lte: endDate } },
        });
        const totalSpent = expenses.reduce((s, t) => s + t.amount, 0);

        if (totalBudget > 0) {
          const remaining = totalBudget - totalSpent;
          const dailyBudget = remaining / daysRemaining;
          const icon = remaining > 0 ? "🟢" : "🔴";
          
          let response = `💰 **Orçamento Diário**\n\n`;
          response += `- **Orçamento total:** ${formatCurrency(totalBudget)}\n`;
          response += `- **Já gasto:** ${formatCurrency(totalSpent)}\n`;
          response += `- **Restante:** ${icon} ${formatCurrency(remaining)}\n`;
          response += `- **Dias restantes:** ${daysRemaining}\n\n`;
          response += `**→ Você pode gastar ${formatCurrency(Math.max(dailyBudget, 0))} por dia**`;
          response += `\n\n${progressBar((totalSpent / totalBudget) * 100)} do orçamento usado`;
          return response + followUpSuggestions(["Previsão do mês", "Status orçamento"]);
        } else {
          const dailyAvg = totalSpent / Math.max(now.getDate(), 1);
          return `💰 **Sem orçamento definido**\n\nSua média diária de gastos: ${formatCurrency(dailyAvg)}\nTotal gasto no mês: ${formatCurrency(totalSpent)}\n\n💡 _Defina um orçamento em Configurações para receber orientações personalizadas._` + followUpSuggestions(["Resumo do mês", "Como economizar?"]);
        }
      }

      case "average_monthly_spending": {
        const now = new Date();
        const months = 6;
        let totalSpending = 0;
        let monthCount = 0;
        const monthlyData: [string, number][] = [];

        for (let i = 0; i < months; i++) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const start = new Date(d.getFullYear(), d.getMonth(), 1);
          const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
          const expenses = await prisma.transaction.findMany({
            where: { tenantId: tenant.tenantId, type: "expense", date: { gte: start, lte: end } },
          });
          const monthTotal = expenses.reduce((s, t) => s + t.amount, 0);
          if (monthTotal > 0) {
            totalSpending += monthTotal;
            monthCount++;
          }
          const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
          monthlyData.push([monthNames[d.getMonth()], monthTotal]);
        }

        const average = monthCount > 0 ? totalSpending / monthCount : 0;
        let response = `📊 **Média de Gastos Mensais** (últimos ${months} meses)\n\n`;
        response += `**Média:** ${formatCurrency(average)}\n\n`;
        response += `**Por mês:**\n\`\`\`\n${asciiBarChart(monthlyData.reverse())}\n\`\`\``;
        return response + followUpSuggestions(["Comparar meses", "Previsão do mês"]);
      }

      case "export_transactions": {
        const month = params.month || currentMonth;
        const [year, mon] = month.split("-").map(Number);
        const startDate = new Date(year, mon - 1, 1);
        const endDate = new Date(year, mon, 0, 23, 59, 59);

        const transactions = await prisma.transaction.findMany({
          where: { tenantId: tenant.tenantId, date: { gte: startDate, lte: endDate } },
          include: { category: true, account: true },
          orderBy: { date: "asc" },
        });

        if (!transactions.length) return "📊 Nenhuma transação encontrada neste período.";

        let response = `📋 **Transações de ${String(mon).padStart(2, "0")}/${year}** (${transactions.length} registros)\n\n`;
        response += `| Data | Tipo | Descrição | Categoria | Valor |\n|------|------|-----------|-----------|-------|\n`;
        transactions.forEach(t => {
          const icon = t.type === "income" ? "📈" : "📉";
          response += `| ${formatDate(t.date)} | ${icon} | ${t.description} | ${t.category.name} | ${formatCurrency(t.amount)} |\n`;
        });

        const income = transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
        const expense = transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
        response += `\n**Receitas:** ${formatCurrency(income)} | **Despesas:** ${formatCurrency(expense)} | **Saldo:** ${formatCurrency(income - expense)}`;
        response += `\n\n_💡 Para exportar como arquivo, acesse a página de Transações._`;
        return response;
      }

      case "unknown":
        return "🤔 Não entendi o que você quer fazer. Tente:\n\n- **\"gastei R$50 em alimentação\"** — registrar despesa\n- **\"resumo do mês\"** — ver resumo mensal\n- **\"qual meu saldo?\"** — ver saldos\n- **\"ajuda\"** — ver todos os comandos" + followUpSuggestions(["Ajuda", "Resumo do mês", "Meu saldo"]);

      default:
        return "❌ Ação não implementada.";
    }
  } catch (err) {
    console.error("Chat action error:", err);
    return "❌ Ocorreu um erro ao processar sua solicitação. Tente novamente.";
  }
}
