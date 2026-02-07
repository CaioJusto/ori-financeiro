import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";

export async function GET(req: NextRequest) {
  const { error, tenant } = await requirePermission("transactions:read");
  if (error) return error;

  const days = parseInt(req.nextUrl.searchParams.get("days") || "90");
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get recurring transactions
  const recurrings = await prisma.recurring.findMany({
    where: { tenantId: tenant.tenantId, active: true },
    include: { category: true, account: true },
  });

  // Get actual transactions for the period
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 30);
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + days);

  const transactions = await prisma.transaction.findMany({
    where: {
      tenantId: tenant.tenantId,
      date: { gte: startDate, lte: endDate },
    },
    include: { category: true },
    orderBy: { date: "asc" },
  });

  // Get current total balance (computed from transactions + transfers)
  const accounts = await prisma.account.findMany({
    where: { tenantId: tenant.tenantId },
    include: { transactions: true, transfersFrom: true, transfersTo: true },
  });
  const currentBalance = accounts.reduce((sum, a) => {
    const income = a.transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expense = a.transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    const xferIn = a.transfersTo.reduce((s, t) => s + t.amount, 0);
    const xferOut = a.transfersFrom.reduce((s, t) => s + t.amount, 0);
    return sum + income - expense + xferIn - xferOut;
  }, 0);

  // Build daily forecast
  const forecast: {
    date: string;
    income: number;
    expense: number;
    balance: number;
    items: { description: string; amount: number; type: string; category: string; isProjected: boolean }[];
  }[] = [];

  let runningBalance = currentBalance;

  for (let d = 0; d < days; d++) {
    const date = new Date(today);
    date.setDate(date.getDate() + d);
    const dateStr = date.toISOString().split("T")[0];
    const dayOfMonth = date.getDate();

    let dayIncome = 0;
    let dayExpense = 0;
    const items: { description: string; amount: number; type: string; category: string; isProjected: boolean }[] = [];

    // Actual transactions for this date
    const actualTxs = transactions.filter(
      (t) => t.date.toISOString().split("T")[0] === dateStr
    );
    for (const tx of actualTxs) {
      if (tx.type === "income") dayIncome += tx.amount;
      else dayExpense += tx.amount;
      items.push({
        description: tx.description,
        amount: tx.amount,
        type: tx.type,
        category: tx.category.name,
        isProjected: false,
      });
    }

    // Projected recurring for future dates
    if (date > today) {
      for (const rec of recurrings) {
        let matches = false;
        if (rec.frequency === "monthly" && rec.dayOfMonth === dayOfMonth) matches = true;
        if (rec.frequency === "weekly" && date.getDay() === (rec.dayOfMonth % 7)) matches = true;
        if (rec.frequency === "daily") matches = true;

        if (matches) {
          if (rec.type === "income") dayIncome += rec.amount;
          else dayExpense += rec.amount;
          items.push({
            description: rec.description,
            amount: rec.amount,
            type: rec.type,
            category: rec.category.name,
            isProjected: true,
          });
        }
      }
    }

    runningBalance += dayIncome - dayExpense;

    forecast.push({
      date: dateStr,
      income: dayIncome,
      expense: dayExpense,
      balance: runningBalance,
      items,
    });
  }

  // Summary
  const totalProjectedIncome = forecast.reduce((s, f) => s + f.income, 0);
  const totalProjectedExpense = forecast.reduce((s, f) => s + f.expense, 0);
  const lowestBalance = Math.min(...forecast.map((f) => f.balance));
  const highestBalance = Math.max(...forecast.map((f) => f.balance));

  return NextResponse.json({
    forecast,
    summary: {
      currentBalance,
      projectedIncome: totalProjectedIncome,
      projectedExpense: totalProjectedExpense,
      projectedBalance: runningBalance,
      lowestBalance,
      highestBalance,
      days,
    },
  });
}
