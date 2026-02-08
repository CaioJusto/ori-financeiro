"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PageWrapper, AnimatedItem } from "@/components/page-wrapper";
import { Plus, Copy, Check, Trash2, Ticket } from "lucide-react";
interface InviteCode {
  id: string;
  code: string;
  createdBy: string;
  usedBy: string | null;
  usedAt: string | null;
  active: boolean;
  createdAt: string;
}

export default function InviteCodesPage() {
  const [codes, setCodes] = useState<InviteCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [customCode, setCustomCode] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  async function fetchCodes() {
    try {
      const res = await fetch("/api/invite-codes");
      if (res.ok) setCodes(await res.json());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchCodes(); }, []);

  async function createCode() {
    setCreating(true);
    try {
      const body: any = {};
      if (customCode.trim()) body.code = customCode.trim();
      const res = await fetch("/api/invite-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setCustomCode("");
        fetchCodes();
        setMessage("Código criado!");
      } else {
        const data = await res.json();
        setMessage("Erro: " + data.error);
      }
    } finally {
      setCreating(false);
    }
  }

  async function deactivateCode(id: string) {
    const res = await fetch(`/api/invite-codes?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      fetchCodes();
      setMessage("Código desativado");
    }
  }

  function copyCode(code: string, id: string) {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    setMessage("Copiado!");
  }

  function getStatus(code: InviteCode) {
    if (code.usedBy) return <Badge variant="secondary">Usado</Badge>;
    if (!code.active) return <Badge variant="destructive">Desativado</Badge>;
    return <Badge className="bg-green-500 hover:bg-green-600">Ativo</Badge>;
  }

  return (
    <PageWrapper>
      <AnimatedItem>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Ticket className="h-8 w-8 text-violet-500" />
              Códigos de Convite
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie os códigos de convite para novos usuários
            </p>
          </div>
        </div>
      </AnimatedItem>

      <AnimatedItem>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Gerar Novo Código</CardTitle>
            <CardDescription>Deixe em branco para gerar automaticamente</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Input
                placeholder="Código personalizado (opcional)"
                value={customCode}
                onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
                className="max-w-xs"
              />
              <Button onClick={createCode} disabled={creating}>
                <Plus className="h-4 w-4 mr-2" />
                {creating ? "Gerando..." : "Gerar Código"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </AnimatedItem>

      <AnimatedItem>
        <Card>
          <CardHeader>
            <CardTitle>Todos os Códigos</CardTitle>
            <CardDescription>{codes.length} código(s) no total</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground">Carregando...</p>
            ) : codes.length === 0 ? (
              <p className="text-muted-foreground">Nenhum código encontrado</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2 font-medium">Código</th>
                      <th className="text-left py-3 px-2 font-medium">Status</th>
                      <th className="text-left py-3 px-2 font-medium">Usado por</th>
                      <th className="text-left py-3 px-2 font-medium">Criado em</th>
                      <th className="text-right py-3 px-2 font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {codes.map((code) => (
                      <tr key={code.id} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="py-3 px-2 font-mono font-bold text-violet-600 dark:text-violet-400">
                          {code.code}
                        </td>
                        <td className="py-3 px-2">{getStatus(code)}</td>
                        <td className="py-3 px-2 text-muted-foreground">
                          {code.usedBy || "—"}
                        </td>
                        <td className="py-3 px-2 text-muted-foreground">
                          {new Date(code.createdAt).toLocaleDateString("pt-BR")}
                        </td>
                        <td className="py-3 px-2 text-right space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyCode(code.code, code.id)}
                          >
                            {copiedId === code.id ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                          {code.active && !code.usedBy && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deactivateCode(code.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </AnimatedItem>
    </PageWrapper>
  );
}
