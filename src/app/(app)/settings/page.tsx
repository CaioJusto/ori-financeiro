"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useOrg } from "@/contexts/org-context";
import { createClient } from "@/lib/supabase/client";

interface Member {
  id: string;
  role: string;
  user_id: string;
}

export default function SettingsPage() {
  const { currentOrg } = useOrg();
  const [orgName, setOrgName] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (!currentOrg) return;
    setOrgName(currentOrg.name);
    loadMembers();
  }, [currentOrg]);

  async function loadMembers() {
    const { data } = await supabase
      .from("org_members")
      .select("id, role, user_id")
      .eq("organization_id", currentOrg!.id);
    setMembers((data as Member[]) ?? []);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!currentOrg) return;
    setSaving(true);

    await supabase
      .from("organizations")
      .update({ name: orgName })
      .eq("id", currentOrg.id);

    setSaving(false);
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie sua organização
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Organização</CardTitle>
          <CardDescription>Informações da organização</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Membros</CardTitle>
          <CardDescription>
            {members.length} membro{members.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {members.map((member) => (
            <div key={member.id} className="flex items-center justify-between">
              <span className="text-sm font-mono">{member.user_id.slice(0, 8)}...</span>
              <Badge variant="secondary">{member.role}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
