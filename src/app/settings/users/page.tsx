"use client";
import { useState, useEffect, useCallback } from "react";
import { PageWrapper } from "@/components/page-wrapper";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Shield, Eye, X, Check } from "lucide-react";
import { toast } from "sonner";
import { PERMISSION_MODULES } from "@/lib/permissions";

type RoleData = {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  isSystem: boolean;
};

type UserData = {
  id: string;
  email: string;
  name: string;
  roleId: string;
  role: { id: string; name: string };
  createdAt: string;
};

const ROLE_COLORS: Record<string, string> = {
  OWNER: "bg-purple-500/20 text-purple-400",
  ADMIN: "bg-blue-500/20 text-blue-400",
  MANAGER: "bg-green-500/20 text-green-400",
  VIEWER: "bg-gray-500/20 text-gray-400",
};

export default function UsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [roles, setRoles] = useState<RoleData[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ email: "", name: "", password: "", roleId: "" });
  const [previewRoleId, setPreviewRoleId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [usersRes, rolesRes] = await Promise.all([
      fetch("/api/users"),
      fetch("/api/roles"),
    ]);
    if (usersRes.ok) setUsers(await usersRes.json());
    if (rolesRes.ok) {
      const rolesData = await rolesRes.json();
      setRoles(rolesData);
      // Set default roleId to VIEWER
      if (!form.roleId) {
        const viewer = rolesData.find((r: RoleData) => r.name === "VIEWER" && r.isSystem);
        if (viewer) setForm(f => ({ ...f, roleId: viewer.id }));
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { load(); }, [load]);

  const previewRole = roles.find(r => r.id === previewRoleId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      toast.success("Usuário criado!");
      setForm({ email: "", name: "", password: "", roleId: roles.find(r => r.name === "VIEWER")?.id || "" });
      setShowForm(false);
      load();
    } else {
      const data = await res.json();
      toast.error(data.error || "Erro ao criar usuário");
    }
  }

  async function handleChangeRole(userId: string, roleId: string) {
    await fetch(`/api/users/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roleId }),
    });
    toast.success("Papel atualizado!");
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza?")) return;
    const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Usuário removido!");
      load();
    } else {
      const data = await res.json();
      toast.error(data.error || "Erro ao remover");
    }
  }

  return (
    <PageWrapper>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Gerenciar Usuários</h1>
          <p className="text-muted-foreground text-sm">Convide e gerencie os membros da sua equipe</p>
        </div>
        <div className="flex justify-end">
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="w-4 h-4 mr-2" /> Convidar Usuário
          </Button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="p-4 rounded-lg border border-border bg-card space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Nome</label>
                <input className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div>
                <label className="text-sm font-medium">Email</label>
                <input type="email" className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div>
                <label className="text-sm font-medium">Senha</label>
                <input type="password" className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
              </div>
              <div>
                <label className="text-sm font-medium">Papel</label>
                <div className="flex gap-2 mt-1">
                  <select className="flex-1 px-3 py-2 rounded-lg border border-border bg-background" value={form.roleId} onChange={e => setForm({ ...form, roleId: e.target.value })}>
                    {roles.map(r => <option key={r.id} value={r.id}>{r.name} {r.isSystem ? "(Sistema)" : "(Custom)"}</option>)}
                  </select>
                  <Button type="button" variant="outline" size="icon" onClick={() => setPreviewRoleId(form.roleId)} title="Ver permissões">
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Role permissions preview */}
            {previewRole && (
              <div className="p-3 rounded-lg border border-border bg-muted/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Permissões: {previewRole.name}</span>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setPreviewRoleId(null)}><X className="w-3 h-3" /></Button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {PERMISSION_MODULES.map(mod => {
                    const count = mod.permissions.filter(p => previewRole.permissions.includes(p.key)).length;
                    if (count === 0) return null;
                    return (
                      <div key={mod.module} className="text-xs">
                        <span className="font-medium">{mod.label}</span>
                        <span className="text-muted-foreground ml-1">({count}/{mod.permissions.length})</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button type="submit">Criar Usuário</Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            </div>
          </form>
        )}

        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left p-3 text-sm font-medium">Nome</th>
                <th className="text-left p-3 text-sm font-medium">Email</th>
                <th className="text-left p-3 text-sm font-medium">Papel</th>
                <th className="text-right p-3 text-sm font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-t border-border">
                  <td className="p-3 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-muted-foreground" />
                    {u.name}
                  </td>
                  <td className="p-3 text-muted-foreground">{u.email}</td>
                  <td className="p-3">
                    <select
                      className={`px-2 py-1 rounded text-xs font-medium ${ROLE_COLORS[u.role?.name] || "bg-gray-500/20 text-gray-400"} bg-transparent border-0`}
                      value={u.roleId}
                      onChange={e => handleChangeRole(u.id, e.target.value)}
                    >
                      {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                  </td>
                  <td className="p-3 text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(u.id)}>
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PageWrapper>
  );
}
