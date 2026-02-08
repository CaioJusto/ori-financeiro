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

export async function executeIntent(intent: ParsedIntent, tenant: TenantSession): Promise<string> {
  const { action, params } = intent;

  try {
    switch (action) {
      case "greeting":
        return "👋 Olá! Sou seu assistente financeiro. Como posso ajudar?\n\nPosso criar transações, consultar saldos, mostrar relatórios e muito mais. Digite **ajuda** para ver os comandos disponíveis.";

      case "help":
        return `🤖 **Comandos disponíveis:**\n\n**💸 Transações:**\n- "gastei R$50 em alimentação"\n- "recebi R$3000 de salário"\n- "transferir R$500 da pessoal para empresarial"\n- "deletar última transação"\n\n**📊 Consultas:**\n- "qual meu saldo?"\n- "resumo do mês"\n- "quanto gastei esse mês?"\n- "gastos em alimentação"\n\n**🎯 Gestão:**\n- "como estão meus orçamentos?"\n- "quanto falta pra minha meta?"\n- "contas a vencer essa semana"\n- "listar minhas contas"\n- "criar conta Nubank"\n\n**💡 Dicas:**\n- "dica financeira"\n- "como economizar?"\n- "análise dos meus gastos"`;

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
        return `✅ **Despesa registrada!**\n\n- **Valor:** ${formatCurrency(tx.amount)}\n- **Categoria:** ${tx.category.name}\n- **Conta:** ${tx.account.name}\n- **Data:** ${formatDate(tx.date)}`;
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
        return `✅ **Receita registrada!**\n\n- **Valor:** ${formatCurrency(tx.amount)}\n- **Categoria:** ${tx.category.name}\n- **Conta:** ${tx.account.name}\n- **Data:** ${formatDate(tx.date)}`;
      }

      case "create_transfer": {
        if (!params.amount) return "❌ Não entendi o valor da transferência.";
        const allAccounts = await prisma.account.findMany({ where: { tenantId: tenant.tenantId } });
        if (allAccounts.length < 2) return "❌ Você precisa de pelo menos 2 contas para transferir.";

        let fromAcc = params.accountFrom ? allAccounts.find(a => a.name.toLowerCase().includes(params.accountFrom!.toLowerCase())) : allAccounts[0];
        let toAcc = params.accountTo ? allAccounts.find(a => a.name.toLowerCase().includes(params.accountTo!.toLowerCase())) : allAccounts[1];
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
        return `✅ **Transferência realizada!**\n\n- **Valor:** ${formatCurrency(params.amount)}\n- **De:** ${fromAcc.name}\n- **Para:** ${toAcc.name}`;
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
        const month = params.month || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
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
        const byCategory: Record<string, number> = {};
        expenses.forEach(t => { byCategory[t.category.name] = (byCategory[t.category.name] || 0) + t.amount; });
        
        let response = `📊 **Gastos de ${String(mon).padStart(2, "0")}/${year}**\n\n**Total:** ${formatCurrency(total)}\n\n**Por categoria:**\n`;
        Object.entries(byCategory).sort((a, b) => b[1] - a[1]).forEach(([cat, val]) => {
          const pct = ((val / total) * 100).toFixed(1);
          response += `- ${cat}: ${formatCurrency(val)} (${pct}%)\n`;
        });
        return response;
      }

      case "query_expenses_by_category": {
        const month = params.month || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
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
        return response;
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
          response += `- **${a.name}:** ${formatCurrency(balance)}\n`;
        });
        response += `\n**💰 Total:** ${formatCurrency(totalBalance)}`;
        return response;
      }

      case "monthly_summary": {
        const month = params.month || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
        const [year, mon] = month.split("-").map(Number);
        const startDate = new Date(year, mon - 1, 1);
        const endDate = new Date(year, mon, 0, 23, 59, 59);

        const transactions = await prisma.transaction.findMany({
          where: { tenantId: tenant.tenantId, date: { gte: startDate, lte: endDate } },
        });

        const income = transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
        const expense = transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
        const balance = income - expense;

        return `📋 **Resumo de ${String(mon).padStart(2, "0")}/${year}**\n\n- 📈 **Receitas:** ${formatCurrency(income)}\n- 📉 **Despesas:** ${formatCurrency(expense)}\n- ${balance >= 0 ? "✅" : "⚠️"} **Saldo:** ${formatCurrency(balance)}\n- 📊 **Transações:** ${transactions.length}`;
      }

      case "budget_status": {
        const month = params.month || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
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
          const pct = ((used / b.amount) * 100).toFixed(0);
          const icon = used > b.amount ? "🔴" : parseInt(pct) > 80 ? "🟡" : "🟢";
          response += `${icon} **${b.category.name}:** ${formatCurrency(used)} / ${formatCurrency(b.amount)} (${pct}%)\n`;
        }
        return response;
      }

      case "goal_progress": {
        const where: Record<string, unknown> = { tenantId: tenant.tenantId };
        if (params.goalName) where.name = { contains: params.goalName, mode: "insensitive" };
        const goals = await prisma.savingsGoal.findMany({ where });
        if (!goals.length) return "🎯 Nenhuma meta encontrada.";

        let response = "🎯 **Progresso das Metas:**\n\n";
        goals.forEach(g => {
          const pct = ((g.currentAmount / g.targetAmount) * 100).toFixed(0);
          const remaining = g.targetAmount - g.currentAmount;
          response += `- **${g.name}:** ${formatCurrency(g.currentAmount)} / ${formatCurrency(g.targetAmount)} (${pct}%)\n  Faltam ${formatCurrency(remaining)}${g.deadline ? ` até ${formatDate(g.deadline)}` : ""}\n`;
        });
        return response;
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
        payables.forEach(p => {
          response += `- ${formatDate(p.dueDate)} | **${p.description}** | ${formatCurrency(p.amount)}\n`;
        });
        return response;
      }

      case "monthly_report": {
        const month = params.month || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
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
          response += `**Top Despesas por Categoria:**\n`;
          Object.entries(byCategory).sort((a, b) => b[1] - a[1]).slice(0, 5).forEach(([cat, val]) => {
            response += `- ${cat}: ${formatCurrency(val)}\n`;
          });
        }
        return response;
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
        return `💡 **${tip.title}**\n\n${tip.content}`;
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
          response += `Suas maiores categorias de gasto são:\n`;
          sorted.slice(0, 3).forEach(([cat, val]) => {
            response += `- **${cat}:** ${formatCurrency(val)}\n`;
          });
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
        const month = params.month || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
        const [year, mon] = month.split("-").map(Number);
        const startDate = new Date(year, mon - 1, 1);
        const endDate = new Date(year, mon, 0, 23, 59, 59);

        // Current month
        const expenses = await prisma.transaction.findMany({
          where: { tenantId: tenant.tenantId, type: "expense", date: { gte: startDate, lte: endDate } },
          include: { category: true },
        });
        const totalExpense = expenses.reduce((s, t) => s + t.amount, 0);

        // Previous month
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
          const change = ((totalExpense - prevTotal) / prevTotal * 100).toFixed(1);
          response += `**Variação vs mês anterior:** ${parseFloat(change) > 0 ? "📈 +" : "📉 "}${change}%\n`;
        }
        response += `\n**Distribuição por categoria:**\n`;
        Object.entries(byCategory).sort((a, b) => b[1] - a[1]).forEach(([cat, val]) => {
          const pct = totalExpense > 0 ? ((val / totalExpense) * 100).toFixed(0) : "0";
          const bar = "█".repeat(Math.round(parseInt(pct) / 5)) + "░".repeat(20 - Math.round(parseInt(pct) / 5));
          response += `${cat}: ${bar} ${pct}% (${formatCurrency(val)})\n`;
        });
        return response;
      }

      case "unknown":
        return "🤔 Não entendi o que você quer fazer. Tente:\n\n- **\"gastei R$50 em alimentação\"** — registrar despesa\n- **\"resumo do mês\"** — ver resumo mensal\n- **\"qual meu saldo?\"** — ver saldos\n- **\"ajuda\"** — ver todos os comandos";

      default:
        return "❌ Ação não implementada.";
    }
  } catch (err) {
    console.error("Chat action error:", err);
    return "❌ Ocorreu um erro ao processar sua solicitação. Tente novamente.";
  }
}
