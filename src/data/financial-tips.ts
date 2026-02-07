export interface FinancialTip {
  id: string;
  topic: string;
  title: string;
  content: string;
  icon: string;
}

export const TOPICS = [
  { id: "economizar", label: "Economizar", icon: "💰" },
  { id: "investir", label: "Investir", icon: "📈" },
  { id: "dividas", label: "Dívidas", icon: "💳" },
  { id: "orcamento", label: "Orçamento", icon: "📊" },
  { id: "impostos", label: "Impostos", icon: "🏛️" },
  { id: "aposentadoria", label: "Aposentadoria", icon: "🏖️" },
];

export const FINANCIAL_TIPS: FinancialTip[] = [
  { id: "1", topic: "economizar", title: "Regra dos 30 dias", content: "Antes de fazer uma compra não essencial, espere 30 dias. Se ainda quiser o item após esse período, considere comprá-lo. Muitas vezes o desejo passa.", icon: "⏰" },
  { id: "2", topic: "economizar", title: "Automação de poupança", content: "Configure transferências automáticas para sua poupança no dia do pagamento. O que você não vê, não gasta.", icon: "🤖" },
  { id: "3", topic: "economizar", title: "Desafio do troco", content: "Arredonde cada compra para cima e guarde a diferença. Com o tempo, acumula um valor considerável.", icon: "🪙" },
  { id: "4", topic: "economizar", title: "Lista de compras", content: "Sempre vá ao supermercado com uma lista pronta e evite ir com fome. Isso pode reduzir gastos em até 25%.", icon: "📝" },
  { id: "5", topic: "economizar", title: "Revise assinaturas", content: "Revise mensalmente seus serviços por assinatura. Cancele o que não usa. O acúmulo pode chegar a centenas de reais por mês.", icon: "🔍" },
  { id: "6", topic: "investir", title: "Comece cedo", content: "Quanto antes você começar a investir, mais o juros compostos trabalham a seu favor. R$200/mês por 30 anos a 10% ao ano vira mais de R$450.000.", icon: "🌱" },
  { id: "7", topic: "investir", title: "Diversifique", content: "Não coloque todos os ovos na mesma cesta. Distribua seus investimentos entre renda fixa, ações, FIIs e outros ativos.", icon: "🧺" },
  { id: "8", topic: "investir", title: "Reserva de emergência primeiro", content: "Antes de investir em renda variável, tenha pelo menos 6 meses de despesas em investimentos de alta liquidez.", icon: "🛡️" },
  { id: "9", topic: "investir", title: "Tesouro Direto", content: "O Tesouro Direto é acessível a partir de R$30 e é garantido pelo governo federal. Ideal para começar a investir.", icon: "🏛️" },
  { id: "10", topic: "investir", title: "Conheça seu perfil", content: "Descubra se você é conservador, moderado ou arrojado. Investir fora do seu perfil pode causar ansiedade e decisões ruins.", icon: "🎯" },
  { id: "11", topic: "dividas", title: "Bola de neve", content: "Pague o mínimo de todas as dívidas e concentre o extra na menor. Quando quitá-la, use o valor para a próxima. Isso gera motivação.", icon: "⛷️" },
  { id: "12", topic: "dividas", title: "Negocie taxas", content: "Ligue para o banco e negocie taxas de juros. Muitas vezes consegue-se reduções significativas apenas pedindo.", icon: "📞" },
  { id: "13", topic: "dividas", title: "Evite o rotativo", content: "O rotativo do cartão de crédito tem juros de 400%+ ao ano. Sempre pague o valor total da fatura.", icon: "🚫" },
  { id: "14", topic: "dividas", title: "Portabilidade de crédito", content: "Compare taxas entre bancos. A portabilidade de crédito permite transferir sua dívida para um banco com juros menores.", icon: "🔄" },
  { id: "15", topic: "dividas", title: "Feirão Limpa Nome", content: "Fique atento aos feirões de renegociação de dívidas que acontecem periodicamente. Descontos podem chegar a 90%.", icon: "🏷️" },
  { id: "16", topic: "orcamento", title: "Regra 50/30/20", content: "Destine 50% da renda para necessidades, 30% para desejos e 20% para poupança e investimentos.", icon: "📐" },
  { id: "17", topic: "orcamento", title: "Envelope digital", content: "Separe seu dinheiro em categorias (envelopes). Quando acabar o valor de uma categoria, pare de gastar nela.", icon: "✉️" },
  { id: "18", topic: "orcamento", title: "Revise semanalmente", content: "Dedique 15 minutos por semana para revisar seus gastos. Pequenos ajustes frequentes são mais eficazes que grandes mudanças esporádicas.", icon: "📅" },
  { id: "19", topic: "orcamento", title: "Fundo para imprevistos", content: "Reserve 5% do orçamento para gastos inesperados. Isso evita que imprevistos destruam seu planejamento.", icon: "🆘" },
  { id: "20", topic: "orcamento", title: "Zero-based budgeting", content: "Planeje cada real da sua renda. Dê uma função para todo o dinheiro que entra: contas, lazer, investimentos, etc.", icon: "🎯" },
  { id: "21", topic: "impostos", title: "Declare corretamente", content: "Mantenha todos os comprovantes organizados durante o ano. Declarar corretamente evita cair na malha fina.", icon: "📋" },
  { id: "22", topic: "impostos", title: "Deduções médicas", content: "Gastos com saúde (médicos, dentistas, psicólogos) são dedutíveis sem limite no IRPF. Guarde todos os recibos.", icon: "🏥" },
  { id: "23", topic: "impostos", title: "PGBL para dedução", content: "Investimentos em PGBL podem ser deduzidos em até 12% da renda bruta no Imposto de Renda.", icon: "💡" },
  { id: "24", topic: "impostos", title: "Educação", content: "Gastos com educação formal (escola, faculdade) são dedutíveis, porém com limite anual definido pela Receita.", icon: "🎓" },
  { id: "25", topic: "impostos", title: "Dependentes", content: "Incluir dependentes na declaração pode reduzir o imposto devido, mas avalie se compensa individualmente.", icon: "👨‍👩‍👧" },
  { id: "26", topic: "aposentadoria", title: "INSS não basta", content: "O teto do INSS é limitado. Complemente sua aposentadoria com previdência privada e investimentos próprios.", icon: "⚠️" },
  { id: "27", topic: "aposentadoria", title: "Regra dos 4%", content: "Para viver de renda, acumule 25x suas despesas anuais. Retirar 4% ao ano é considerado sustentável.", icon: "📊" },
  { id: "28", topic: "aposentadoria", title: "Tempo é aliado", content: "Começar a poupar para aposentadoria aos 25 ao invés de 35 pode resultar em o dobro do patrimônio final.", icon: "⏳" },
  { id: "29", topic: "aposentadoria", title: "FIIs para renda passiva", content: "Fundos Imobiliários distribuem rendimentos mensais isentos de IR para pessoa física. Boa opção para renda passiva.", icon: "🏢" },
  { id: "30", topic: "aposentadoria", title: "Revisite o plano", content: "A cada 5 anos, reavalie seu plano de aposentadoria. Mudanças de renda, família e objetivos exigem ajustes.", icon: "🔄" },
];

export function getDailyTip(): FinancialTip {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  return FINANCIAL_TIPS[dayOfYear % FINANCIAL_TIPS.length];
}

export function getContextualTips(context: { highSpending?: boolean; hasDebt?: boolean; noBudget?: boolean }): FinancialTip[] {
  const tips: FinancialTip[] = [];
  if (context.highSpending) tips.push(...FINANCIAL_TIPS.filter(t => t.topic === "economizar").slice(0, 2));
  if (context.hasDebt) tips.push(...FINANCIAL_TIPS.filter(t => t.topic === "dividas").slice(0, 2));
  if (context.noBudget) tips.push(...FINANCIAL_TIPS.filter(t => t.topic === "orcamento").slice(0, 2));
  return tips.length > 0 ? tips : [getDailyTip()];
}
