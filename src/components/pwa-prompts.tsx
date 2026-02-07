"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, WifiOff, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaPrompts() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstall, setShowInstall] = useState(false);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      setShowInstall(true);
    };
    window.addEventListener("beforeinstallprompt", handler);

    const goOffline = () => setOffline(true);
    const goOnline = () => setOffline(false);
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    setOffline(!navigator.onLine);

    // Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") setShowInstall(false);
    setInstallPrompt(null);
  };

  return (
    <>
      {showInstall && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 bg-primary text-primary-foreground p-4 rounded-lg shadow-lg flex items-center gap-3">
          <Download className="h-5 w-5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-sm">Adicionar à tela inicial</p>
            <p className="text-xs opacity-80">Acesse o Ori Financeiro como um app</p>
          </div>
          <Button size="sm" variant="secondary" onClick={handleInstall}>Instalar</Button>
          <button onClick={() => setShowInstall(false)} className="opacity-70 hover:opacity-100"><X className="h-4 w-4" /></button>
        </div>
      )}
      {offline && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-yellow-900 text-center py-1 text-sm flex items-center justify-center gap-2">
          <WifiOff className="h-4 w-4" />
          <span>Você está offline — alguns recursos podem não estar disponíveis</span>
        </div>
      )}
    </>
  );
}
