"use client";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="p-4 rounded-full bg-destructive/10 mb-6">
        <AlertTriangle className="h-12 w-12 text-destructive" />
      </div>
      <h1 className="text-2xl font-bold mb-2">Algo deu errado</h1>
      <p className="text-muted-foreground mb-6 max-w-md">
        Ocorreu um erro inesperado. Tente novamente ou volte para a página inicial.
      </p>
      <div className="flex gap-3">
        <Button variant="outline" onClick={reset}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Tentar novamente
        </Button>
        <Button onClick={() => window.location.href = "/"}>
          <Home className="h-4 w-4 mr-2" />Página inicial
        </Button>
      </div>
      {error.digest && (
        <p className="text-xs text-muted-foreground mt-4">Código do erro: {error.digest}</p>
      )}
    </div>
  );
}
