"use client";
import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageWrapper, AnimatedItem } from "@/components/page-wrapper";
import { Palette, Check, Upload, Sun, Moon, Monitor, Image, Type, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { useBranding, BrandingData } from "@/components/branding-provider";
import { useTheme } from "next-themes";

const PRESETS = [
  { id: "violet", name: "Padrão (Roxo)", primary: "#7c3aed", secondary: "#6d28d9", accent: "#8b5cf6" },
  { id: "emerald", name: "Emerald", primary: "#22c55e", secondary: "#16a34a", accent: "#4ade80" },
  { id: "blue", name: "Blue", primary: "#3b82f6", secondary: "#2563eb", accent: "#60a5fa" },
  { id: "orange", name: "Orange", primary: "#f97316", secondary: "#ea580c", accent: "#fb923c" },
  { id: "rose", name: "Rose", primary: "#f43f5e", secondary: "#e11d48", accent: "#fb7185" },
  { id: "zinc", name: "Zinc", primary: "#52525b", secondary: "#3f3f46", accent: "#71717a" },
];

type FormData = {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  sidebarColor: string;
  themeMode: string;
  systemName: string;
  logoBase64: string | null;
  faviconBase64: string | null;
};

function ColorPicker({ label, value, onChange, icon }: { label: string; value: string; onChange: (v: string) => void; icon?: React.ReactNode }) {
  return (
    <div>
      <Label className="text-sm font-medium flex items-center gap-1.5 mb-1.5">
        {icon}
        {label}
      </Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value || "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="w-10 h-10 rounded-lg cursor-pointer border border-border"
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          className="font-mono text-sm flex-1"
        />
      </div>
    </div>
  );
}

export default function ThemeSettingsPage() {
  const { branding, refresh } = useBranding();
  const { theme, setTheme } = useTheme();
  const [saving, setSaving] = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<FormData>({
    primaryColor: "#7c3aed",
    secondaryColor: "#6d28d9",
    accentColor: "#8b5cf6",
    backgroundColor: "",
    textColor: "",
    sidebarColor: "",
    themeMode: "system",
    systemName: "Ori Financeiro",
    logoBase64: null,
    faviconBase64: null,
  });

  useEffect(() => {
    fetch("/api/tenant").then(r => r.json()).then(data => {
      if (data && !data.error) {
        setForm({
          primaryColor: data.primaryColor || "#7c3aed",
          secondaryColor: data.secondaryColor || "#6d28d9",
          accentColor: data.accentColor || "#8b5cf6",
          backgroundColor: data.backgroundColor || "",
          textColor: data.textColor || "",
          sidebarColor: data.sidebarColor || "",
          themeMode: data.themeMode || "system",
          systemName: data.systemName || "Ori Financeiro",
          logoBase64: data.logoBase64 || null,
          faviconBase64: data.faviconBase64 || null,
        });
        // Detect active preset
        const preset = PRESETS.find(p => p.primary === data.primaryColor);
        if (preset) setActivePreset(preset.id);
      }
    }).catch(() => {});
  }, []);

  const updateForm = (updates: Partial<FormData>) => {
    setForm(prev => ({ ...prev, ...updates }));
    // Live preview: apply CSS vars immediately
    if (updates.primaryColor || updates.secondaryColor || updates.accentColor ||
        updates.backgroundColor || updates.textColor || updates.sidebarColor) {
      requestAnimationFrame(() => {
        const root = document.documentElement;
        const next = { ...form, ...updates };
        if (next.primaryColor) {
          const hsl = hexToHSL(next.primaryColor);
          root.style.setProperty("--primary", hsl);
          root.style.setProperty("--ring", hsl);
          root.style.setProperty("--sidebar-accent", hsl);
          root.style.setProperty("--accent", hsl);
        }
        if (next.secondaryColor) {
          root.style.setProperty("--secondary", hexToHSL(next.secondaryColor));
        }
        if (next.backgroundColor) {
          root.style.setProperty("--background", hexToHSL(next.backgroundColor));
        }
        if (next.textColor) {
          const hsl = hexToHSL(next.textColor);
          root.style.setProperty("--foreground", hsl);
          root.style.setProperty("--card-foreground", hsl);
        }
        if (next.sidebarColor) {
          root.style.setProperty("--sidebar", hexToHSL(next.sidebarColor));
        }
      });
    }
    if (updates.themeMode) {
      setTheme(updates.themeMode);
    }
  };

  const applyPreset = (preset: typeof PRESETS[0]) => {
    setActivePreset(preset.id);
    updateForm({
      primaryColor: preset.primary,
      secondaryColor: preset.secondary,
      accentColor: preset.accent,
    });
  };

  const handleFileUpload = (field: "logoBase64" | "faviconBase64") => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Arquivo muito grande (máx 2MB)");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      updateForm({ [field]: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const resetToDefault = () => {
    const defaults: FormData = {
      primaryColor: "#7c3aed",
      secondaryColor: "#6d28d9",
      accentColor: "#8b5cf6",
      backgroundColor: "",
      textColor: "",
      sidebarColor: "",
      themeMode: "system",
      systemName: "Ori Financeiro",
      logoBase64: null,
      faviconBase64: null,
    };
    setForm(defaults);
    setActivePreset("violet");
    // Reset CSS vars
    const root = document.documentElement;
    const props = ["--primary", "--ring", "--sidebar-accent", "--accent", "--secondary", "--background", "--foreground", "--card-foreground", "--sidebar", "--sidebar-border", "--card", "--popover", "--popover-foreground"];
    props.forEach(p => root.style.removeProperty(p));
  };

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/tenant", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast.success("Tema salvo com sucesso!");
        refresh();
      } else {
        toast.error("Erro ao salvar tema");
      }
    } catch {
      toast.error("Erro ao salvar tema");
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageWrapper>
      <AnimatedItem>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Palette className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Personalização do Tema</h1>
              <p className="text-muted-foreground text-sm">Configure cores, logo e identidade visual do seu sistema</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={resetToDefault}>
              <RotateCcw className="h-4 w-4 mr-1" /> Restaurar Padrão
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </div>
      </AnimatedItem>

      {/* Presets */}
      <AnimatedItem>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Presets de Cor</CardTitle>
            <CardDescription>Escolha um tema pré-definido como ponto de partida</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => applyPreset(preset)}
                  className={`relative p-3 rounded-lg border-2 transition-all text-left ${
                    activePreset === preset.id
                      ? "border-primary ring-2 ring-primary/20"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  {activePreset === preset.id && (
                    <div className="absolute top-1.5 right-1.5 bg-primary text-primary-foreground rounded-full p-0.5">
                      <Check className="h-3 w-3" />
                    </div>
                  )}
                  <div className="flex gap-1.5 mb-2">
                    <div className="w-6 h-6 rounded-full" style={{ backgroundColor: preset.primary }} />
                    <div className="w-6 h-6 rounded-full" style={{ backgroundColor: preset.secondary }} />
                    <div className="w-6 h-6 rounded-full" style={{ backgroundColor: preset.accent }} />
                  </div>
                  <div className="text-xs font-medium">{preset.name}</div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </AnimatedItem>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Colors */}
        <AnimatedItem>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Cores</CardTitle>
              <CardDescription>Personalize as cores do sistema — preview em tempo real</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ColorPicker label="Cor Primária" value={form.primaryColor} onChange={v => { updateForm({ primaryColor: v }); setActivePreset(null); }} />
              <ColorPicker label="Cor Secundária / Acento" value={form.secondaryColor} onChange={v => updateForm({ secondaryColor: v })} />
              <ColorPicker label="Cor de Destaque" value={form.accentColor} onChange={v => updateForm({ accentColor: v })} />
              <ColorPicker label="Cor de Fundo (background)" value={form.backgroundColor} onChange={v => updateForm({ backgroundColor: v })} />
              <ColorPicker label="Cor do Texto" value={form.textColor} onChange={v => updateForm({ textColor: v })} />
              <ColorPicker label="Cor da Sidebar" value={form.sidebarColor} onChange={v => updateForm({ sidebarColor: v })} />
            </CardContent>
          </Card>
        </AnimatedItem>

        {/* Mode + Identity */}
        <div className="space-y-6">
          <AnimatedItem>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Modo do Tema</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: "light", label: "Claro", icon: Sun },
                    { id: "dark", label: "Escuro", icon: Moon },
                    { id: "system", label: "Sistema", icon: Monitor },
                  ].map(mode => (
                    <button
                      key={mode.id}
                      onClick={() => updateForm({ themeMode: mode.id })}
                      className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                        form.themeMode === mode.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <mode.icon className="h-5 w-5" />
                      <span className="text-sm font-medium">{mode.label}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </AnimatedItem>

          <AnimatedItem>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"><Type className="h-5 w-5" /> Identidade</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Nome do Sistema</Label>
                  <Input
                    value={form.systemName}
                    onChange={e => updateForm({ systemName: e.target.value })}
                    placeholder="Ori Financeiro"
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Aparece na sidebar e título da página</p>
                </div>
              </CardContent>
            </Card>
          </AnimatedItem>

          <AnimatedItem>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"><Image className="h-5 w-5" /> Logo & Favicon</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Logo */}
                <div>
                  <Label>Logo do Sistema</Label>
                  <p className="text-xs text-muted-foreground mb-2">Exibido no topo da sidebar (máx 2MB, PNG/JPG/SVG)</p>
                  <div className="flex items-center gap-4">
                    {form.logoBase64 ? (
                      <div className="relative">
                        <img src={form.logoBase64} alt="Logo" className="w-16 h-16 object-contain rounded-lg border" />
                        <button
                          onClick={() => updateForm({ logoBase64: null })}
                          className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full text-xs flex items-center justify-center"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-lg border-2 border-dashed border-border flex items-center justify-center text-muted-foreground">
                        <Upload className="h-6 w-6" />
                      </div>
                    )}
                    <div>
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/svg+xml,image/webp"
                        className="hidden"
                        onChange={handleFileUpload("logoBase64")}
                      />
                      <Button variant="outline" size="sm" onClick={() => logoInputRef.current?.click()}>
                        <Upload className="h-4 w-4 mr-1" /> {form.logoBase64 ? "Trocar" : "Upload"}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Favicon */}
                <div>
                  <Label>Favicon</Label>
                  <p className="text-xs text-muted-foreground mb-2">Ícone da aba do navegador (máx 2MB)</p>
                  <div className="flex items-center gap-4">
                    {form.faviconBase64 ? (
                      <div className="relative">
                        <img src={form.faviconBase64} alt="Favicon" className="w-10 h-10 object-contain rounded border" />
                        <button
                          onClick={() => updateForm({ faviconBase64: null })}
                          className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full text-xs flex items-center justify-center"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded border-2 border-dashed border-border flex items-center justify-center text-muted-foreground">
                        <Image className="h-4 w-4" />
                      </div>
                    )}
                    <div>
                      <input
                        ref={faviconInputRef}
                        type="file"
                        accept="image/png,image/x-icon,image/svg+xml"
                        className="hidden"
                        onChange={handleFileUpload("faviconBase64")}
                      />
                      <Button variant="outline" size="sm" onClick={() => faviconInputRef.current?.click()}>
                        <Upload className="h-4 w-4 mr-1" /> {form.faviconBase64 ? "Trocar" : "Upload"}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </AnimatedItem>
        </div>
      </div>

      {/* Live Preview */}
      <AnimatedItem>
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-hidden" style={{ maxWidth: 600 }}>
              {/* Fake sidebar + content */}
              <div className="flex h-48">
                <div className="w-40 p-3 flex flex-col gap-2" style={{ backgroundColor: form.sidebarColor || "hsl(var(--sidebar))" }}>
                  <div className="flex items-center gap-2 mb-2">
                    {form.logoBase64 ? (
                      <img src={form.logoBase64} alt="" className="w-5 h-5 rounded object-contain" />
                    ) : (
                      <div className="w-5 h-5 rounded flex items-center justify-center text-white text-[10px] font-bold" style={{ backgroundColor: form.primaryColor }}>
                        {form.systemName.charAt(0)}
                      </div>
                    )}
                    <span className="text-xs font-semibold truncate">{form.systemName}</span>
                  </div>
                  <div className="h-6 rounded px-2 py-1 flex items-center gap-1.5" style={{ backgroundColor: form.primaryColor + "20" }}>
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: form.primaryColor }} />
                    <div className="h-2 w-12 rounded" style={{ backgroundColor: form.primaryColor, opacity: 0.5 }} />
                  </div>
                  <div className="h-6 rounded px-2 py-1 flex items-center gap-1.5 opacity-50">
                    <div className="w-3 h-3 rounded bg-muted-foreground" />
                    <div className="h-2 w-16 rounded bg-muted-foreground/30" />
                  </div>
                  <div className="h-6 rounded px-2 py-1 flex items-center gap-1.5 opacity-50">
                    <div className="w-3 h-3 rounded bg-muted-foreground" />
                    <div className="h-2 w-10 rounded bg-muted-foreground/30" />
                  </div>
                </div>
                <div className="flex-1 p-4" style={{ backgroundColor: form.backgroundColor || undefined }}>
                  <div className="h-3 w-24 rounded mb-3" style={{ backgroundColor: form.textColor || "hsl(var(--foreground))", opacity: 0.7 }} />
                  <div className="flex gap-2 mb-3">
                    <div className="px-3 py-1.5 rounded text-xs text-white font-medium" style={{ backgroundColor: form.primaryColor }}>
                      Botão
                    </div>
                    <div className="px-3 py-1.5 rounded text-xs border" style={{ borderColor: form.primaryColor, color: form.primaryColor }}>
                      Outline
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 rounded border">
                      <div className="h-2 w-8 rounded mb-1" style={{ backgroundColor: form.primaryColor }} />
                      <div className="h-2 w-16 rounded bg-muted-foreground/20" />
                    </div>
                    <div className="p-2 rounded border">
                      <div className="h-2 w-8 rounded mb-1" style={{ backgroundColor: form.accentColor }} />
                      <div className="h-2 w-12 rounded bg-muted-foreground/20" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </AnimatedItem>
    </PageWrapper>
  );
}

function hexToHSL(hex: string): string {
  if (!hex || !hex.startsWith("#")) return "0 0% 0%";
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}
