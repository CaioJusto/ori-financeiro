"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageWrapper, AnimatedItem } from "@/components/page-wrapper";
import { Keyboard } from "lucide-react";
import { shortcutGroups } from "@/components/keyboard-shortcuts-overlay";

export default function ShortcutsPage() {
  return (
    <PageWrapper>
      <AnimatedItem>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-primary/10"><Keyboard className="h-6 w-6 text-primary" /></div>
          <div>
            <h1 className="text-2xl font-bold">Atalhos de Teclado</h1>
            <p className="text-sm text-muted-foreground">Navegue mais rápido usando o teclado. Pressione <kbd className="px-1.5 py-0.5 text-xs bg-muted border rounded">?</kbd> em qualquer página para ver esta lista.</p>
          </div>
        </div>
      </AnimatedItem>
      <div className="grid gap-4 md:grid-cols-2">
        {shortcutGroups.map((group) => (
          <AnimatedItem key={group.title}>
            <Card>
              <CardHeader><CardTitle className="text-base">{group.title}</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {group.shortcuts.map((s, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm">{s.description}</span>
                    <div className="flex gap-1 items-center">
                      {s.keys.map((key, j) => (
                        <span key={j} className="flex items-center">
                          {j > 0 && <span className="text-muted-foreground text-xs mx-0.5">+</span>}
                          <kbd className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 text-xs font-medium bg-muted border rounded">{key}</kbd>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </AnimatedItem>
        ))}
      </div>
    </PageWrapper>
  );
}
