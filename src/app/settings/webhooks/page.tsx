"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PageWrapper, AnimatedItem } from "@/components/page-wrapper";
import { toast } from "sonner";
import { Webhook, Plus, Trash2 } from "lucide-react";

interface WebhookData {
  id: string; url: string; events: string[]; secret: string;
  active: boolean; lastTriggered: string | null; createdAt: string;
}

const AVAILABLE_EVENTS = [
  "transaction.created", "transaction.updated", "transaction.deleted", "invoice.paid",
];

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<WebhookData[]>([]);
  const [url, setUrl] = useState("");
  const [events, setEvents] = useState<string[]>(["transaction.created"]);

  const load = () => fetch("/api/webhooks").then(r => r.json()).then(setWebhooks);
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!url) return;
    await fetch("/api/webhooks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, events }),
    });
    toast.success("Webhook criado");
    setUrl("");
    load();
  };

  const remove = async (id: string) => {
    await fetch("/api/webhooks", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    toast.success("Webhook removido");
    load();
  };

  const toggleEvent = (e: string) => {
    setEvents(prev => prev.includes(e) ? prev.filter(x => x !== e) : [...prev, e]);
  };

  return (
    <PageWrapper>
      <AnimatedItem>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Webhook className="h-6 w-6" /> Webhooks
          </h1>
          <p className="text-sm text-muted-foreground">Receba notificações em tempo real sobre eventos</p>
        </div>
      </AnimatedItem>
      <AnimatedItem><Separator /></AnimatedItem>

      <AnimatedItem>
        <Card>
          <CardHeader><CardTitle className="text-sm">Novo Webhook</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div><Label>URL</Label><Input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://example.com/webhook" /></div>
            <div>
              <Label>Eventos</Label>
              <div className="flex gap-2 flex-wrap mt-1">
                {AVAILABLE_EVENTS.map(e => (
                  <Badge key={e} variant={events.includes(e) ? "default" : "outline"} className="cursor-pointer" onClick={() => toggleEvent(e)}>
                    {e}
                  </Badge>
                ))}
              </div>
            </div>
            <Button onClick={create}><Plus className="h-4 w-4 mr-1" /> Criar</Button>
          </CardContent>
        </Card>
      </AnimatedItem>

      <AnimatedItem>
        <Card>
          <CardHeader><CardTitle className="text-sm">Webhooks Configurados</CardTitle></CardHeader>
          <CardContent>
            {webhooks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum webhook configurado</p>
            ) : (
              <div className="space-y-2">
                {webhooks.map(wh => (
                  <div key={wh.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="text-sm font-medium font-mono">{wh.url}</p>
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {(wh.events as string[]).map(e => <Badge key={e} variant="secondary" className="text-xs">{e}</Badge>)}
                      </div>
                      {wh.lastTriggered && <p className="text-xs text-muted-foreground mt-1">Último disparo: {new Date(wh.lastTriggered).toLocaleString("pt-BR")}</p>}
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => remove(wh.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </AnimatedItem>
    </PageWrapper>
  );
}
