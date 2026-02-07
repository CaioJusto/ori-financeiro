"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageWrapper, AnimatedItem } from "@/components/page-wrapper";
import { Bell, Check, CheckCheck, Trash2, Info, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  link: string | null;
  createdAt: string;
}

const typeIcons: Record<string, typeof Info> = { info: Info, warning: AlertTriangle, success: CheckCircle, error: XCircle };
const typeColors: Record<string, string> = { info: "text-blue-500", warning: "text-yellow-500", success: "text-green-500", error: "text-red-500" };

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState("all");

  const load = () => {
    const params = new URLSearchParams();
    if (filter === "read") params.set("read", "true");
    if (filter === "unread") params.set("read", "false");
    if (["info", "warning", "success", "error"].includes(filter)) params.set("type", filter);
    fetch(`/api/notifications?${params}`).then(r => r.json()).then(setNotifications);
  };

  useEffect(() => { document.title = "Notificações | Ori Financeiro"; load(); }, [filter]); // eslint-disable-line react-hooks/exhaustive-deps

  const markRead = async (id: string) => {
    await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
    load();
  };

  const markAllRead = async () => {
    await fetch("/api/notifications/mark-all-read", { method: "POST" });
    load();
  };

  const deleteNotification = async (id: string) => {
    await fetch(`/api/notifications?id=${id}`, { method: "DELETE" });
    load();
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <PageWrapper>
      <AnimatedItem>
        <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2"><Bell className="h-6 w-6" /> Notificações</h1>
            <p className="text-sm text-muted-foreground">{unreadCount} não lida{unreadCount !== 1 ? "s" : ""}</p>
          </div>
          <div className="flex gap-2">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="unread">Não lidas</SelectItem>
                <SelectItem value="read">Lidas</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="warning">Alerta</SelectItem>
                <SelectItem value="success">Sucesso</SelectItem>
                <SelectItem value="error">Erro</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={markAllRead}><CheckCheck className="h-4 w-4 mr-1" /> Marcar todas lidas</Button>
          </div>
        </div>
      </AnimatedItem>

      <div className="space-y-3">
        {notifications.length === 0 && (
          <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhuma notificação</CardContent></Card>
        )}
        {notifications.map(n => {
          const Icon = typeIcons[n.type] || Info;
          return (
            <AnimatedItem key={n.id}>
              <Card className={`transition-colors ${!n.read ? "border-primary/30 bg-primary/5" : ""}`}>
                <CardContent className="py-4 flex items-start gap-3">
                  <Icon className={`h-5 w-5 mt-0.5 ${typeColors[n.type] || "text-muted-foreground"}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{n.title}</span>
                      {!n.read && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Nova</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">{n.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{new Date(n.createdAt).toLocaleString("pt-BR")}</p>
                  </div>
                  <div className="flex gap-1">
                    {!n.read && (
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => markRead(n.id)}>
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => deleteNotification(n.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </AnimatedItem>
          );
        })}
      </div>
    </PageWrapper>
  );
}
