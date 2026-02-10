"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { PageWrapper, AnimatedItem } from "@/components/page-wrapper";
import { Bot, Key, Save, Loader2, Zap, Eye, EyeOff, AlertCircle, CheckCircle2, Sparkles, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

const AI_MODELS = [
  { value: "gpt-4o", label: "GPT-4o", desc: "Mais capaz, mais caro" },
  { value: "gpt-4o-mini", label: "GPT-4o Mini", desc: "Rápido e econômico (recomendado)" },
  { value: "gpt-4-turbo", label: "GPT-4 Turbo", desc: "Alta performance" },
  { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo", desc: "Mais barato" },
  { value: "o3-mini", label: "O3 Mini", desc: "Modelo de raciocínio" },
];

const DEFAULT_SYSTEM_PROMPT = `Você é o Ori, um assistente financeiro pessoal inteligente. Você ajuda o usuário a gerenciar suas finanças, analisar gastos, acompanhar metas e tomar decisões financeiras melhores. Responda sempre em português brasileiro, de forma clara e objetiva. Use emojis quando apropriado para tornar a conversa mais amigável.`;

export default function AISettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const [apiKey, setApiKey] = useState("");
  const [apiKeySet, setApiKeySet] = useState(false);
  const [maskedKey, setMaskedKey] = useState("");
  const [model, setModel] = useState("gpt-4o-mini");
  const [enabled, setEnabled] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState("");

  useEffect(() => {
    document.title = "Configurações de IA | Ori Financeiro";
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings/ai");
      if (res.ok) {
        const data = await res.json();
        setMaskedKey(data.aiApiKey || "");
        setApiKeySet(data.aiApiKeySet);
        setModel(data.aiModel || "gpt-4o-mini");
        setEnabled(data.aiEnabled);
        setSystemPrompt(data.aiSystemPrompt || "");
      }
    } catch {
      toast.error("Erro ao carregar configurações");
    } finally {
      setLoading(false);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          aiApiKey: apiKey || undefined,
          aiModel: model,
          aiEnabled: enabled,
          aiSystemPrompt: systemPrompt,
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setMaskedKey(data.aiApiKey || "");
      setApiKeySet(data.aiApiKeySet);
      setApiKey("");
      toast.success("Configurações de IA salvas!");
    } catch {
      toast.error("Erro ao salvar configurações");
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/settings/ai/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: apiKey || undefined }),
      });
      const data = await res.json();
      setTestResult({ success: data.success, message: data.success ? data.message : data.error });
      if (data.success) toast.success("Conexão com OpenAI OK!");
      else toast.error(data.error);
    } catch {
      setTestResult({ success: false, message: "Erro de conexão" });
      toast.error("Erro ao testar conexão");
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <PageWrapper>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="max-w-2xl space-y-6">
        {/* Header */}
        <AnimatedItem>
          <div className="flex items-center gap-3 mb-2">
            <Link href="/settings" className="p-1.5 rounded-lg hover:bg-zinc-800/50 text-muted-foreground/60 hover:text-foreground transition-all">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="w-10 h-10 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
              <Bot className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">Configurações de IA</h1>
              <p className="text-xs text-muted-foreground/60">Configure o agente inteligente do Chat</p>
            </div>
          </div>
        </AnimatedItem>
        {/* Status Card */}
        <AnimatedItem>
          <Card className="border-border/40 bg-zinc-950/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${enabled ? "bg-violet-500/20 border border-violet-500/30" : "bg-zinc-800/60 border border-border/30"}`}>
                    <Sparkles className={`w-5 h-5 ${enabled ? "text-violet-400" : "text-zinc-500"}`} />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium">Agente de IA</h3>
                    <p className="text-xs text-muted-foreground/60">
                      {enabled ? "Ativo — usando OpenAI no Chat" : "Desativado — usando respostas locais"}
                    </p>
                  </div>
                </div>
                <Switch checked={enabled} onCheckedChange={setEnabled} />
              </div>
            </CardContent>
          </Card>
        </AnimatedItem>

        {/* API Key Card */}
        <AnimatedItem>
          <Card className="border-border/40 bg-zinc-950/50">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Key className="w-4 h-4 text-violet-400" />
                API Key da OpenAI
              </CardTitle>
              <CardDescription>
                Insira sua chave de API da OpenAI. Ela será criptografada no banco de dados.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {apiKeySet && !apiKey && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>API Key configurada: <code className="font-mono">{maskedKey}</code></span>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="apiKey" className="text-xs">
                  {apiKeySet ? "Nova API Key (deixe vazio para manter a atual)" : "API Key"}
                </Label>
                <div className="relative">
                  <Input
                    id="apiKey"
                    type={showKey ? "text" : "password"}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-proj-..."
                    className="pr-10 font-mono text-xs bg-zinc-900/60 border-border/40"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                  >
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-muted-foreground/40">
                  Obtenha sua chave em{" "}
                  <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:underline">
                    platform.openai.com/api-keys
                  </a>
                </p>
              </div>

              {/* Test Connection */}
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={testConnection}
                  disabled={testing || (!apiKey && !apiKeySet)}
                  className="border-border/40"
                >
                  {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> : <Zap className="w-3.5 h-3.5 mr-2" />}
                  Testar Conexão
                </Button>
                {testResult && (
                  <span className={`text-xs flex items-center gap-1.5 ${testResult.success ? "text-emerald-400" : "text-red-400"}`}>
                    {testResult.success ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                    {testResult.message}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        </AnimatedItem>

        {/* Model Selection */}
        <AnimatedItem>
          <Card className="border-border/40 bg-zinc-950/50">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Bot className="w-4 h-4 text-violet-400" />
                Modelo
              </CardTitle>
              <CardDescription>
                Escolha o modelo de IA para o assistente financeiro.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger className="bg-zinc-900/60 border-border/40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AI_MODELS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{m.label}</span>
                        <span className="text-[11px] text-muted-foreground/50">— {m.desc}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </AnimatedItem>

        {/* System Prompt */}
        <AnimatedItem>
          <Card className="border-border/40 bg-zinc-950/50">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-violet-400" />
                System Prompt
              </CardTitle>
              <CardDescription>
                Personalize o comportamento do assistente (opcional).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder={DEFAULT_SYSTEM_PROMPT}
                rows={5}
                className="bg-zinc-900/60 border-border/40 text-xs resize-none"
              />
              {!systemPrompt && (
                <p className="text-[11px] text-muted-foreground/40">
                  Deixe vazio para usar o prompt padrão do Ori.
                </p>
              )}
              {systemPrompt && (
                <Button variant="ghost" size="sm" onClick={() => setSystemPrompt("")} className="text-xs text-muted-foreground/50">
                  Restaurar padrão
                </Button>
              )}
            </CardContent>
          </Card>
        </AnimatedItem>

        {/* Save */}
        <AnimatedItem>
          <div className="flex justify-end">
            <Button onClick={save} disabled={saving} className="bg-violet-600 hover:bg-violet-500">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Salvar Configurações
            </Button>
          </div>
        </AnimatedItem>
      </div>
    </PageWrapper>
  );
}
