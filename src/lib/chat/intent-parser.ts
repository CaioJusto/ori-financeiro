export type IntentAction =
  | "create_expense"
  | "create_income"
  | "create_transfer"
  | "create_installment"
  | "create_scheduled"
  | "query_expenses"
  | "query_expenses_by_category"
  | "query_expenses_by_amount"
  | "delete_last_transaction"
  | "query_balance"
  | "monthly_summary"
  | "budget_status"
  | "goal_progress"
  | "upcoming_bills"
  | "monthly_report"
  | "create_account"
  | "list_accounts"
  | "financial_tip"
  | "savings_suggestions"
  | "spending_analysis"
  | "period_comparison"
  | "top_spending_category"
  | "spending_forecast"
  | "daily_budget"
  | "average_monthly_spending"
  | "export_transactions"
  | "greeting"
  | "help"
  | "unknown";

export interface ParsedIntent {
  action: IntentAction;
  params: {
    amount?: number;
    description?: string;
    category?: string;
    accountName?: string;
    accountFrom?: string;
    accountTo?: string;
    date?: string;
    month?: string;
    month2?: string;
    goalName?: string;
    installments?: number;
    minAmount?: number;
  };
  confidence: number;
  raw: string;
}

const MONTH_MAP: Record<string, string> = {
  janeiro: "01", fevereiro: "02", março: "03", marco: "03",
  abril: "04", maio: "05", junho: "06", julho: "07",
  agosto: "08", setembro: "09", outubro: "10", novembro: "11", dezembro: "12",
};

const WORD_NUMBERS: Record<string, number> = {
  um: 1, uma: 1, dois: 2, duas: 2, três: 3, tres: 3, quatro: 4, cinco: 5,
  seis: 6, sete: 7, oito: 8, nove: 9, dez: 10, vinte: 20, trinta: 30,
  quarenta: 40, cinquenta: 50, sessenta: 60, setenta: 70, oitenta: 80,
  noventa: 90, cem: 100, cento: 100, duzentos: 200, trezentos: 300,
  quatrocentos: 400, quinhentos: 500, mil: 1000,
};

function parseAmount(text: string): number | undefined {
  const patterns = [
    /R\$\s*([\d.,]+)/i,
    /([\d.,]+)\s*reais/i,
    /de\s+([\d.,]+)/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) {
      const val = m[1].replace(/\./g, "").replace(",", ".");
      const num = parseFloat(val);
      if (!isNaN(num)) return num;
    }
  }
  for (const [word, val] of Object.entries(WORD_NUMBERS)) {
    if (text.toLowerCase().includes(word + " reais") || text.toLowerCase().includes(word + " real")) {
      return val;
    }
  }
  return undefined;
}

function parseDate(text: string): string | undefined {
  const lower = text.toLowerCase();
  const now = new Date();
  if (lower.includes("hoje")) return now.toISOString().split("T")[0];
  if (lower.includes("ontem")) {
    const d = new Date(now); d.setDate(d.getDate() - 1);
    return d.toISOString().split("T")[0];
  }
  const dayMatch = lower.match(/dia\s+(\d{1,2})/);
  if (dayMatch) {
    const d = new Date(now.getFullYear(), now.getMonth(), parseInt(dayMatch[1]));
    return d.toISOString().split("T")[0];
  }
  return undefined;
}

function parseMonth(text: string): string | undefined {
  const lower = text.toLowerCase();
  if (lower.includes("esse mês") || lower.includes("este mês") || lower.includes("mês atual")) {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }
  if (lower.includes("mês passado") || lower.includes("último mês")) {
    const now = new Date();
    now.setMonth(now.getMonth() - 1);
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }
  for (const [name, num] of Object.entries(MONTH_MAP)) {
    if (lower.includes(name)) {
      const year = new Date().getFullYear();
      return `${year}-${num}`;
    }
  }
  return undefined;
}

function parseComparisonMonths(text: string): { month1?: string; month2?: string } {
  const lower = text.toLowerCase();
  const months: string[] = [];
  for (const [name, num] of Object.entries(MONTH_MAP)) {
    if (lower.includes(name)) {
      months.push(`${new Date().getFullYear()}-${num}`);
    }
  }
  if (months.length >= 2) return { month1: months[0], month2: months[1] };
  return {};
}

function extractCategory(text: string): string | undefined {
  const m = text.match(/(?:em|de|na|no|para|categoria)\s+([a-záàâãéèêíóôõúç\s]+?)(?:\s+(?:hoje|ontem|dia|no|na|do|da|acima|abaixo|$))/i);
  if (m) return m[1].trim();
  return undefined;
}

function extractAccountName(text: string): string | undefined {
  const m = text.match(/conta\s+([a-záàâãéèêíóôõúç\w\s]+?)(?:\s|$)/i);
  if (m) return m[1].trim();
  return undefined;
}

function extractTransferAccounts(text: string): { from?: string; to?: string } {
  const m = text.match(/(?:da|de)\s+([a-záàâãéèêíóôõúç\w]+)\s+(?:para|pra)\s+([a-záàâãéèêíóôõúç\w]+)/i);
  if (m) return { from: m[1].trim(), to: m[2].trim() };
  return {};
}

function extractGoalName(text: string): string | undefined {
  const m = text.match(/meta\s+(.+?)(?:\?|$)/i);
  if (m) return m[1].trim();
  return undefined;
}

function extractInstallments(text: string): number | undefined {
  const m = text.match(/(\d+)\s*(?:x|vezes|parcelas?)/i);
  if (m) return parseInt(m[1]);
  const m2 = text.match(/em\s+(\d+)\s*(?:x|vezes|parcelas?)/i);
  if (m2) return parseInt(m2[1]);
  return undefined;
}

function extractMinAmount(text: string): number | undefined {
  const m = text.match(/acima\s+de\s+R?\$?\s*([\d.,]+)/i);
  if (m) {
    const val = m[1].replace(/\./g, "").replace(",", ".");
    return parseFloat(val);
  }
  return undefined;
}

export function parseIntent(text: string): ParsedIntent {
  const lower = text.toLowerCase().trim();
  const amount = parseAmount(text);
  const date = parseDate(text) || new Date().toISOString().split("T")[0];
  const month = parseMonth(text);
  const category = extractCategory(text);

  // Greeting
  if (/^(oi|olá|ola|hey|hello|bom dia|boa tarde|boa noite|e ai|eai)\b/i.test(lower)) {
    return { action: "greeting", params: {}, confidence: 0.9, raw: text };
  }

  // Help
  if (/^(ajuda|help|o que você faz|comandos|como funciona)/i.test(lower)) {
    return { action: "help", params: {}, confidence: 0.9, raw: text };
  }

  // Installment
  if (/parcel(ar|ado|amento)|em\s+\d+\s*x/i.test(lower)) {
    const installments = extractInstallments(text);
    const desc = text.replace(/^.*?(parcel(ar|ado|amento))\s*/i, "").trim();
    return { action: "create_installment", params: { amount, installments, category, description: desc || undefined, date }, confidence: 0.85, raw: text };
  }

  // Scheduled payment
  if (/agendar|agendamento|recorrente|todo\s+m(ê|e)s|mensal(mente)?/i.test(lower) && amount) {
    return { action: "create_scheduled", params: { amount, description: text, date }, confidence: 0.8, raw: text };
  }

  // Period comparison
  if (/comparar|compara(ção|cao)|vs\.?|versus/i.test(lower)) {
    const { month1, month2 } = parseComparisonMonths(text);
    return { action: "period_comparison", params: { month: month1, month2 }, confidence: 0.85, raw: text };
  }

  // Top spending category
  if (/qual\s+categoria\s+mais\s+gast|onde\s+mais\s+gast|maior\s+gasto/i.test(lower)) {
    return { action: "top_spending_category", params: { month: month || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}` }, confidence: 0.85, raw: text };
  }

  // Spending forecast
  if (/previs(ão|ao)|forecast|projeção|projecao|estimativa.*gasto/i.test(lower)) {
    return { action: "spending_forecast", params: { month: month || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}` }, confidence: 0.85, raw: text };
  }

  // Daily budget
  if (/quanto\s+posso\s+gastar|gastar\s+por\s+dia|budget\s+di(á|a)rio/i.test(lower)) {
    return { action: "daily_budget", params: { month: month || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}` }, confidence: 0.85, raw: text };
  }

  // Filter by amount
  if (/acima\s+de|maior\s+que|transaç(ões|oes)\s+acima/i.test(lower)) {
    const minAmount = extractMinAmount(text);
    return { action: "query_expenses_by_amount", params: { minAmount, month: month || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}` }, confidence: 0.85, raw: text };
  }

  // Average monthly spending
  if (/m(é|e)dia\s+de\s+gastos|gasto\s+m(é|e)dio|m(é|e)dia\s+mensal/i.test(lower)) {
    return { action: "average_monthly_spending", params: {}, confidence: 0.85, raw: text };
  }

  // Export transactions
  if (/exportar\s+transaç|export\s+/i.test(lower)) {
    return { action: "export_transactions", params: { month: month || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}` }, confidence: 0.8, raw: text };
  }

  // Transfer
  if (/transferir|transferência|transferencia/i.test(lower)) {
    const { from, to } = extractTransferAccounts(text);
    return { action: "create_transfer", params: { amount, accountFrom: from, accountTo: to, date }, confidence: 0.85, raw: text };
  }

  // Create expense
  if (/gast(ei|o|ar)|pagu(ei|ar)|compre(i|ar)|adicionar gasto|despesa|pagamento/i.test(lower)) {
    const desc = text.replace(/^.*?(gast(ei|o|ar)|pagu(ei|ar)|compre(i|ar)|adicionar gasto|despesa)\s*/i, "").trim();
    return { action: "create_expense", params: { amount, category, description: desc || undefined, date }, confidence: 0.85, raw: text };
  }

  // Create income
  if (/receb(i|er|ido)|salário|salario|renda|receita|ganhei|entrada/i.test(lower)) {
    const desc = text.replace(/^.*?(receb(i|er|ido)|salário|salario|ganhei)\s*/i, "").trim();
    return { action: "create_income", params: { amount, description: desc || undefined, date }, confidence: 0.85, raw: text };
  }

  // Delete last transaction
  if (/delet(ar|e)|remov(er|a)|exclu(ir|a).*?(última|ultimo|recente|transação)/i.test(lower)) {
    return { action: "delete_last_transaction", params: {}, confidence: 0.8, raw: text };
  }

  // Query expenses by category
  if (/gast(os?|ei).*?(em|de|na|no)\s/i.test(lower) && category) {
    return { action: "query_expenses_by_category", params: { category, month: month || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}` }, confidence: 0.8, raw: text };
  }

  // Query expenses
  if (/quanto\s+gast(ei|amos|ou)|meus gastos|gastos/i.test(lower)) {
    return { action: "query_expenses", params: { month: month || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}` }, confidence: 0.85, raw: text };
  }

  // Balance
  if (/saldo|balanço|balanco|quanto tenho/i.test(lower)) {
    return { action: "query_balance", params: {}, confidence: 0.9, raw: text };
  }

  // Monthly summary
  if (/resumo\s*(do\s+)?m(ê|e)s|resumo\s+mensal/i.test(lower)) {
    return { action: "monthly_summary", params: { month: month || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}` }, confidence: 0.9, raw: text };
  }

  // Budget status
  if (/orçamento|orcamento|budget/i.test(lower)) {
    return { action: "budget_status", params: { month: month || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}` }, confidence: 0.85, raw: text };
  }

  // Goal progress
  if (/meta|objetivo.*?(falta|progress|quanto)/i.test(lower)) {
    return { action: "goal_progress", params: { goalName: extractGoalName(text) }, confidence: 0.8, raw: text };
  }

  // Upcoming bills
  if (/contas?\s*(a\s+)?(pagar|venc|próxim|proxim)|venc(e|em)\s*(essa|esta|próxima|proxima)\s*semana/i.test(lower)) {
    return { action: "upcoming_bills", params: {}, confidence: 0.85, raw: text };
  }

  // Monthly report
  if (/relat(ó|o)rio/i.test(lower)) {
    return { action: "monthly_report", params: { month: month || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}` }, confidence: 0.85, raw: text };
  }

  // Create account
  if (/criar\s+conta|nova\s+conta|adicionar\s+conta/i.test(lower)) {
    return { action: "create_account", params: { accountName: extractAccountName(text) }, confidence: 0.85, raw: text };
  }

  // List accounts
  if (/listar\s*(minhas\s+)?contas|minhas\s+contas/i.test(lower)) {
    return { action: "list_accounts", params: {}, confidence: 0.9, raw: text };
  }

  // Financial tip
  if (/dica\s+financeira|dica\s+de\s+finanças|me\s+dá\s+uma\s+dica/i.test(lower)) {
    return { action: "financial_tip", params: {}, confidence: 0.9, raw: text };
  }

  // Savings suggestions
  if (/como\s+economizar|reduzir\s+gastos|economizar/i.test(lower)) {
    return { action: "savings_suggestions", params: {}, confidence: 0.85, raw: text };
  }

  // Spending analysis
  if (/an(á|a)lise.*gasto|analisar.*gasto|insights|análise financeira/i.test(lower)) {
    return { action: "spending_analysis", params: { month: month || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}` }, confidence: 0.85, raw: text };
  }

  return { action: "unknown", params: {}, confidence: 0, raw: text };
}
