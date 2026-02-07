"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { PageWrapper, AnimatedItem } from "@/components/page-wrapper";
import { toast } from "sonner";
import { ShieldCheck, Key, Smartphone, Monitor, Trash2 } from "lucide-react";

export default function SecurityPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 6) { toast.error("Senha deve ter pelo menos 6 caracteres"); return; }
    if (newPassword !== confirmPassword) { toast.error("Senhas não conferem"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (res.ok) {
        toast.success("Senha alterada com sucesso");
        setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      } else {
        const data = await res.json();
        toast.error(data.error || "Erro ao alterar senha");
      }
    } catch { toast.error("Erro de conexão"); }
    finally { setLoading(false); }
  }

  function handleToggle2FA() {
    setTwoFactorEnabled(!twoFactorEnabled);
    toast.success(twoFactorEnabled ? "2FA desativado" : "2FA ativado (simulado)");
  }

  // Simulated sessions
  const sessions = [
    { id: "1", device: "Chrome / Windows", ip: "192.168.1.1", lastActive: "Agora", current: true },
    { id: "2", device: "Safari / iPhone", ip: "192.168.1.50", lastActive: "2h atrás", current: false },
    { id: "3", device: "Firefox / Linux", ip: "10.0.0.5", lastActive: "1 dia atrás", current: false },
  ];

  return (
    <PageWrapper>
      <AnimatedItem>
        <h1 className="text-2xl font-bold">Segurança</h1>
        <p className="text-muted-foreground">Gerencie senha, 2FA e sessões ativas</p>
      </AnimatedItem>

      {/* Change Password */}
      <AnimatedItem>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              <CardTitle>Alterar Senha</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
              <div className="space-y-2">
                <label className="text-sm font-medium">Senha Atual</label>
                <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Nova Senha</label>
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Confirmar Nova Senha</label>
                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary" required />
              </div>
              <Button type="submit" disabled={loading}>{loading ? "Salvando..." : "Alterar Senha"}</Button>
            </form>
          </CardContent>
        </Card>
      </AnimatedItem>

      {/* Two-Factor Auth */}
      <AnimatedItem>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                <div>
                  <CardTitle>Autenticação em Dois Fatores (2FA)</CardTitle>
                  <CardDescription>Adicione uma camada extra de segurança com TOTP</CardDescription>
                </div>
              </div>
              <Switch checked={twoFactorEnabled} onCheckedChange={handleToggle2FA} />
            </div>
          </CardHeader>
          {twoFactorEnabled && (
            <CardContent>
              <div className="p-4 bg-muted rounded-lg text-center space-y-2">
                <ShieldCheck className="h-8 w-8 mx-auto text-green-500" />
                <p className="text-sm font-medium">2FA está ativo</p>
                <p className="text-xs text-muted-foreground">Use um app autenticador (Google Authenticator, Authy) para gerar códigos</p>
              </div>
            </CardContent>
          )}
        </Card>
      </AnimatedItem>

      {/* Active Sessions */}
      <AnimatedItem>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              <div>
                <CardTitle>Sessões Ativas</CardTitle>
                <CardDescription>Dispositivos conectados à sua conta</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sessions.map(s => (
                <div key={s.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Monitor className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium flex items-center gap-2">
                        {s.device}
                        {s.current && <Badge variant="secondary" className="text-xs">Atual</Badge>}
                      </div>
                      <div className="text-xs text-muted-foreground">IP: {s.ip} · {s.lastActive}</div>
                    </div>
                  </div>
                  {!s.current && (
                    <Button variant="ghost" size="sm" onClick={() => toast.success("Sessão revogada")}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </AnimatedItem>
    </PageWrapper>
  );
}
