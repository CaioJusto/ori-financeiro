"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/utils";
import { Receipt, Repeat, Target, Calendar } from "lucide-react";

interface WidgetsData {
  upcomingPayables: { id: string; description: string; amount: number; dueDate: string; paid: boolean }[];
  overdueCount: number;
  recurringWithStatus: { id: string; description: string; amount: number; type: string; processed: boolean; dayOfMonth: number }[];
  goalsProgress: { id: string; name: string; targetAmount: number; currentAmount: number; progress: number; deadline: string | null }[];
  calendarDots: { date: string; count: number }[];
}

function MiniCalendar({ dots }: { dots: { date: string; count: number }[] }) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = now.getDate();

  const dotDays = new Set(dots.map((d) => new Date(d.date).getDate()));
  const weekDays = ["D", "S", "T", "Q", "Q", "S", "S"];

  return (
    <div>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {weekDays.map((d, i) => (
          <div key={i} className="text-[10px] text-muted-foreground text-center font-medium">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => (
          <div key={day} className={`relative text-center text-[11px] rounded-md py-0.5 ${day === today ? "bg-primary text-primary-foreground font-bold" : "text-muted-foreground"}`}>
            {day}
            {dotDays.has(day) && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardWidgets() {
  const [data, setData] = useState<WidgetsData | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/widgets").then((r) => r.json()).then(setData).catch(() => {});
  }, []);

  if (!data) return null;

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {/* Upcoming Payables */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Receipt className="h-4 w-4 text-amber-500" />
            Próximas Contas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.upcomingPayables.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nenhuma conta pendente</p>
          ) : (
            <div className="space-y-2">
              {data.upcomingPayables.map((p) => {
                const isOverdue = new Date(p.dueDate) < new Date();
                return (
                  <div key={p.id} className="flex justify-between items-center text-xs">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{p.description}</p>
                      <p className={`text-[10px] ${isOverdue ? "text-red-500" : "text-muted-foreground"}`}>
                        {isOverdue ? "Vencida" : new Date(p.dueDate).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <span className="font-semibold shrink-0 ml-2">{formatCurrency(p.amount)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recurring */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Repeat className="h-4 w-4 text-blue-500" />
            Recorrências do Mês
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.recurringWithStatus.length === 0 ? (
            <p className="text-xs text-muted-foreground">Sem recorrências ativas</p>
          ) : (
            <div className="space-y-2">
              {data.recurringWithStatus.slice(0, 5).map((r) => (
                <div key={r.id} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${r.processed ? "bg-emerald-500" : "bg-muted-foreground"}`} />
                    <span className="truncate">{r.description}</span>
                  </div>
                  <Badge variant={r.processed ? "success" : "secondary"} className="text-[10px] shrink-0 ml-1">
                    {r.processed ? "✓" : `Dia ${r.dayOfMonth}`}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Goals */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Target className="h-4 w-4 text-emerald-500" />
            Metas em Progresso
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.goalsProgress.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nenhuma meta criada</p>
          ) : (
            <div className="space-y-3">
              {data.goalsProgress.map((g) => (
                <div key={g.id}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium truncate">{g.name}</span>
                    <span className="text-muted-foreground shrink-0">{g.progress.toFixed(0)}%</span>
                  </div>
                  <Progress value={g.progress} className="h-1.5" />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mini Calendar */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4 text-violet-500" />
            {new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <MiniCalendar dots={data.calendarDots} />
        </CardContent>
      </Card>
    </div>
  );
}
