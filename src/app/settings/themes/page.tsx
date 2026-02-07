"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageWrapper, AnimatedItem } from "@/components/page-wrapper";
import { Palette, Check } from "lucide-react";
import { toast } from "sonner";
import { themes, ThemeConfig } from "@/lib/themes";

export default function ThemesPage() {
  const [activeTheme, setActiveTheme] = useState("default");
  const [customPrimary, setCustomPrimary] = useState("#7c3aed");
  const [customSecondary, setCustomSecondary] = useState("#6d28d9");
  const [customAccent, setCustomAccent] = useState("#8b5cf6");
  const [customBg, setCustomBg] = useState("#ffffff");

  useEffect(() => {
    fetch("/api/preferences").then((r) => r.json()).then((p) => {
      if (p.theme) setActiveTheme(p.theme);
      if (p.customTheme) {
        const ct = p.customTheme as ThemeConfig;
        setCustomPrimary(ct.primary || "#7c3aed");
        setCustomSecondary(ct.secondary || "#6d28d9");
        setCustomAccent(ct.accent || "#8b5cf6");
        setCustomBg(ct.background || "#ffffff");
      }
    }).catch(() => {});
  }, []);

  const selectTheme = async (themeId: string) => {
    setActiveTheme(themeId);
    await fetch("/api/preferences", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ theme: themeId }),
    });
    toast.success("Tema aplicado!");
  };

  const saveCustom = async () => {
    const customTheme = { id: "custom", name: "Custom", primary: customPrimary, secondary: customSecondary, accent: customAccent, background: customBg, foreground: "#09090b", card: "#ffffff", muted: "#f4f4f5" };
    setActiveTheme("custom");
    await fetch("/api/preferences", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ theme: "custom", customTheme }),
    });
    toast.success("Tema personalizado salvo!");
  };

  return (
    <PageWrapper>
      <AnimatedItem>
        <div className="flex items-center gap-3 mb-6">
          <Palette className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Temas</h1>
            <p className="text-muted-foreground">Personalize a aparência do seu sistema</p>
          </div>
        </div>
      </AnimatedItem>

      <AnimatedItem>
        <Card>
          <CardHeader><CardTitle>Temas Pré-definidos</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {themes.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => selectTheme(theme.id)}
                  className={`relative p-4 rounded-lg border-2 transition-all text-left ${
                    activeTheme === theme.id ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/50"
                  }`}
                >
                  {activeTheme === theme.id && (
                    <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                      <Check className="h-3 w-3" />
                    </div>
                  )}
                  <div className="flex gap-2 mb-3">
                    <div className="w-8 h-8 rounded-full" style={{ backgroundColor: theme.primary }} />
                    <div className="w-8 h-8 rounded-full" style={{ backgroundColor: theme.secondary }} />
                    <div className="w-8 h-8 rounded-full" style={{ backgroundColor: theme.accent }} />
                  </div>
                  <div className="font-medium text-sm">{theme.name}</div>
                  <div className="mt-2 h-12 rounded" style={{ backgroundColor: theme.background, border: `1px solid ${theme.muted}` }}>
                    <div className="h-2 rounded-t" style={{ backgroundColor: theme.primary }} />
                    <div className="p-1">
                      <div className="h-1 w-3/4 rounded" style={{ backgroundColor: theme.muted }} />
                      <div className="h-1 w-1/2 rounded mt-1" style={{ backgroundColor: theme.muted }} />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </AnimatedItem>

      <AnimatedItem>
        <Card>
          <CardHeader><CardTitle>Tema Personalizado</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label>Primária</Label>
                <div className="flex items-center gap-2 mt-1">
                  <input type="color" value={customPrimary} onChange={(e) => setCustomPrimary(e.target.value)} className="w-10 h-10 rounded cursor-pointer" />
                  <Input value={customPrimary} onChange={(e) => setCustomPrimary(e.target.value)} className="font-mono text-sm" />
                </div>
              </div>
              <div>
                <Label>Secundária</Label>
                <div className="flex items-center gap-2 mt-1">
                  <input type="color" value={customSecondary} onChange={(e) => setCustomSecondary(e.target.value)} className="w-10 h-10 rounded cursor-pointer" />
                  <Input value={customSecondary} onChange={(e) => setCustomSecondary(e.target.value)} className="font-mono text-sm" />
                </div>
              </div>
              <div>
                <Label>Destaque</Label>
                <div className="flex items-center gap-2 mt-1">
                  <input type="color" value={customAccent} onChange={(e) => setCustomAccent(e.target.value)} className="w-10 h-10 rounded cursor-pointer" />
                  <Input value={customAccent} onChange={(e) => setCustomAccent(e.target.value)} className="font-mono text-sm" />
                </div>
              </div>
              <div>
                <Label>Fundo</Label>
                <div className="flex items-center gap-2 mt-1">
                  <input type="color" value={customBg} onChange={(e) => setCustomBg(e.target.value)} className="w-10 h-10 rounded cursor-pointer" />
                  <Input value={customBg} onChange={(e) => setCustomBg(e.target.value)} className="font-mono text-sm" />
                </div>
              </div>
            </div>
            <div className="p-4 rounded-lg border" style={{ backgroundColor: customBg }}>
              <div className="h-3 rounded" style={{ backgroundColor: customPrimary, width: "60%" }} />
              <div className="h-2 rounded mt-2" style={{ backgroundColor: customSecondary, width: "40%" }} />
              <div className="h-2 rounded mt-2" style={{ backgroundColor: customAccent, width: "80%" }} />
            </div>
            <Button onClick={saveCustom}>Salvar Tema Personalizado</Button>
          </CardContent>
        </Card>
      </AnimatedItem>
    </PageWrapper>
  );
}
