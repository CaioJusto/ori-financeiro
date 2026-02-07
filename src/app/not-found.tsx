"use client";
import { Button } from "@/components/ui/button";
import { FileQuestion, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="p-4 rounded-full bg-muted mb-6">
        <FileQuestion className="h-12 w-12 text-muted-foreground" />
      </div>
      <h1 className="text-2xl font-bold mb-2">Página não encontrada</h1>
      <p className="text-muted-foreground mb-6 max-w-md">
        A página que você procura não existe ou foi movida.
      </p>
      <Button onClick={() => window.location.href = "/"}>
        <Home className="h-4 w-4 mr-2" />Voltar ao início
      </Button>
    </div>
  );
}
