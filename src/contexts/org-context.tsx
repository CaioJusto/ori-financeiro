"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { Database } from "@/types/database";

type Organization = Database["public"]["Tables"]["organizations"]["Row"];

interface OrgContextType {
  organizations: Organization[];
  currentOrg: Organization | null;
  setCurrentOrg: (org: Organization) => void;
  loading: boolean;
}

const OrgContext = createContext<OrgContextType>({
  organizations: [],
  currentOrg: null,
  setCurrentOrg: () => {},
  loading: true,
});

const supabase = createClient();

function SetupOrg({ onCreated }: { onCreated: () => void }) {
  const [orgName, setOrgName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError("");

    const slug = orgName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("Sessão expirada. Faça login novamente.");
      setCreating(false);
      return;
    }

    const { data: orgRaw, error: orgError } = await supabase
      .from("organizations")
      .insert({ name: orgName, slug })
      .select()
      .single();

    if (orgError || !orgRaw) {
      setError(orgError?.message ?? "Erro ao criar organização");
      setCreating(false);
      return;
    }
    const org = orgRaw as { id: string };

    await supabase.from("org_members").insert({
      organization_id: org.id,
      user_id: user.id,
      role: "owner",
    });

    await supabase.from("cash_accounts").insert([
      { organization_id: org.id, name: "Meu Caixa", type: "personal" as const },
      { organization_id: org.id, name: "Caixa da Empresa", type: "company" as const },
      { organization_id: org.id, name: "Caixa 2", type: "cash2" as const },
    ]);

    onCreated();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Configurar Organização</CardTitle>
          <CardDescription>
            Crie sua organização para começar a usar o Ori Financeiro
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="setupOrgName">Nome da Organização</Label>
              <Input
                id="setupOrgName"
                placeholder="Minha Empresa"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" className="w-full" disabled={creating}>
              {creating ? "Criando..." : "Criar Organização"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export function OrgProvider({ children }: { children: ReactNode }) {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [noOrgs, setNoOrgs] = useState(false);

  const loadOrgs = useCallback(async () => {
    const { data: raw } = await supabase.from("organizations").select("*");
    const orgs = (raw as Organization[]) ?? [];
    if (orgs.length > 0) {
      setOrganizations(orgs);
      const savedOrgId = localStorage.getItem("ori_current_org");
      const saved = orgs.find((o) => o.id === savedOrgId);
      setCurrentOrg(saved ?? orgs[0]);
      setNoOrgs(false);
    } else {
      setNoOrgs(true);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadOrgs();
  }, [loadOrgs]);

  function handleSetCurrentOrg(org: Organization) {
    setCurrentOrg(org);
    localStorage.setItem("ori_current_org", org.id);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (noOrgs) {
    return <SetupOrg onCreated={() => { setLoading(true); loadOrgs(); }} />;
  }

  return (
    <OrgContext.Provider
      value={{
        organizations,
        currentOrg,
        setCurrentOrg: handleSetCurrentOrg,
        loading,
      }}
    >
      {children}
    </OrgContext.Provider>
  );
}

export function useOrg() {
  return useContext(OrgContext);
}
