"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageWrapper, AnimatedItem } from "@/components/page-wrapper";
import { History, Search, Download, ChevronLeft, ChevronRight } from "lucide-react";

interface AuditEntry {
  id: string; action: string; entity: string; entityId: string;
  changes: string; before: string; after: string;
  userId: string | null; userName: string | null; ipAddress: string | null;
  createdAt: string;
}

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [entityFilter, setEntityFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");

  const load = () => {
    const params = new URLSearchParams({ page: String(page), limit: "30" });
    if (search) params.set("search", search);
    if (entityFilter !== "all") params.set("entity", entityFilter);
    if (actionFilter !== "all") params.set("action", actionFilter);
    fetch(`/api/audit?${params}`).then(r => r.json()).then(d => {
      setLogs(d.logs || []);
      setTotal(d.total || 0);
      setTotalPages(d.totalPages || 1);
    });
  };

  useEffect(() => { load(); }, [page, entityFilter, actionFilter]); // eslint-disable-line

  const exportCsv = () => {
    const params = new URLSearchParams({ format: "csv" });
    if (search) params.set("search", search);
    if (entityFilter !== "all") params.set("entity", entityFilter);
    window.open(`/api/audit?${params}`, "_blank");
  };

  const actionColor = (a: string) => {
    if (a === "CREATE") return "bg-emerald-500/10 text-emerald-600";
    if (a === "UPDATE") return "bg-blue-500/10 text-blue-600";
    if (a === "DELETE") return "bg-red-500/10 text-red-600";
    return "bg-gray-500/10 text-gray-600";
  };

  return (
    <PageWrapper>
      <AnimatedItem>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
              <History className="h-6 w-6" /> Trilha de Auditoria
            </h1>
            <p className="text-sm text-muted-foreground">{total} registros encontrados</p>
          </div>
          <Button variant="outline" size="sm" onClick={exportCsv}>
            <Download className="h-4 w-4 mr-2" /> Exportar CSV
          </Button>
        </div>
      </AnimatedItem>
      <AnimatedItem><Separator /></AnimatedItem>

      <AnimatedItem>
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === "Enter" && load()}
              className="pl-9"
            />
          </div>
          <Select value={entityFilter} onValueChange={v => { setEntityFilter(v); setPage(1); }}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Entidade" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="Transaction">Transação</SelectItem>
              <SelectItem value="Account">Conta</SelectItem>
              <SelectItem value="Category">Categoria</SelectItem>
              <SelectItem value="Invoice">Fatura</SelectItem>
              <SelectItem value="Budget">Orçamento</SelectItem>
            </SelectContent>
          </Select>
          <Select value={actionFilter} onValueChange={v => { setActionFilter(v); setPage(1); }}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Ação" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="CREATE">Criar</SelectItem>
              <SelectItem value="UPDATE">Atualizar</SelectItem>
              <SelectItem value="DELETE">Excluir</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </AnimatedItem>

      <AnimatedItem>
        <Card>
          <CardHeader><CardTitle className="text-sm">Log de Alterações</CardTitle></CardHeader>
          <CardContent>
            {logs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhum registro encontrado</p>
            ) : (
              <div className="space-y-3">
                {logs.map(log => (
                  <div key={log.id} className="p-3 rounded-lg border space-y-1">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <Badge className={actionColor(log.action)}>{log.action}</Badge>
                        <span className="text-sm font-medium">{log.entity}</span>
                        <span className="text-xs text-muted-foreground font-mono">{log.entityId.slice(0, 8)}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {log.userName && <span>{log.userName}</span>}
                        {log.ipAddress && <span className="font-mono">{log.ipAddress}</span>}
                        <span>{new Date(log.createdAt).toLocaleString("pt-BR")}</span>
                      </div>
                    </div>
                    {log.changes && log.changes !== "{}" && (
                      <pre className="text-xs text-muted-foreground bg-muted/50 rounded p-2 overflow-x-auto max-h-24">
                        {(() => { try { return JSON.stringify(JSON.parse(log.changes), null, 2); } catch { return log.changes; } })()}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            )}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">{page} / {totalPages}</span>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </AnimatedItem>
    </PageWrapper>
  );
}
