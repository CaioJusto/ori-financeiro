"use client";
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageWrapper, AnimatedItem } from "@/components/page-wrapper";
import { Landmark, RefreshCw, Plug, Trash2, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface BankConnection {
  id: string; bankName: string; bankLogo: string; status: string; lastSync: string | null; accountId: string | null;
}
interface Bank { name: string; logo: string; }
interface Account { id: string; name: string; }

export default function BankConnectionsPage() {
  const [connections, setConnections] = useState<BankConnection[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedBank, setSelectedBank] = useState("");
  const [selectedAccount, setSelectedAccount] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);

  const load = useCallback(() => {
    fetch("/api/bank-connections").then((r) => r.json()).then((d) => { setConnections(d.connections); setBanks(d.availableBanks); });
    fetch("/api/accounts").then((r) => r.json()).then(setAccounts).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);

  const connect = async () => {
    if (!selectedBank) return;
    setConnecting(true);
    try {
      const res = await fetch("/api/bank-connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bankName: selectedBank, accountId: selectedAccount || null }),
      });
      if (res.ok) { toast.success("Banco conectado!"); load(); setSelectedBank(""); setSelectedAccount(""); }
      else toast.error("Erro ao conectar");
    } catch { toast.error("Erro ao conectar"); }
    setConnecting(false);
  };

  const sync = async (id: string) => {
    setSyncing(id);
    try {
      await fetch("/api/bank-connections/sync", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      toast.success("Sincronizado!");
      load();
    } catch { toast.error("Erro ao sincronizar"); }
    setSyncing(null);
  };

  const disconnect = async (id: string) => {
    await fetch("/api/bank-connections", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    toast.success("Desconectado");
    load();
  };

  const statusIcon = (s: string) => {
    if (s === "CONNECTED") return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (s === "ERROR") return <AlertCircle className="h-4 w-4 text-red-500" />;
    return <AlertCircle className="h-4 w-4 text-yellow-500" />;
  };

  return (
    <PageWrapper>
      <AnimatedItem>
        <div className="flex items-center gap-3 mb-6">
          <Landmark className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Conexões Bancárias</h1>
            <p className="text-muted-foreground">Conecte suas contas bancárias para importar transações automaticamente</p>
          </div>
        </div>
      </AnimatedItem>

      <AnimatedItem>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Plug className="h-5 w-5" /> Conectar Banco</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select value={selectedBank} onValueChange={setSelectedBank}>
                <SelectTrigger><SelectValue placeholder="Selecione o banco" /></SelectTrigger>
                <SelectContent>
                  {banks.filter((b) => !connections.find((c) => c.bankName === b.name)).map((b) => (
                    <SelectItem key={b.name} value={b.name}>{b.logo} {b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                <SelectTrigger><SelectValue placeholder="Vincular a conta (opcional)" /></SelectTrigger>
                <SelectContent>
                  {accounts.map((a) => (<SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>))}
                </SelectContent>
              </Select>
              <Button onClick={connect} disabled={!selectedBank || connecting}>
                {connecting ? "Conectando..." : "Conectar"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </AnimatedItem>

      <AnimatedItem>
        <Card>
          <CardHeader><CardTitle>Conexões Ativas</CardTitle></CardHeader>
          <CardContent>
            {connections.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Nenhuma conexão bancária configurada</p>
            ) : (
              <div className="space-y-3">
                {connections.map((c) => (
                  <div key={c.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{c.bankLogo}</span>
                      <div>
                        <div className="font-medium flex items-center gap-2">{c.bankName} {statusIcon(c.status)}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {c.lastSync ? `Última sincronização: ${new Date(c.lastSync).toLocaleString("pt-BR")}` : "Nunca sincronizado"}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => sync(c.id)} disabled={syncing === c.id}>
                        <RefreshCw className={`h-4 w-4 mr-1 ${syncing === c.id ? "animate-spin" : ""}`} /> Sincronizar
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => disconnect(c.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
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
