"use client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

const AUTH_ROUTES = ["/login", "/register", "/forgot-password", "/reset-password"];
import { Button } from "@/components/ui/button";
import { Wallet, ArrowLeftRight, LayoutDashboard, Sparkles } from "lucide-react";

const steps = [
  {
    icon: Sparkles,
    title: "Bem-vindo ao Ori Financeiro!",
    description: "Seu sistema completo de gestão financeira pessoal. Vamos te mostrar como começar.",
    color: "hsl(256, 77%, 60%)",
  },
  {
    icon: Wallet,
    title: "Crie suas Contas",
    description: "Comece adicionando suas contas bancárias, carteiras e cartões. Isso permite rastrear onde seu dinheiro está.",
    color: "hsl(142, 71%, 45%)",
  },
  {
    icon: ArrowLeftRight,
    title: "Registre Transações",
    description: "Adicione suas receitas e despesas. Categorize cada uma para manter tudo organizado.",
    color: "hsl(217, 91%, 50%)",
  },
  {
    icon: LayoutDashboard,
    title: "Acompanhe no Dashboard",
    description: "Visualize gráficos, relatórios e metas. Tenha total controle das suas finanças!",
    color: "hsl(0, 84%, 60%)",
  },
];

export function Onboarding() {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    if (AUTH_ROUTES.some(r => pathname?.startsWith(r))) { setShow(false); return; }
    if (typeof window !== "undefined") {
      const completed = localStorage.getItem("onboarding_completed");
      if (!completed) setShow(true);
    }
  }, [pathname]);

  const finish = () => {
    localStorage.setItem("onboarding_completed", "true");
    setShow(false);
  };

  const next = () => {
    if (step < steps.length - 1) setStep(step + 1);
    else finish();
  };

  if (!show) return null;

  const current = steps[step];
  const Icon = current.icon;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) finish(); }}
    >
      <div className="bg-background border rounded-xl shadow-2xl max-w-md w-full mx-4 p-8">
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${current.color}20` }}>
            <Icon className="h-8 w-8" style={{ color: current.color }} />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-semibold">{current.title}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{current.description}</p>
          </div>

          {/* Step indicators */}
          <div className="flex gap-2">
            {steps.map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all ${i === step ? "w-8 bg-primary" : "w-1.5 bg-muted"}`} />
            ))}
          </div>

          <div className="flex gap-3 w-full">
            <Button variant="ghost" size="sm" onClick={finish} className="flex-1">Pular</Button>
            <Button size="sm" onClick={next} className="flex-1">
              {step < steps.length - 1 ? "Próximo" : "Começar!"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
