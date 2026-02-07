"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const [tenantName, setTenantName] = useState("");
  const [adminName, setAdminName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  function validateEmail(e: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setError("");

    if (!validateEmail(email)) { setError("Email inválido"); return; }
    if (password.length < 6) { setError("Senha deve ter pelo menos 6 caracteres"); return; }
    if (password !== confirmPassword) { setError("Senhas não conferem"); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantName, adminName, email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Erro ao registrar"); setLoading(false); return; }
      router.push("/login?registered=1");
    } catch {
      setError("Erro de conexão");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-2xl">💰</div>
          <h1 className="text-2xl font-bold">Criar Conta</h1>
          <p className="text-muted-foreground text-sm">Comece a gerenciar suas finanças agora</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="p-3 text-sm text-red-500 bg-red-500/10 rounded-lg border border-red-500/20">{error}</div>}
          <div className="space-y-2">
            <label htmlFor="tenantName" className="text-sm font-medium">Nome da Empresa/Organização</label>
            <input id="tenantName" type="text" value={tenantName} onChange={e => setTenantName(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Minha Empresa" required />
          </div>
          <div className="space-y-2">
            <label htmlFor="adminName" className="text-sm font-medium">Seu Nome</label>
            <input id="adminName" type="text" value={adminName} onChange={e => setAdminName(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary" placeholder="João Silva" required />
          </div>
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">Email</label>
            <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary" placeholder="seu@email.com" required />
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">Senha</label>
            <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary" placeholder="••••••••" required />
          </div>
          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="text-sm font-medium">Confirmar Senha</label>
            <input id="confirmPassword" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary" placeholder="••••••••" required />
          </div>
          <button type="submit" disabled={loading} className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
            {loading ? "Criando conta..." : "Criar Conta"}
          </button>
        </form>
        <p className="text-center text-sm text-muted-foreground">
          Já tem conta? <Link href="/login" className="text-primary hover:underline">Entrar</Link>
        </p>
      </div>
    </div>
  );
}
