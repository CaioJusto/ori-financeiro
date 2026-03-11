"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [orgName, setOrgName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    // 1. Sign up
    const slug = orgName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (typeof window !== "undefined" ? window.location.origin : "");

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { org_name: orgName, org_slug: slug },
        emailRedirectTo: `${siteUrl}/auth/callback`,
      },
    });

    if (authError) {
      if (
        authError.message.includes("rate limit") ||
        authError.message.includes("over_email_send_rate_limit") ||
        authError.status === 429
      ) {
        setError(
          "Limite de emails do servidor atingido. Aguarde alguns minutos e tente novamente. Se o problema persistir, entre em contato com o suporte."
        );
      } else if (authError.message.includes("already registered") || authError.message.includes("already been registered")) {
        setError("Este email já está cadastrado. Tente fazer login ou recuperar sua senha.");
      } else {
        setError(authError.message);
      }
      setLoading(false);
      return;
    }

    if (!authData.user) {
      setError("Erro ao criar conta");
      setLoading(false);
      return;
    }

    // Check if email confirmation is required (session will be null)
    if (!authData.session) {
      setConfirmationSent(true);
      setLoading(false);
      return;
    }

    // 2. Create organization
    const { data: orgRaw, error: orgError } = await supabase
      .from("organizations")
      .insert({ name: orgName, slug })
      .select()
      .single();

    if (orgError || !orgRaw) {
      setError(orgError?.message ?? "Erro ao criar organização");
      setLoading(false);
      return;
    }
    const org = orgRaw as { id: string };

    // 3. Add user as owner
    await supabase.from("org_members").insert({
      organization_id: org.id,
      user_id: authData.user.id,
      role: "owner",
    });

    // 4. Create default cash accounts
    await supabase.from("cash_accounts").insert([
      { organization_id: org.id, name: "Meu Caixa", type: "personal" as const },
      { organization_id: org.id, name: "Caixa da Empresa", type: "company" as const },
      { organization_id: org.id, name: "Caixa 2", type: "cash2" as const },
    ]);

    router.push("/dashboard");
  }

  if (confirmationSent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Verifique seu Email</CardTitle>
            <CardDescription>
              Enviamos um link de confirmação para <strong>{email}</strong>.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-sm text-muted-foreground">
              Clique no link no email para ativar sua conta.
            </p>
            <div className="rounded-md bg-yellow-500/10 border border-yellow-500/20 p-3 text-left">
              <p className="text-xs text-yellow-700 dark:text-yellow-400 font-medium mb-1">
                📬 Não recebeu o email?
              </p>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                <li>Verifique a pasta de <strong>Spam / Lixo eletrônico</strong></li>
                <li>O email pode levar até 5 minutos para chegar</li>
                <li>Se ainda não chegou, clique em &quot;Ir para Login&quot; e use o botão de reenvio</li>
              </ul>
            </div>
            <Link href="/login">
              <Button variant="outline" className="w-full">Ir para Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Criar Conta</CardTitle>
          <CardDescription>
            Comece a gerenciar suas finanças
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="orgName">Nome da Organização</Label>
              <Input
                id="orgName"
                placeholder="Minha Empresa"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Criando..." : "Criar Conta"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Já tem conta?{" "}
              <Link href="/login" className="text-primary underline">
                Entrar
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
