"use client";
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageWrapper, AnimatedItem } from "@/components/page-wrapper";
import { Server, Copy, CheckCircle, Activity, Clock, Zap, BookOpen } from "lucide-react";
import { toast } from "sonner";

interface UsageData {
  totalCalls: number;
  recentLogs: { id: string; tool: string; responseTime: number; createdAt: string; apiKey: { name: string; keyPrefix: string } }[];
  toolBreakdown: { tool: string; count: number; avgResponseTime: number }[];
}

export default function McpSettingsPage() {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const endpoint = typeof window !== "undefined" ? `${window.location.origin}/api/mcp` : "/api/mcp";

  const fetchUsage = useCallback(() => {
    fetch("/api/mcp-usage").then((r) => r.json()).then(setUsage).catch(() => {});
  }, []);

  useEffect(() => { fetchUsage(); }, [fetchUsage]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado!");
  };

  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/mcp");
      const data = await res.json();
      if (data.name) {
        setTestResult("success");
        toast.success("Conexão MCP funcionando!");
      } else {
        setTestResult("error");
      }
    } catch {
      setTestResult("error");
      toast.error("Falha na conexão");
    }
    setTesting(false);
  };

  return (
    <PageWrapper>
      <AnimatedItem>
        <div className="flex items-center gap-3 mb-6">
          <Server className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">MCP Server</h1>
            <p className="text-muted-foreground">Conecte agentes de IA aos seus dados financeiros via Model Context Protocol</p>
          </div>
        </div>
      </AnimatedItem>

      <AnimatedItem>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Zap className="h-5 w-5" /> Endpoint MCP</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg font-mono text-sm">
              <span className="flex-1 truncate">{endpoint}</span>
              <Button variant="ghost" size="sm" onClick={() => copyToClipboard(endpoint)}><Copy className="h-4 w-4" /></Button>
            </div>
            <div className="flex gap-2">
              <Button onClick={testConnection} disabled={testing}>
                {testing ? "Testando..." : "Testar Conexão"}
              </Button>
              {testResult === "success" && <span className="flex items-center gap-1 text-green-600"><CheckCircle className="h-4 w-4" /> Funcionando</span>}
              {testResult === "error" && <span className="text-red-600">Falha na conexão</span>}
            </div>
          </CardContent>
        </Card>
      </AnimatedItem>

      <AnimatedItem>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5" /> Como Conectar</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 text-sm">
              <p><strong>1.</strong> Crie uma chave API em <a href="/settings/api-keys" className="text-primary underline">Configurações → Chaves API</a></p>
              <p><strong>2.</strong> Configure seu cliente MCP com:</p>
              <div className="p-3 bg-muted rounded-lg font-mono text-xs space-y-1">
                <p>{`{`}</p>
                <p>&nbsp;&nbsp;{`"mcpServers": {`}</p>
                <p>&nbsp;&nbsp;&nbsp;&nbsp;{`"ori-financeiro": {`}</p>
                <p>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{`"url": "${endpoint}",`}</p>
                <p>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{`"headers": { "Authorization": "Bearer ori_sua_chave_aqui" }`}</p>
                <p>&nbsp;&nbsp;&nbsp;&nbsp;{`}`}</p>
                <p>&nbsp;&nbsp;{`}`}</p>
                <p>{`}`}</p>
              </div>
              <p><strong>3.</strong> Ferramentas disponíveis: list_accounts, get_account, list_transactions, create_transaction, get_summary, list_categories, list_budgets, get_cashflow, list_goals, list_recurring, list_invoices, create_invoice, get_insights, search_transactions</p>
              <p><strong>Rate limit:</strong> 100 requisições por minuto por chave API</p>
            </div>
          </CardContent>
        </Card>
      </AnimatedItem>

      <AnimatedItem>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5" /> Estatísticas de Uso</CardTitle></CardHeader>
          <CardContent>
            {usage ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <div className="text-2xl font-bold">{usage.totalCalls}</div>
                    <div className="text-sm text-muted-foreground">Total de chamadas</div>
                  </div>
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <div className="text-2xl font-bold">{usage.toolBreakdown.length}</div>
                    <div className="text-sm text-muted-foreground">Ferramentas usadas</div>
                  </div>
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <div className="text-2xl font-bold">
                      {usage.toolBreakdown.length > 0 ? Math.round(usage.toolBreakdown.reduce((s, t) => s + t.avgResponseTime, 0) / usage.toolBreakdown.length) : 0}ms
                    </div>
                    <div className="text-sm text-muted-foreground">Tempo médio</div>
                  </div>
                </div>
                {usage.toolBreakdown.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Por Ferramenta</h4>
                    <div className="space-y-2">
                      {usage.toolBreakdown.map((t) => (
                        <div key={t.tool} className="flex justify-between items-center p-2 bg-muted/50 rounded">
                          <span className="font-mono text-sm">{t.tool}</span>
                          <span className="text-sm text-muted-foreground">{t.count}x · {t.avgResponseTime}ms avg</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {usage.recentLogs.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Chamadas Recentes</h4>
                    <div className="space-y-1 max-h-64 overflow-y-auto">
                      {usage.recentLogs.slice(0, 20).map((log) => (
                        <div key={log.id} className="flex justify-between items-center text-sm p-2 bg-muted/30 rounded">
                          <span className="font-mono">{log.tool}</span>
                          <div className="flex items-center gap-3 text-muted-foreground">
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{log.responseTime}ms</span>
                            <span>{new Date(log.createdAt).toLocaleString("pt-BR")}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">Carregando...</p>
            )}
          </CardContent>
        </Card>
      </AnimatedItem>
    </PageWrapper>
  );
}
