import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, currency: string = "BRL"): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(value);
}

export function currencySymbol(currency: string): string {
  const symbols: Record<string, string> = { BRL: "R$", USD: "$", EUR: "€" };
  return symbols[currency] || currency;
}

// Fixed exchange rates (to BRL)
export const exchangeRates: Record<string, number> = { BRL: 1, USD: 5.0, EUR: 5.5 };

export function convertToBRL(value: number, currency: string): number {
  return value * (exchangeRates[currency] || 1);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("pt-BR").format(new Date(date));
}
