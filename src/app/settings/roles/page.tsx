"use client";
import { useState, useEffect, useCallback } from "react";
import { PageWrapper } from "@/components/page-wrapper";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, ShieldCheck, Pencil, Eye, X, Check } from "lucide-react";
import { toast } from "sonner";
import { PERMISSION_MODULES } from "@/lib/permissions";

type RoleData = {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  isSystem: boolean;
  _count: { users: number };
};

export default function RolesPage() {
  const [roles, setRoles] = useState<RoleData[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleData | null>(null);
  const [previewRole, setPreviewRole] = useState<RoleData | null>(null);
  const [form, setForm] = useState({ name: "", description: "", permissions: [] as string[] });

  const load = useCallback(async () => {
    const res = await fetch("/api/roles");
    if (res.ok) setRoles(await res.json());
  }, []);

  useEffect(() => { load(); }, [load]);

  function resetForm() {
    setForm({ name: "", description: "", permissions: [] });
    setShowForm(false);
    setEditingRole(null);
  }

  function startEdit(role: RoleData) {
    setEditingRole(role);
    setForm({ name: role.name, description: role.description, permissions: [...role.permissions] });
    setShowForm(true);
    setPreviewRole(null);
  }

  function togglePermission(perm: string) {
    setForm(f => ({
      ...f,
      permissions: f.permissions.includes(perm)
        ? f.permissions.filter(p => p !== perm)
        : [...f.permissions, perm],
    }));
  }

  function toggleModule(modulePerms: string[]) {
    const allSelected = modulePerms.every(p => form.permissions.includes(p));
    if (allSelected) {
      setForm(f => ({ ...f, permissions: f.permissions.filter(p => !modulePerms.includes(p)) }));
    } else {
      setForm(f => ({ ...f, permissions: [...new Set([...f.permissions, ...modulePerms])] }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editingRole) {
      const res = await fetch(`/api/roles/${editingRole.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast.success("Papel atualizado!");
        resetForm();
        load();
      } else {
        const data = await res.json();
        toast.error(data.error || "Erro ao atualizar");
      }
    } else {
      const res = await fetch("/api/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast.success("Papel criado!");
        resetForm();
        load();
      } else {
        const data = await res.json();
        toast.error(data.error || "Erro ao criar");
      }
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja excluir este papel?")) return;
    const res = await fetch(`/api/roles/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Papel removido!");
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
          <h1 className="text-2xl font-bold">Gerenciar Papéis</h1>
          <p className="text-muted-foreground text-sm">Configure papéis e permissões granulares para sua equipe</p>
        </div>

        <div className="flex justify-end">
          <Button onClick={() => { resetForm(); setShowForm(true); }}>
            <Plus className="w-4 h-4 mr-2" /> Novo Papel
          </Button>
        </div>

        {/* Role Form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="p-4 rounded-lg border border-border bg-card space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{editingRole ? "Editar Papel" : "Novo Papel"}</h2>
              <Button type="button" variant="ghost" size="sm" onClick={resetForm}><X className="w-4 h-4" /></Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Nome</label>
                <input
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  required
                  disabled={editingRole?.isSystem}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Descrição</label>
                <input
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  disabled={editingRole?.isSystem}
                />
              </div>
            </div>

            {/* Permission Picker */}
            {!editingRole?.isSystem && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Permissões ({form.permissions.length} selecionadas)</label>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => {
                      const all = PERMISSION_MODULES.flatMap(m => m.permissions.map(p => p.key));
                      setForm(f => ({ ...f, permissions: all }));
                    }}>Selecionar Todas</Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => setForm(f => ({ ...f, permissions: [] }))}>Limpar</Button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {PERMISSION_MODULES.map(mod => {
                    const modPerms = mod.permissions.map(p => p.key);
                    const allSelected = modPerms.every(p => form.permissions.includes(p));
                    const someSelected = modPerms.some(p => form.permissions.includes(p));
                    return (
                      <div key={mod.module} className="rounded-lg border border-border p-3 space-y-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={allSelected}
                            ref={el => { if (el) el.indeterminate = someSelected && !allSelected; }}
                            onChange={() => toggleModule(modPerms)}
                            className="rounded"
                          />
                          <span className="text-sm font-semibold">{mod.label}</span>
                        </label>
                        <div className="space-y-1 ml-5">
                          {mod.permissions.map(perm => (
                            <label key={perm.key} className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={form.permissions.includes(perm.key)}
                                onChange={() => togglePermission(perm.key)}
                                className="rounded"
                              />
                              <span className="text-xs text-muted-foreground">{perm.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {editingRole?.isSystem && (
              <p className="text-sm text-amber-500">Papéis do sistema não podem ser editados.</p>
            )}

            <div className="flex gap-2">
              {!editingRole?.isSystem && <Button type="submit">{editingRole ? "Salvar" : "Criar Papel"}</Button>}
              <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>
            </div>
          </form>
        )}

        {/* Permission Preview Modal */}
        {previewRole && (
          <div className="p-4 rounded-lg border border-border bg-card space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Permissões: {previewRole.name}</h2>
              <Button variant="ghost" size="sm" onClick={() => setPreviewRole(null)}><X className="w-4 h-4" /></Button>
            </div>
            <p className="text-sm text-muted-foreground">{previewRole.description}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {PERMISSION_MODULES.map(mod => {
                const modPerms = mod.permissions.filter(p => previewRole.permissions.includes(p.key));
                if (modPerms.length === 0) return null;
                return (
                  <div key={mod.module} className="rounded-lg border border-border p-3 space-y-1">
                    <span className="text-sm font-semibold">{mod.label}</span>
                    <div className="space-y-0.5 ml-2">
                      {mod.permissions.map(perm => (
                        <div key={perm.key} className="flex items-center gap-1.5">
                          {previewRole.permissions.includes(perm.key)
                            ? <Check className="w-3 h-3 text-emerald-500" />
                            : <X className="w-3 h-3 text-red-400" />}
                          <span className="text-xs text-muted-foreground">{perm.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Roles List */}
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left p-3 text-sm font-medium">Papel</th>
                <th className="text-left p-3 text-sm font-medium">Descrição</th>
                <th className="text-center p-3 text-sm font-medium">Permissões</th>
                <th className="text-center p-3 text-sm font-medium">Usuários</th>
                <th className="text-center p-3 text-sm font-medium">Tipo</th>
                <th className="text-right p-3 text-sm font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {roles.map(role => (
                <tr key={role.id} className="border-t border-border">
                  <td className="p-3 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{role.name}</span>
                  </td>
                  <td className="p-3 text-muted-foreground text-sm">{role.description}</td>
                  <td className="p-3 text-center text-sm">{role.permissions.length}</td>
                  <td className="p-3 text-center text-sm">{role._count.users}</td>
                  <td className="p-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${role.isSystem ? "bg-blue-500/20 text-blue-400" : "bg-green-500/20 text-green-400"}`}>
                      {role.isSystem ? "Sistema" : "Custom"}
                    </span>
                  </td>
                  <td className="p-3 text-right space-x-1">
                    <Button variant="ghost" size="sm" onClick={() => setPreviewRole(role)} title="Ver permissões">
                      <Eye className="w-4 h-4" />
                    </Button>
                    {!role.isSystem && (
                      <>
                        <Button variant="ghost" size="sm" onClick={() => startEdit(role)} title="Editar">
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(role.id)} title="Excluir">
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </Button>
                      </>
                    )}
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
