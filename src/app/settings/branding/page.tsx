"use client";
import { useState, useEffect } from "react";
import { PageWrapper } from "@/components/page-wrapper";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Palette } from "lucide-react";

type TenantBranding = {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logoUrl: string | null;
  systemName: string;
  favicon: string | null;
};

export default function BrandingPage() {
  const [form, setForm] = useState<TenantBranding>({
    primaryColor: "#7c3aed",
    secondaryColor: "#6d28d9",
    accentColor: "#8b5cf6",
    logoUrl: null,
    systemName: "Ori Financeiro",
    favicon: null,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/tenant").then(r => r.json()).then(data => {
      if (data && !data.error) {
        setForm({
          primaryColor: data.primaryColor || "#7c3aed",
          secondaryColor: data.secondaryColor || "#6d28d9",
          accentColor: data.accentColor || "#8b5cf6",
          logoUrl: data.logoUrl || null,
          systemName: data.systemName || "Ori Financeiro",
          favicon: data.favicon || null,
        });
      }
    });
  }, []);

  async function handleSave() {
    setSaving(true);
    const res = await fetch("/api/tenant", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) {
      toast.success("Branding atualizado! Recarregando...");
      setTimeout(() => window.location.reload(), 1000);
    } else {
      toast.error("Erro ao salvar");
    }
  }

  return (
    <PageWrapper>
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Branding</h1>
          <p className="text-muted-foreground text-sm">Personalize a aparência do seu sistema</p>
        </div>
        <div className="p-6 rounded-lg border border-border bg-card space-y-6">
          <div>
            <label className="text-sm font-medium">Nome do Sistema</label>
            <input
              className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background"
              value={form.systemName}
              onChange={e => setForm({ ...form, systemName: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium flex items-center gap-2">
                <Palette className="w-4 h-4" /> Cor Primária
              </label>
              <div className="flex items-center gap-2 mt-1">
                <input type="color" value={form.primaryColor} onChange={e => setForm({ ...form, primaryColor: e.target.value })} className="w-10 h-10 rounded cursor-pointer" />
                <input className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm" value={form.primaryColor} onChange={e => setForm({ ...form, primaryColor: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Cor Secundária</label>
              <div className="flex items-center gap-2 mt-1">
                <input type="color" value={form.secondaryColor} onChange={e => setForm({ ...form, secondaryColor: e.target.value })} className="w-10 h-10 rounded cursor-pointer" />
                <input className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm" value={form.secondaryColor} onChange={e => setForm({ ...form, secondaryColor: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Cor de Destaque</label>
              <div className="flex items-center gap-2 mt-1">
                <input type="color" value={form.accentColor} onChange={e => setForm({ ...form, accentColor: e.target.value })} className="w-10 h-10 rounded cursor-pointer" />
                <input className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm" value={form.accentColor} onChange={e => setForm({ ...form, accentColor: e.target.value })} />
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">URL do Logo</label>
            <input
              className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background"
              value={form.logoUrl || ""}
              onChange={e => setForm({ ...form, logoUrl: e.target.value || null })}
              placeholder="https://example.com/logo.png"
            />
          </div>

          <div>
            <label className="text-sm font-medium">URL do Favicon</label>
            <input
              className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background"
              value={form.favicon || ""}
              onChange={e => setForm({ ...form, favicon: e.target.value || null })}
              placeholder="https://example.com/favicon.ico"
            />
          </div>

          {/* Preview */}
          <div className="p-4 rounded-lg border border-border">
            <p className="text-sm text-muted-foreground mb-2">Prévia</p>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold" style={{ backgroundColor: form.primaryColor }}>
                {form.systemName.charAt(0)}
              </div>
              <span className="font-semibold">{form.systemName}</span>
            </div>
            <div className="flex gap-2 mt-3">
              <div className="w-16 h-8 rounded" style={{ backgroundColor: form.primaryColor }} />
              <div className="w-16 h-8 rounded" style={{ backgroundColor: form.secondaryColor }} />
              <div className="w-16 h-8 rounded" style={{ backgroundColor: form.accentColor }} />
            </div>
          </div>

          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Salvando..." : "Salvar Branding"}
          </Button>
        </div>
      </div>
    </PageWrapper>
  );
}
