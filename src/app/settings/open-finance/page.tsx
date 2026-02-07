"use client";
import { useEffect, useState } from "react";
import { PageWrapper } from "@/components/page-wrapper";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Building2, Link, RefreshCw, Settings, Shield, Search, Clock, CheckCircle2, AlertCircle, XCircle } from "lucide-react";

interface Provider { id: string; provider: string; clientId: string; active: boolean; connections: Connection[] }
interface Connection { id: string; institutionName: string; institutionLogo: string; status: string; lastSync: string | null; consentId: string | null }
interface Institution { id: string; name: string; logo: string; type: string; color: string }

const statusIcons: Record<string, React.ReactNode> = {
  CONNECTED: <CheckCircle2 className="h-4 w-4 text-green-500" />,
  PENDING: <Clock className="h-4 w-4 text-yellow-500" />,
  ERROR: <AlertCircle className="h-4 w-4 text-red-500" />,
  EXPIRED: <XCircle className="h-4 w-4 text-gray-500" />,
};

export default function OpenFinancePage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [search, setSearch] = useState("");
  const [pluggyId, setPluggyId] = useState("");
  const [pluggySecret, setPluggySecret] = useState("");
  const [belvoId, setBelvoId] = useState("");
  const [belvoSecret, setBelvoSecret] = useState("");
  const [syncing, setSyncing] = useState<string | null>(null);
  const [autoSync, setAutoSync] = useState(false);

  useEffect(() => { load(); loadInstitutions(""); }, []);

  const load = () => fetch("/api/open-finance/providers").then(r => r.json()).then(setProviders).catch(() => {});
  const loadInstitutions = (q: string) => fetch(`/api/open-finance/institutions?search=${q}`).then(r => r.json()).then(setInstitutions).catch(() => {});

  useEffect(() => { loadInstitutions(search); }, [search]);

  const saveProvider = async (provider: string, clientId: string, clientSecret: string) => {
    const res = await fetch("/api/open-finance/providers", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider, clientId, clientSecret }),
    });
    if (res.ok) { toast.success(`${provider} configurado!`); load(); }
    else toast.error("Erro ao salvar provider");
  };

  const connect = async (providerId: string, institutionId: string) => {
    const res = await fetch("/api/open-finance/connect", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ providerId, institutionId }),
    });
    if (res.ok) { toast.success("Conexão estabelecida!"); load(); }
    else toast.error("Erro ao conectar");
  };

  const sync = async (connectionId: string) => {
    setSyncing(connectionId);
    const res = await fetch("/api/open-finance/sync", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ connectionId }),
    });
    if (res.ok) {
      const data = await res.json();
      toast.success(`${data.imported} transações sincronizadas!`);
      load();
    } else toast.error("Erro ao sincronizar");
    setSyncing(null);
  };

  const allConnections = providers.flatMap(p => p.connections.map(c => ({ ...c, providerName: p.provider })));

  return (
    <PageWrapper>
      <Tabs defaultValue="connections">
        <TabsList>
          <TabsTrigger value="connections"><Link className="h-4 w-4 mr-1" />Conexões</TabsTrigger>
          <TabsTrigger value="institutions"><Building2 className="h-4 w-4 mr-1" />Bancos</TabsTrigger>
          <TabsTrigger value="providers"><Settings className="h-4 w-4 mr-1" />Providers</TabsTrigger>
          <TabsTrigger value="consent"><Shield className="h-4 w-4 mr-1" />Consentimento</TabsTrigger>
        </TabsList>

        <TabsContent value="connections" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Conexões Ativas</h3>
              <p className="text-sm text-muted-foreground">Gerencie suas conexões bancárias</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Auto-sync diário</span>
              <Switch checked={autoSync} onCheckedChange={setAutoSync} />
            </div>
          </div>

          {allConnections.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Nenhuma conexão ainda. Configure um provider e conecte um banco.</p>
            </CardContent></Card>
          ) : (
            <div className="grid gap-3">
              {allConnections.map(c => (
                <Card key={c.id}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{c.institutionLogo}</span>
                      <div>
                        <p className="font-medium">{c.institutionName}</p>
                        <p className="text-xs text-muted-foreground">
                          {c.providerName} · Última sync: {c.lastSync ? new Date(c.lastSync).toLocaleString("pt-BR") : "Nunca"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={c.status === "CONNECTED" ? "default" : "secondary"} className="flex items-center gap-1">
                        {statusIcons[c.status]} {c.status}
                      </Badge>
                      <Button size="sm" variant="outline" onClick={() => sync(c.id)} disabled={syncing === c.id}>
                        <RefreshCw className={`h-3 w-3 mr-1 ${syncing === c.id ? "animate-spin" : ""}`} />
                        Sync
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="institutions" className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar bancos..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {institutions.map(inst => (
              <Card key={inst.id} className="cursor-pointer hover:border-primary transition-colors">
                <CardContent className="p-4 text-center">
                  <span className="text-3xl block mb-2">{inst.logo}</span>
                  <p className="font-medium text-sm">{inst.name}</p>
                  <Badge variant="secondary" className="mt-1 text-xs">{inst.type}</Badge>
                  {providers.length > 0 && (
                    <Button size="sm" className="mt-3 w-full" onClick={() => connect(providers[0].id, inst.id)}>
                      Conectar
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="providers" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Pluggy.ai</CardTitle>
                <CardDescription>
                  Open Finance API para o Brasil. Obtenha suas chaves em{" "}
                  <a href="https://pluggy.ai" target="_blank" rel="noopener" className="text-primary underline">pluggy.ai</a>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input placeholder="Client ID" value={pluggyId} onChange={e => setPluggyId(e.target.value)} />
                <Input placeholder="Client Secret" type="password" value={pluggySecret} onChange={e => setPluggySecret(e.target.value)} />
                <Button onClick={() => saveProvider("PLUGGY", pluggyId, pluggySecret)} className="w-full">
                  Salvar Pluggy
                </Button>
                <p className="text-xs text-muted-foreground">
                  💡 No modo demo, as conexões são simuladas. Configure chaves reais para dados reais.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Belvo</CardTitle>
                <CardDescription>
                  Plataforma de dados financeiros. Obtenha chaves em{" "}
                  <a href="https://belvo.com" target="_blank" rel="noopener" className="text-primary underline">belvo.com</a>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input placeholder="Secret Key ID" value={belvoId} onChange={e => setBelvoId(e.target.value)} />
                <Input placeholder="Secret Key Password" type="password" value={belvoSecret} onChange={e => setBelvoSecret(e.target.value)} />
                <Button onClick={() => saveProvider("BELVO", belvoId, belvoSecret)} className="w-full">
                  Salvar Belvo
                </Button>
                <p className="text-xs text-muted-foreground">
                  💡 Belvo suporta bancos de toda América Latina. Sandbox disponível para testes.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="consent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciamento de Consentimento</CardTitle>
              <CardDescription>Controle quais dados são compartilhados com cada conexão</CardDescription>
            </CardHeader>
            <CardContent>
              {allConnections.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhuma conexão para gerenciar.</p>
              ) : (
                <div className="space-y-3">
                  {allConnections.map(c => (
                    <div key={c.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <span>{c.institutionLogo}</span>
                        <div>
                          <p className="text-sm font-medium">{c.institutionName}</p>
                          <p className="text-xs text-muted-foreground">Consentimento: {c.consentId || "N/A"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">Saldo ✓</Badge>
                        <Badge variant="outline" className="text-xs">Transações ✓</Badge>
                        <Button size="sm" variant="destructive">Revogar</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageWrapper>
  );
}
