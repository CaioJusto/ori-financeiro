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
import { Key, Plus, Trash2, Copy, Eye, EyeOff } from "lucide-react";

interface ApiKeyData {
  id: string; name: string; keyPrefix: string; permissions: string[];
  lastUsed: string | null; expiresAt: string | null; active: boolean; createdAt: string;
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKeyData[]>([]);
  const [name, setName] = useState("");
  const [newKey, setNewKey] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);

  const load = () => fetch("/api/api-keys").then(r => r.json()).then(setKeys);
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!name) return;
    const res = await fetch("/api/api-keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, permissions: ["*"] }),
    });
    const data = await res.json();
    if (data.rawKey) {
      setNewKey(data.rawKey);
      toast.success("Chave criada! Copie agora, ela não será exibida novamente.");
    }
    setName("");
    load();
  };

  const remove = async (id: string) => {
    await fetch("/api/api-keys", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    toast.success("Chave removida");
    load();
  };

  const copyKey = () => {
    if (newKey) { navigator.clipboard.writeText(newKey); toast.success("Copiado!"); }
  };

  return (
    <PageWrapper>
      <AnimatedItem>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Key className="h-6 w-6" /> Chaves de API
          </h1>
          <p className="text-sm text-muted-foreground">Gerencie chaves para integrações externas</p>
        </div>
      </AnimatedItem>
      <AnimatedItem><Separator /></AnimatedItem>

      {newKey && (
        <AnimatedItem>
          <Card className="border-emerald-500/50 bg-emerald-500/5">
            <CardContent className="p-4">
              <p className="text-sm font-medium mb-2">🔑 Nova chave criada — copie agora!</p>
              <div className="flex items-center gap-2">
                <Input readOnly value={showKey ? newKey : "•".repeat(40)} className="font-mono text-xs" />
                <Button variant="ghost" size="sm" onClick={() => setShowKey(!showKey)}>
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button variant="outline" size="sm" onClick={copyKey}><Copy className="h-4 w-4" /></Button>
              </div>
            </CardContent>
          </Card>
        </AnimatedItem>
      )}

      <AnimatedItem>
        <Card>
          <CardHeader><CardTitle className="text-sm">Criar Nova Chave</CardTitle></CardHeader>
          <CardContent>
            <div className="flex gap-3 items-end">
              <div className="flex-1"><Label>Nome</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="Minha Integração" /></div>
              <Button onClick={create}><Plus className="h-4 w-4 mr-1" /> Criar</Button>
            </div>
          </CardContent>
        </Card>
      </AnimatedItem>

      <AnimatedItem>
        <Card>
          <CardHeader><CardTitle className="text-sm">Chaves Ativas</CardTitle></CardHeader>
          <CardContent>
            {keys.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhuma chave criada</p>
            ) : (
              <div className="space-y-2">
                {keys.map(k => (
                  <div key={k.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="text-sm font-medium">{k.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{k.keyPrefix}...</p>
                      <div className="flex gap-2 mt-1">
                        <Badge variant={k.active ? "default" : "secondary"}>{k.active ? "Ativa" : "Inativa"}</Badge>
                        {k.lastUsed && <span className="text-xs text-muted-foreground">Último uso: {new Date(k.lastUsed).toLocaleDateString("pt-BR")}</span>}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => remove(k.id)}>
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
