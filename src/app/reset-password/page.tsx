"use client";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 6) { setError("Senha deve ter pelo menos 6 caracteres"); return; }
    if (password !== confirmPassword) { setError("Senhas não conferem"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Erro"); setLoading(false); return; }
      setDone(true);
    } catch {
      setError("Erro de conexão");
    } finally { setLoading(false); }
  }

  if (done) return (
    <div className="text-center space-y-4">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-green-500/10 text-2xl">✅</div>
      <h1 className="text-2xl font-bold">Senha Redefinida</h1>
      <p className="text-muted-foreground">Sua senha foi alterada com sucesso.</p>
      <Link href="/login" className="text-primary hover:underline">Ir para o login</Link>
    </div>
  );

  if (!token) return (
    <div className="text-center space-y-4">
      <h1 className="text-2xl font-bold">Token Inválido</h1>
      <p className="text-muted-foreground">Link de recuperação inválido ou expirado.</p>
      <Link href="/forgot-password" className="text-primary hover:underline">Solicitar novo link</Link>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-2xl">🔒</div>
        <h1 className="text-2xl font-bold">Redefinir Senha</h1>
        <p className="text-muted-foreground text-sm">Digite sua nova senha</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="p-3 text-sm text-red-500 bg-red-500/10 rounded-lg border border-red-500/20">{error}</div>}
        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium">Nova Senha</label>
          <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary" required />
        </div>
        <div className="space-y-2">
          <label htmlFor="confirm" className="text-sm font-medium">Confirmar Senha</label>
          <input id="confirm" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary" required />
        </div>
        <button type="submit" disabled={loading} className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
          {loading ? "Salvando..." : "Redefinir Senha"}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-8">
        <Suspense fallback={<div className="text-center">Carregando...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
