"use client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

const AUTH_ROUTES = ["/login", "/register", "/forgot-password", "/reset-password"];
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, ArrowLeftRight, LayoutDashboard, Sparkles, Target, PiggyBank, Navigation } from "lucide-react";

const tourSteps = [
  {
    icon: Sparkles,
    title: "Bem-vindo ao Ori Financeiro!",
    description: "Seu sistema completo de gestão financeira. Vamos te mostrar os principais recursos em poucos passos.",
    color: "hsl(256, 77%, 60%)",
  },
  {
    icon: Navigation,
    title: "Navegação Lateral",
    description: "Use o menu lateral para acessar todas as funcionalidades. No mobile, toque no ícone do menu. Você também pode usar Ctrl+K para busca rápida.",
    color: "hsl(217, 91%, 50%)",
  },
  {
    icon: Wallet,
    title: "Crie suas Contas",
    description: "Comece adicionando suas contas bancárias, carteiras e cartões em 'Contas'. Isso permite rastrear onde seu dinheiro está.",
    color: "hsl(142, 71%, 45%)",
  },
  {
    icon: ArrowLeftRight,
    title: "Registre Transações",
    description: "Adicione suas receitas e despesas em 'Transações'. Categorize cada uma para manter tudo organizado. Use atalho 'N' para criar rápido.",
    color: "hsl(200, 80%, 50%)",
  },
  {
    icon: LayoutDashboard,
    title: "Acompanhe no Dashboard",
    description: "O Dashboard mostra gráficos, saldos e insights. Personalize os widgets arrastando e reorganizando conforme preferir.",
    color: "hsl(30, 90%, 55%)",
  },
  {
    icon: Target,
    title: "Defina Orçamentos",
    description: "Em 'Orçamentos', defina limites mensais por categoria. Receba alertas quando estiver perto de estourar o limite.",
    color: "hsl(0, 84%, 60%)",
  },
  {
    icon: PiggyBank,
    title: "Crie Metas Financeiras",
    description: "Em 'Metas', estabeleça objetivos de economia com prazos. Faça depósitos e acompanhe o progresso com gráficos.",
    color: "hsl(280, 70%, 55%)",
  },
];

export function ProductTour() {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    if (AUTH_ROUTES.some(r => pathname?.startsWith(r))) { setShow(false); return; }
    if (typeof window !== "undefined") {
      const completed = localStorage.getItem("product_tour_completed");
      const onboardingDone = localStorage.getItem("onboarding_completed");
      // Show tour only if onboarding is done but tour is not
      if (onboardingDone && !completed) {
        // Small delay so the page loads first
        const t = setTimeout(() => setShow(true), 1500);
        return () => clearTimeout(t);
      }
    }
  }, []);

  const finish = () => {
    localStorage.setItem("product_tour_completed", "true");
    setShow(false);
  };

  const next = () => {
    if (step < tourSteps.length - 1) setStep(step + 1);
    else finish();
  };

  const prev = () => {
    if (step > 0) setStep(step - 1);
  };

  if (!show) return null;

  const current = tourSteps[step];
  const Icon = current.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[99] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      >
        <motion.div
          key={step}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="bg-background border rounded-xl shadow-2xl max-w-md w-full mx-4 p-8"
        >
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${current.color}20` }}>
              <Icon className="h-8 w-8" style={{ color: current.color }} />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">{current.title}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{current.description}</p>
            </div>
            <div className="flex gap-2">
              {tourSteps.map((_, i) => (
                <div key={i} className={`h-1.5 rounded-full transition-all ${i === step ? "w-8 bg-primary" : i < step ? "w-1.5 bg-primary/40" : "w-1.5 bg-muted"}`} />
              ))}
            </div>
            <div className="text-xs text-muted-foreground">{step + 1} de {tourSteps.length}</div>
            <div className="flex gap-3 w-full">
              <Button variant="ghost" size="sm" onClick={finish} className="flex-shrink-0">Pular tour</Button>
              <div className="flex-1" />
              {step > 0 && <Button variant="outline" size="sm" onClick={prev}>Anterior</Button>}
              <Button size="sm" onClick={next}>
                {step < tourSteps.length - 1 ? "Próximo" : "Começar! 🚀"}
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Export function to restart tour from settings
export function restartProductTour() {
  localStorage.removeItem("product_tour_completed");
  window.location.reload();
}
