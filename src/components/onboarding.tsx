"use client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

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
  const { data: session, status } = useSession();

  useEffect(() => {
    // Don't show on auth routes or while loading
    if (AUTH_ROUTES.some(r => pathname?.startsWith(r))) { setShow(false); return; }
    if (status !== "authenticated") return;

    // Check onboarding status from API (only shows for newly registered users)
    fetch("/api/onboarding")
      .then(r => r.json())
      .then(data => {
        // Only show if not completed AND not skipped
        if (data.completed === false && data.skipped === false) {
          setShow(true);
          // Resume from where they left off
          if (data.completedSteps?.length > 0) {
            setStep(Math.min(data.completedSteps.length, steps.length - 1));
          }
        } else {
          setShow(false);
        }
      })
      .catch(() => {
        // If API fails (e.g., no onboarding record = existing user), don't show
        setShow(false);
      });
  }, [pathname, status]);

  const markStep = (stepName: string) => {
    fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ step: stepName }),
    }).catch(() => {});
  };

  const finish = () => {
    fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ complete: true }),
    }).catch(() => {});
    setShow(false);
  };

  const skip = () => {
    fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skip: true, complete: true }),
    }).catch(() => {});
    setShow(false);
  };

  const next = () => {
    const stepNames = ["welcome", "accounts", "transactions", "dashboard"];
    markStep(stepNames[step] || `step-${step}`);
    if (step < steps.length - 1) setStep(step + 1);
    else finish();
  };

  if (!show) return null;

  const current = steps[step];
  const Icon = current.icon;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) skip(); }}
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
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === step ? "w-6 bg-primary" : i < step ? "w-3 bg-primary/50" : "w-3 bg-muted"
                }`}
              />
            ))}
          </div>

          <div className="flex gap-3 w-full">
            <Button variant="ghost" className="flex-1" onClick={skip}>
              Pular
            </Button>
            <Button className="flex-1" onClick={next}>
              {step < steps.length - 1 ? "Próximo" : "Começar!"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
