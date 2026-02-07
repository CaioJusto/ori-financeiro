"use client";
import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Erro"); setLoading(false); return; }
      setSent(true);
    } catch {
      setError("Erro de conexão");
    } finally { setLoading(false); }
  }

  if (sent) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-8 space-y-6 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-green-500/10 text-2xl">✅</div>
        <h1 className="text-2xl font-bold">Email Enviado</h1>
        <p className="text-muted-foreground">Se o email existir no sistema, você receberá instruções para redefinir sua senha.</p>
        <p className="text-sm text-muted-foreground">(Simulado — token gerado no banco de dados)</p>
        <Link href="/login" className="text-primary hover:underline text-sm">Voltar ao login</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-2xl">🔑</div>
          <h1 className="text-2xl font-bold">Esqueceu a Senha?</h1>
          <p className="text-muted-foreground text-sm">Informe seu email para receber o link de recuperação</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="p-3 text-sm text-red-500 bg-red-500/10 rounded-lg border border-red-500/20">{error}</div>}
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">Email</label>
            <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary" placeholder="seu@email.com" required />
          </div>
          <button type="submit" disabled={loading} className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
            {loading ? "Enviando..." : "Enviar Link de Recuperação"}
          </button>
        </form>
        <p className="text-center text-sm text-muted-foreground">
          <Link href="/login" className="text-primary hover:underline">Voltar ao login</Link>
        </p>
      </div>
    </div>
  );
}
