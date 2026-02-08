"use client";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import {
  BarChart3, Shield, Users, Zap, CreditCard, TrendingUp, Globe, Smartphone,
  Moon, Sun, Check, ArrowRight, Star, ChevronRight,
} from "lucide-react";

function useInView(ref: React.RefObject<HTMLElement | null>) {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) setInView(true); }, { threshold: 0.1 });
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [ref]);
  return inView;
}

function AnimatedSection({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref);
  return (
    <div ref={ref} className={`transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} ${className}`}>
      {children}
    </div>
  );
}

const features = [
  { icon: BarChart3, title: "Dashboard Completo", desc: "Visão 360° das suas finanças com gráficos interativos e indicadores em tempo real." },
  { icon: Shield, title: "Multi-tenant Seguro", desc: "Cada empresa tem seus dados isolados com controle de acesso granular por papéis." },
  { icon: Users, title: "Gestão de Equipe", desc: "Adicione colaboradores com diferentes níveis de permissão e aprovações." },
  { icon: CreditCard, title: "Cartões & Contas", desc: "Gerencie múltiplas contas, cartões de crédito, investimentos e empréstimos." },
  { icon: TrendingUp, title: "Projeções & IA", desc: "Projeções financeiras inteligentes, simulador de cenários e insights automáticos." },
  { icon: Globe, title: "Multi-moeda", desc: "Suporte a BRL, USD, EUR com conversão automática e cotações atualizadas." },
  { icon: Smartphone, title: "PWA Responsivo", desc: "Acesse de qualquer dispositivo. Instale como app no celular ou desktop." },
  { icon: Zap, title: "API & MCP", desc: "Integre com qualquer sistema via API REST e protocolo MCP para agentes IA." },
];

const plans = [
  { name: "Free", price: "Grátis", features: ["1 usuário", "2 contas", "100 transações/mês", "Dashboard básico"], cta: "Começar Grátis" },
  { name: "Starter", price: "R$ 29", period: "/mês", features: ["3 usuários", "10 contas", "Transações ilimitadas", "Relatórios avançados", "Suporte email"], cta: "Iniciar Trial", popular: false },
  { name: "Pro", price: "R$ 79", period: "/mês", features: ["10 usuários", "Contas ilimitadas", "API access", "MCP Server", "Importação OFX", "Divisão de despesas"], cta: "Escolher Pro", popular: true },
  { name: "Enterprise", price: "R$ 199", period: "/mês", features: ["Usuários ilimitados", "Tudo do Pro", "Suporte prioritário", "Branding customizado", "SLA garantido", "Onboarding dedicado"], cta: "Falar com Vendas" },
];

const testimonials = [
  { name: "Maria Silva", role: "CEO, TechStart", text: "O Ori transformou nossa gestão financeira. Agora temos visibilidade total de receitas e despesas.", avatar: "MS" },
  { name: "João Santos", role: "Freelancer", text: "Finalmente um sistema que entende as necessidades de quem trabalha por conta própria no Brasil.", avatar: "JS" },
  { name: "Ana Costa", role: "CFO, GrowthCo", text: "A integração via API e o MCP Server foram diferenciais na nossa escolha. Excelente produto.", avatar: "AC" },
];

export default function LandingPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link href="/landing" className="flex items-center gap-2 text-lg font-bold">
            <span className="text-2xl">💰</span> Ori Financeiro
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm">
            <a href="#features" className="hover:text-primary transition-colors">Recursos</a>
            <a href="#pricing" className="hover:text-primary transition-colors">Preços</a>
            <a href="#testimonials" className="hover:text-primary transition-colors">Depoimentos</a>
          </div>
          <div className="flex items-center gap-3">
            {mounted && (
              <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="p-2 rounded-lg hover:bg-muted transition-colors">
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
            )}
            <Link href="/login" className="text-sm hover:text-primary transition-colors">Entrar</Link>
            <Link href="/register" className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
              Criar Conta
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <AnimatedSection>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <Star className="h-3 w-3" /> Gestão financeira inteligente para empresas brasileiras
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
              Controle total das suas{" "}
              <span className="text-primary">finanças</span> em um só lugar
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mt-4">
              Dashboard completo, multi-tenant, multi-moeda, com IA, API e muito mais.
              Ideal para freelancers, startups e empresas em crescimento.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
              <Link href="/register" className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors">
                Começar Grátis <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
              <Link href="/login" className="inline-flex items-center justify-center px-6 py-3 rounded-lg border border-border hover:bg-muted transition-colors">
                Ver Demo <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* App Screenshot placeholder */}
      <section className="pb-20 px-4">
        <AnimatedSection className="max-w-5xl mx-auto">
          <div className="rounded-xl border bg-gradient-to-br from-primary/5 to-primary/10 p-8 md:p-12">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: "Receitas", value: "R$ 85.000", color: "text-green-500" },
                { label: "Despesas", value: "R$ 52.300", color: "text-red-500" },
                { label: "Balanço", value: "R$ 32.700", color: "text-blue-500" },
              ].map((item) => (
                <div key={item.label} className="rounded-lg bg-background/80 p-4 text-center">
                  <div className="text-sm text-muted-foreground">{item.label}</div>
                  <div className={`text-xl md:text-2xl font-bold ${item.color}`}>{item.value}</div>
                </div>
              ))}
            </div>
            <div className="mt-6 grid grid-cols-3 sm:grid-cols-6 gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded bg-primary/20 h-16 md:h-24" style={{ height: `${40 + Math.random() * 60}%`, minHeight: 40 }} />
              ))}
            </div>
          </div>
        </AnimatedSection>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection className="text-center mb-12">
            <h2 className="text-3xl font-bold">Tudo que você precisa</h2>
            <p className="text-muted-foreground mt-2">Recursos poderosos para uma gestão financeira completa</p>
          </AnimatedSection>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <AnimatedSection key={i}>
                <div className="rounded-xl border bg-background p-6 h-full hover:shadow-lg transition-shadow">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <f.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground">{f.desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection className="text-center mb-12">
            <h2 className="text-3xl font-bold">Planos & Preços</h2>
            <p className="text-muted-foreground mt-2">Escolha o plano ideal para o seu negócio</p>
          </AnimatedSection>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan, i) => (
              <AnimatedSection key={i}>
                <div className={`rounded-xl border bg-background p-6 h-full flex flex-col relative ${plan.popular ? "ring-2 ring-primary" : ""}`}>
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                      Popular
                    </div>
                  )}
                  <h3 className="font-semibold text-lg">{plan.name}</h3>
                  <div className="mt-2 mb-4">
                    <span className="text-3xl font-bold">{plan.price}</span>
                    {plan.period && <span className="text-muted-foreground text-sm">{plan.period}</span>}
                  </div>
                  <ul className="space-y-2 flex-1">
                    {plan.features.map((f, j) => (
                      <li key={j} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0" /> {f}
                      </li>
                    ))}
                  </ul>
                  <Link href="/register" className={`mt-6 block text-center py-2.5 rounded-lg font-medium transition-colors ${plan.popular ? "bg-primary text-primary-foreground hover:bg-primary/90" : "border border-border hover:bg-muted"}`}>
                    {plan.cta}
                  </Link>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 px-4 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <AnimatedSection className="text-center mb-12">
            <h2 className="text-3xl font-bold">O que dizem nossos clientes</h2>
          </AnimatedSection>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <AnimatedSection key={i}>
                <div className="rounded-xl border bg-background p-6">
                  <div className="flex items-center gap-1 mb-3">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Star key={j} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">&ldquo;{t.text}&rdquo;</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">{t.avatar}</div>
                    <div>
                      <div className="font-medium text-sm">{t.name}</div>
                      <div className="text-xs text-muted-foreground">{t.role}</div>
                    </div>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <AnimatedSection className="max-w-3xl mx-auto text-center space-y-6">
          <h2 className="text-3xl font-bold">Pronto para começar?</h2>
          <p className="text-muted-foreground">Crie sua conta gratuita e comece a organizar suas finanças hoje mesmo.</p>
          <Link href="/register" className="inline-flex items-center justify-center px-8 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors text-lg">
            Criar Conta Grátis <ArrowRight className="h-5 w-5 ml-2" />
          </Link>
        </AnimatedSection>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 font-bold mb-3"><span className="text-xl">💰</span> Ori Financeiro</div>
            <p className="text-sm text-muted-foreground">Gestão financeira inteligente para empresas brasileiras.</p>
          </div>
          <div>
            <h4 className="font-medium mb-3">Produto</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#features" className="hover:text-foreground transition-colors">Recursos</a></li>
              <li><a href="#pricing" className="hover:text-foreground transition-colors">Preços</a></li>
              <li><Link href="/login" className="hover:text-foreground transition-colors">Login</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-3">Empresa</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><span className="cursor-default">Sobre</span></li>
              <li><span className="cursor-default">Blog</span></li>
              <li><span className="cursor-default">Contato</span></li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-3">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><span className="cursor-default">Privacidade</span></li>
              <li><span className="cursor-default">Termos de Uso</span></li>
              <li><span className="cursor-default">LGPD</span></li>
            </ul>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Ori Financeiro. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}
