// Mock data for Open Finance integration

export const MOCK_INSTITUTIONS = [
  { id: "nubank", name: "Nubank", logo: "💜", type: "digital_bank", color: "#8B11E3" },
  { id: "itau", name: "Itaú Unibanco", logo: "🟠", type: "bank", color: "#EC7000" },
  { id: "bradesco", name: "Bradesco", logo: "🔴", type: "bank", color: "#CC092F" },
  { id: "bb", name: "Banco do Brasil", logo: "🟡", type: "bank", color: "#FFCC29" },
  { id: "inter", name: "Banco Inter", logo: "🟧", type: "digital_bank", color: "#FF7A00" },
  { id: "c6", name: "C6 Bank", logo: "⬛", type: "digital_bank", color: "#1A1A1A" },
  { id: "santander", name: "Santander", logo: "🔴", type: "bank", color: "#EC0000" },
  { id: "caixa", name: "Caixa Econômica", logo: "🟦", type: "bank", color: "#005CA9" },
  { id: "btg", name: "BTG Pactual", logo: "🟦", type: "investment", color: "#002D72" },
  { id: "xp", name: "XP Investimentos", logo: "⬛", type: "investment", color: "#1D1D1D" },
  { id: "picpay", name: "PicPay", logo: "💚", type: "digital_wallet", color: "#21C25E" },
  { id: "mercadopago", name: "Mercado Pago", logo: "💙", type: "digital_wallet", color: "#009EE3" },
];

const EXPENSE_DESCRIPTIONS: Record<string, string[]> = {
  nubank: ["iFood", "Uber", "Netflix", "Spotify", "Rappi", "Amazon", "Magalu", "Americanas"],
  itau: ["Supermercado Pão de Açúcar", "Farmácia Drogasil", "Posto Shell", "Restaurante Outback"],
  bradesco: ["Energia Enel", "Água Sabesp", "IPTU", "Condomínio", "Seguro Auto"],
  bb: ["Salário", "Transferência PIX", "Boleto", "TED recebida"],
  inter: ["Cashback Inter Shop", "Débito automático", "PIX QR Code"],
  c6: ["C6 Tag Pedágio", "Tim Celular", "Claro Internet"],
  santander: ["Parcela financiamento", "Seguro vida", "Previdência"],
  caixa: ["FGTS", "Boleto habitação", "Loteria"],
  btg: ["Resgate CDB", "Dividendos", "Juros sobre capital"],
  xp: ["Resgate Fundo", "Proventos FII", "Dividendos ações"],
  picpay: ["Transferência PicPay", "Pagamento QR Code", "Recarga celular"],
  mercadopago: ["Mercado Livre compra", "Pagamento QR", "Transferência MP"],
};

export function generateMockTransactions(institutionId: string, count: number = 10) {
  const descriptions = EXPENSE_DESCRIPTIONS[institutionId] || EXPENSE_DESCRIPTIONS.nubank;
  const transactions = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const isIncome = Math.random() > 0.7;
    const date = new Date(now);
    date.setDate(date.getDate() - Math.floor(Math.random() * 30));

    transactions.push({
      description: descriptions[Math.floor(Math.random() * descriptions.length)],
      amount: isIncome
        ? Math.round((500 + Math.random() * 5000) * 100) / 100
        : Math.round((10 + Math.random() * 500) * 100) / 100,
      type: isIncome ? "income" : "expense",
      date: date.toISOString(),
      externalId: `ext_${institutionId}_${Date.now()}_${i}`,
    });
  }

  return transactions;
}
