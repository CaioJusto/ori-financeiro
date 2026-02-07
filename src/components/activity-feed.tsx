"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity } from "lucide-react";

interface ActivityItem {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  changes: Record<string, unknown>;
  createdAt: string;
}

function getIcon(entity: string): string {
  switch (entity) {
    case "transaction": return "💰";
    case "transfer": return "🔄";
    case "goal": case "savingsGoal": return "🎯";
    case "budget": return "📊";
    case "account": return "🏦";
    case "category": return "🏷️";
    case "payable": return "📄";
    case "recurring": return "🔁";
    case "contact": return "👤";
    default: return "📝";
  }
}

function getActionLabel(action: string, entity: string): string {
  const entityLabels: Record<string, string> = {
    transaction: "transação", transfer: "transferência", goal: "meta", savingsGoal: "meta",
    budget: "orçamento", account: "conta", category: "categoria", payable: "conta a pagar",
    recurring: "recorrência", contact: "contato", tag: "tag", rule: "regra",
  };
  const actionLabels: Record<string, string> = { create: "criou", update: "atualizou", delete: "excluiu" };
  return `${actionLabels[action] || action} ${entityLabels[entity] || entity}`;
}

function relativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "agora";
  if (minutes < 60) return `há ${minutes} min`;
  if (hours < 24) return `há ${hours}h`;
  if (days === 1) return "ontem";
  if (days < 7) return `há ${days} dias`;
  return new Date(dateStr).toLocaleDateString("pt-BR");
}

export function ActivityFeed({ limit = 10 }: { limit?: number }) {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/activity?limit=${limit}`)
      .then((r) => r.json())
      .then((d) => { setItems(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [limit]);

  if (loading) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-sm font-medium flex items-center gap-2"><Activity className="h-4 w-4" />Atividade Recente</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse flex gap-3">
                <div className="w-8 h-8 rounded-full bg-muted" />
                <div className="flex-1 space-y-1">
                  <div className="h-3 bg-muted rounded w-3/4" />
                  <div className="h-2 bg-muted rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (items.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Atividade Recente
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {items.map((item) => {
            const description = item.changes?.description || item.changes?.name || "";
            return (
              <div key={item.id} className="flex items-start gap-3 p-2 rounded-md hover:bg-muted/30 transition-colors">
                <span className="text-lg mt-0.5 shrink-0">{getIcon(item.entity)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-medium capitalize">{getActionLabel(item.action, item.entity)}</span>
                    {description && <span className="text-muted-foreground"> — {String(description)}</span>}
                  </p>
                  <p className="text-[11px] text-muted-foreground">{relativeTime(item.createdAt)}</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
