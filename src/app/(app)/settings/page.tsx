"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useOrg } from "@/contexts/org-context";
import { createClient } from "@/lib/supabase/client";

interface Member {
  id: string;
  role: "owner" | "admin" | "member";
  user_id: string;
}

interface Invitation {
  id: string;
  email: string;
  role: "owner" | "admin" | "member";
  status: "pending" | "accepted" | "expired";
  created_at: string;
}

export default function SettingsPage() {
  const { currentOrg } = useOrg();
  const [orgName, setOrgName] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "member">("member");
  const [inviteError, setInviteError] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const supabase = createClient();

  const isAdmin = currentUserRole === "owner" || currentUserRole === "admin";

  const loadData = useCallback(async () => {
    if (!currentOrg) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (user) setCurrentUserId(user.id);

    const { data: membersData } = await supabase
      .from("org_members")
      .select("id, role, user_id")
      .eq("organization_id", currentOrg.id);
    const membersList = (membersData as Member[]) ?? [];
    setMembers(membersList);

    if (user) {
      const me = membersList.find((m) => m.user_id === user.id);
      setCurrentUserRole(me?.role ?? null);
    }

    const { data: invData } = await supabase
      .from("org_invitations")
      .select("id, email, role, status, created_at")
      .eq("organization_id", currentOrg.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    setInvitations((invData as Invitation[]) ?? []);
  }, [currentOrg, supabase]);

  useEffect(() => {
    if (!currentOrg) return;
    setOrgName(currentOrg.name);
    loadData();
  }, [currentOrg, loadData]);

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

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!currentOrg || !currentUserId) return;
    setInviteError("");
    setInviteLoading(true);

    const existingInvite = invitations.find(
      (inv) => inv.email.toLowerCase() === inviteEmail.toLowerCase()
    );
    if (existingInvite) {
      setInviteError("Este email já possui um convite pendente.");
      setInviteLoading(false);
      return;
    }

    const { error } = await supabase.from("org_invitations").insert({
      organization_id: currentOrg.id,
      email: inviteEmail.toLowerCase(),
      role: inviteRole,
      invited_by: currentUserId,
    });

    if (error) {
      if (error.code === "23505") {
        setInviteError("Este email já possui um convite para esta organização.");
      } else {
        setInviteError(error.message);
      }
      setInviteLoading(false);
      return;
    }

    setInviteEmail("");
    setInviteRole("member");
    setInviteLoading(false);
    setInviteOpen(false);
    loadData();
  }

  async function handleChangeRole(memberId: string, newRole: "admin" | "member") {
    await supabase
      .from("org_members")
      .update({ role: newRole })
      .eq("id", memberId);
    loadData();
  }

  async function handleRemoveMember(memberId: string) {
    await supabase.from("org_members").delete().eq("id", memberId);
    loadData();
  }

  async function handleCancelInvite(inviteId: string) {
    await supabase.from("org_invitations").delete().eq("id", inviteId);
    loadData();
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">Gerencie sua organização</p>
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
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Membros</CardTitle>
            <CardDescription>
              {members.length} membro{members.length !== 1 ? "s" : ""}
            </CardDescription>
          </div>
          {isAdmin && (
            <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
              <DialogTrigger render={<Button size="sm" />}>
                Convidar Membro
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Convidar Membro</DialogTitle>
                  <DialogDescription>
                    Envie um convite por email para adicionar um novo membro à organização.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleInvite} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="invite-email">Email</Label>
                    <Input
                      id="invite-email"
                      type="email"
                      placeholder="membro@email.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Função</Label>
                    <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as "admin" | "member")}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="member">Membro</SelectItem>
                        <SelectItem value="admin">Administrador</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {inviteError && (
                    <p className="text-sm text-red-500">{inviteError}</p>
                  )}
                  <Button type="submit" className="w-full" disabled={inviteLoading}>
                    {inviteLoading ? "Enviando..." : "Enviar Convite"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          {members.map((member) => (
            <div key={member.id} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono">
                  {member.user_id.slice(0, 8)}...
                </span>
                {member.user_id === currentUserId && (
                  <Badge variant="outline" className="text-xs">você</Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                {member.role === "owner" ? (
                  <Badge variant="secondary">owner</Badge>
                ) : isAdmin && member.user_id !== currentUserId ? (
                  <>
                    <Select
                      value={member.role}
                      onValueChange={(v) => handleChangeRole(member.id, v as "admin" | "member")}
                    >
                      <SelectTrigger className="h-8 w-[130px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="member">Membro</SelectItem>
                        <SelectItem value="admin">Administrador</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                      onClick={() => handleRemoveMember(member.id)}
                    >
                      Remover
                    </Button>
                  </>
                ) : (
                  <Badge variant="secondary">{member.role}</Badge>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {isAdmin && invitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Convites Pendentes</CardTitle>
            <CardDescription>
              {invitations.length} convite{invitations.length !== 1 ? "s" : ""} pendente{invitations.length !== 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {invitations.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between">
                <div>
                  <span className="text-sm">{inv.email}</span>
                  <Badge variant="outline" className="ml-2 text-xs">{inv.role}</Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                  onClick={() => handleCancelInvite(inv.id)}
                >
                  Cancelar
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
