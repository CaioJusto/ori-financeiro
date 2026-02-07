"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PageWrapper, AnimatedItem } from "@/components/page-wrapper";
import { CheckCircle, Calendar, LayoutGrid } from "lucide-react";
import { toast } from "sonner";

interface Payable {
  id: string; description: string; amount: number; type: string; dueDate: string;
  paid: boolean; paidDate: string | null; contactName: string | null;
}

type ViewMode = "kanban" | "calendar";

export default function BillsPage() {
  const [payables, setPayables] = useState<Payable[]>([]);
  const [view, setView] = useState<ViewMode>("kanban");
  const [dragId, setDragId] = useState<string | null>(null);

  const load = () => { fetch("/api/payables").then(r => r.json()).then(setPayables); };
  useEffect(() => { load(); }, []);

  const now = new Date(); now.setHours(0, 0, 0, 0);
  const sevenDays = new Date(now.getTime() + 7 * 86400000);

  const columns = {
    overdue: { title: "Vencidas", color: "border-red-500", bg: "bg-red-500/10", items: payables.filter(p => !p.paid && new Date(p.dueDate) < now) },
    dueSoon: { title: "Vence em 7 dias", color: "border-yellow-500", bg: "bg-yellow-500/10", items: payables.filter(p => !p.paid && new Date(p.dueDate) >= now && new Date(p.dueDate) <= sevenDays) },
    pending: { title: "Pendentes", color: "border-blue-500", bg: "bg-blue-500/10", items: payables.filter(p => !p.paid && new Date(p.dueDate) > sevenDays) },
    paid: { title: "Pagas", color: "border-green-500", bg: "bg-green-500/10", items: payables.filter(p => p.paid) },
  };

  const markPaid = async (id: string) => {
    await fetch(`/api/payables/${id}/pay`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
    load(); toast.success("Marcada como paga");
  };

  const handleDragStart = (id: string) => { setDragId(id); };
  const handleDrop = (column: string) => {
    if (dragId && column === "paid") { markPaid(dragId); }
    setDragId(null);
  };

  // Calendar view - group by date
  const calendarDays: Record<string, Payable[]> = {};
  payables.filter(p => !p.paid).forEach(p => {
    const key = p.dueDate.slice(0, 10);
    if (!calendarDays[key]) calendarDays[key] = [];
    calendarDays[key].push(p);
  });
  const sortedDays = Object.entries(calendarDays).sort(([a], [b]) => a.localeCompare(b));

  const urgencyColor = (p: Payable) => {
    if (p.paid) return "text-green-500";
    const due = new Date(p.dueDate);
    if (due < now) return "text-red-500";
    if (due <= sevenDays) return "text-yellow-500";
    return "text-blue-500";
  };

  return (
    <PageWrapper>
      <AnimatedItem>
        <div className="flex gap-3 mb-6">
          <Button variant={view === "kanban" ? "default" : "outline"} onClick={() => setView("kanban")}><LayoutGrid className="w-4 h-4 mr-2" />Kanban</Button>
          <Button variant={view === "calendar" ? "default" : "outline"} onClick={() => setView("calendar")}><Calendar className="w-4 h-4 mr-2" />Calendário</Button>
        </div>
      </AnimatedItem>

      {view === "kanban" ? (
        <AnimatedItem>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Object.entries(columns).map(([key, col]) => (
              <div key={key} className={`rounded-lg border-t-4 ${col.color} ${col.bg} p-3 min-h-[300px]`}
                onDragOver={e => e.preventDefault()}
                onDrop={() => handleDrop(key)}>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-sm">{col.title}</h3>
                  <Badge variant="outline">{col.items.length}</Badge>
                </div>
                <div className="space-y-2">
                  {col.items.map(p => (
                    <Card key={p.id} draggable onDragStart={() => handleDragStart(p.id)}
                      className="cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow">
                      <CardContent className="p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-sm">{p.description}</p>
                            {p.contactName && <p className="text-xs text-muted-foreground">{p.contactName}</p>}
                          </div>
                          <span className={`font-semibold text-sm ${urgencyColor(p)}`}>{formatCurrency(p.amount)}</span>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-xs text-muted-foreground">{formatDate(p.dueDate)}</span>
                          {!p.paid && key !== "paid" && (
                            <Button variant="ghost" size="sm" onClick={() => markPaid(p.id)} className="h-6 px-2">
                              <CheckCircle className="w-3 h-3 mr-1" />Pagar
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {col.items.length === 0 && <p className="text-center text-xs text-muted-foreground py-4">Nenhuma conta</p>}
                </div>
              </div>
            ))}
          </div>
        </AnimatedItem>
      ) : (
        <AnimatedItem>
          <div className="space-y-4">
            {sortedDays.length > 0 ? sortedDays.map(([date, items]) => (
              <Card key={date}>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Calendar className="w-4 h-4" />{formatDate(date)}
                    <Badge variant="outline">{items.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    {items.map(p => (
                      <div key={p.id} className="flex justify-between items-center">
                        <div>
                          <span className="font-medium">{p.description}</span>
                          {p.contactName && <span className="text-sm text-muted-foreground ml-2">{p.contactName}</span>}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`font-semibold ${urgencyColor(p)}`}>{formatCurrency(p.amount)}</span>
                          <Button variant="ghost" size="sm" onClick={() => markPaid(p.id)}><CheckCircle className="w-4 h-4" /></Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )) : <p className="text-center text-muted-foreground py-8">Nenhuma conta pendente</p>}
          </div>
        </AnimatedItem>
      )}
    </PageWrapper>
  );
}
