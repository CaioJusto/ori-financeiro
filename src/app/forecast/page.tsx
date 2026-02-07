"use client";
import { useEffect, useState } from "react";
import { PageWrapper } from "@/components/page-wrapper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Target, Brain, BarChart3 } from "lucide-react";

interface ForecastData {
  historical: { months: string[]; income: number[]; expense: number[] };
  forecast: {
    nextMonth: { income: number; expense: number; savings: number; confidenceLow: number; confidenceHigh: number };
    incomeTrend: string; expenseTrend: string;
  };
  categoryForecasts: Record<string, { history: number[]; forecast: number; trend: string }>;
  anomalies: { month: string; category: string; amount: number; average: number; deviation: number }[];
  accuracy: number;
}

const trendIcon = (t: string) => t === "up" ? <TrendingUp className="h-4 w-4 text-green-500" /> : t === "down" ? <TrendingDown className="h-4 w-4 text-red-500" /> : <Minus className="h-4 w-4 text-gray-500" />;

export default function ForecastPage() {
  const [data, setData] = useState<ForecastData | null>(null);

  useEffect(() => {
    fetch("/api/forecast").then(r => r.json()).then(setData).catch(() => {});
  }, []);

  if (!data) return <PageWrapper><div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" /></div></PageWrapper>;

  const f = data.forecast.nextMonth;

  return (
    <PageWrapper>
      <div className="grid gap-4">
        {/* Accuracy & Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-4 text-center">
              <Brain className="h-5 w-5 mx-auto mb-1 text-primary" />
              <p className="text-2xl font-bold">{data.accuracy}%</p>
              <p className="text-xs text-muted-foreground">Precisão</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">{trendIcon(data.forecast.incomeTrend)}<span className="text-xs">Receita</span></div>
              <p className="text-lg font-bold text-green-600">{formatCurrency(f.income)}</p>
              <p className="text-xs text-muted-foreground">Previsão próx. mês</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">{trendIcon(data.forecast.expenseTrend)}<span className="text-xs">Despesa</span></div>
              <p className="text-lg font-bold text-red-600">{formatCurrency(f.expense)}</p>
              <p className="text-xs text-muted-foreground">{formatCurrency(f.confidenceLow)} – {formatCurrency(f.confidenceHigh)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Target className="h-5 w-5 mx-auto mb-1 text-primary" />
              <p className={`text-lg font-bold ${f.savings >= 0 ? "text-green-600" : "text-red-600"}`}>{formatCurrency(f.savings)}</p>
              <p className="text-xs text-muted-foreground">Economia prevista</p>
            </CardContent>
          </Card>
        </div>

        {/* Historical Chart (text-based) */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" /> Histórico vs Previsão</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.historical.months.map((month, i) => {
                const inc = data.historical.income[i] || 0;
                const exp = data.historical.expense[i] || 0;
                const maxVal = Math.max(...data.historical.income, ...data.historical.expense) || 1;
                return (
                  <div key={month} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-16">{month}</span>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="h-2 bg-green-500 rounded-full" style={{ width: `${(inc / maxVal) * 100}%` }} />
                        <span className="text-xs">{formatCurrency(inc)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-2 bg-red-500 rounded-full" style={{ width: `${(exp / maxVal) * 100}%` }} />
                        <span className="text-xs">{formatCurrency(exp)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {/* Forecast row */}
              <div className="flex items-center gap-3 border-t pt-2 border-dashed">
                <span className="text-xs font-medium w-16">Previsão</span>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="h-2 bg-green-500/50 rounded-full border border-green-500 border-dashed" style={{ width: `${(f.income / (Math.max(...data.historical.income, ...data.historical.expense) || 1)) * 100}%` }} />
                    <span className="text-xs">{formatCurrency(f.income)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 bg-red-500/50 rounded-full border border-red-500 border-dashed" style={{ width: `${(f.expense / (Math.max(...data.historical.income, ...data.historical.expense) || 1)) * 100}%` }} />
                    <span className="text-xs">{formatCurrency(f.expense)}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Category Forecasts */}
        <Card>
          <CardHeader><CardTitle>Previsão por Categoria</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(data.categoryForecasts).sort((a, b) => b[1].forecast - a[1].forecast).map(([cat, info]) => (
                <div key={cat} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{cat}</span>
                    {trendIcon(info.trend)}
                  </div>
                  <p className="text-lg font-bold mt-1">{formatCurrency(info.forecast)}</p>
                  <p className="text-xs text-muted-foreground">Previsão próx. mês</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Anomalies */}
        {data.anomalies.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-yellow-500" /> Anomalias Detectadas</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.anomalies.map((a, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">{a.category}</p>
                      <p className="text-xs text-muted-foreground">Mês: {a.month}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{formatCurrency(a.amount)}</p>
                      <Badge variant={a.deviation > 0 ? "destructive" : "default"} className="text-xs">
                        {a.deviation > 0 ? "+" : ""}{a.deviation}% vs média ({formatCurrency(a.average)})
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PageWrapper>
  );
}
