"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
  email?: string;
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
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "member">("member");
  const [inviteError, setInviteError] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const supabase = createClient();

  const isAdmin = currentUserRole === "owner" || currentUserRole === "admin";

  const loadData = useCallback(async () => {
    if (!currentOrg) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
      setCurrentUserEmail(user.email ?? null);
    }

    const { data: membersData } = await supabase
      .from("org_members")
      .select("id, role, user_id")
      .eq("organization_id", currentOrg.id);
    const membersList = (membersData as Member[]) ?? [];

    // Try to fetch member emails via RPC
    const { data: emailsData } = await supabase.rpc("get_org_member_emails", {
      org_id: currentOrg.id,
    });
    const emailMap = new Map<string, string>();
    if (emailsData) {
      for (const row of emailsData as { user_id: string; email: string }[]) {
        emailMap.set(row.user_id, row.email);
      }
    }

    const membersWithEmails = membersList.map((m) => ({
      ...m,
      email: emailMap.get(m.user_id),
    }));
    setMembers(membersWithEmails);

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
    setPageLoading(false);
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

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (newPassword.length < 6) {
      setPasswordError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("As senhas não coincidem.");
      return;
    }

    setPasswordLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPasswordLoading(false);

    if (error) {
      setPasswordError(error.message);
      return;
    }

    setPasswordSuccess("Senha alterada com sucesso.");
    setNewPassword("");
    setConfirmPassword("");
    setTimeout(() => {
      setPasswordOpen(false);
      setPasswordSuccess("");
    }, 1500);
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

  if (pageLoading) {
    return (
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
          <p className="text-muted-foreground">Gerencie seu perfil e organização</p>
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-4 w-36" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-9 w-full" />
            </div>
            <Skeleton className="h-9 w-28" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-4 w-44" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-9 w-full" />
            </div>
            <Skeleton className="h-9 w-16" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">Gerencie seu perfil e organização</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Perfil</CardTitle>
          <CardDescription>Informações da sua conta</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={currentUserEmail ?? ""} disabled />
          </div>
          <div className="flex items-center gap-3">
            <Dialog open={passwordOpen} onOpenChange={(open) => {
              setPasswordOpen(open);
              if (!open) {
                setNewPassword("");
                setConfirmPassword("");
                setPasswordError("");
                setPasswordSuccess("");
              }
            }}>
              <DialogTrigger render={<Button variant="outline" size="sm" />}>
                Alterar Senha
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Alterar Senha</DialogTitle>
                  <DialogDescription>
                    Digite sua nova senha abaixo.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-password">Nova Senha</Label>
                    <Input
                      id="new-password"
                      type="password"
                      placeholder="Mínimo 6 caracteres"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirmar Senha</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="Repita a nova senha"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                  {passwordError && (
                    <p className="text-sm text-red-500">{passwordError}</p>
                  )}
                  {passwordSuccess && (
                    <p className="text-sm text-green-500">{passwordSuccess}</p>
                  )}
                  <Button type="submit" className="w-full" disabled={passwordLoading}>
                    {passwordLoading ? "Alterando..." : "Alterar Senha"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

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
                <span className="text-sm">
                  {member.email ?? member.user_id.slice(0, 8) + "..."}
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
