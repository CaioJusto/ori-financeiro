import { ptBR } from "./pt-BR";
import { enUS } from "./en-US";
import { esES } from "./es-ES";

export type Locale = "pt-BR" | "en-US" | "es-ES";

export const locales: Record<Locale, Record<string, string>> = {
  "pt-BR": ptBR,
  "en-US": enUS,
  "es-ES": esES,
};

export const localeNames: Record<Locale, string> = {
  "pt-BR": "Português (Brasil)",
  "en-US": "English (US)",
  "es-ES": "Español",
};

export function t(key: string, locale: Locale = "pt-BR"): string {
  return locales[locale]?.[key] || locales["pt-BR"]?.[key] || key;
}

export function formatCurrency(value: number, locale: Locale = "pt-BR"): string {
  const currencyMap: Record<Locale, string> = { "pt-BR": "BRL", "en-US": "USD", "es-ES": "EUR" };
  return new Intl.NumberFormat(locale, { style: "currency", currency: currencyMap[locale] }).format(value);
}

export function formatDate(date: Date | string, locale: Locale = "pt-BR"): string {
  return new Intl.DateTimeFormat(locale, { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(date));
}

export function formatNumber(value: number, locale: Locale = "pt-BR"): string {
  return new Intl.NumberFormat(locale).format(value);
}
