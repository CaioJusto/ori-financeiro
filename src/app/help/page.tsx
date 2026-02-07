"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageWrapper, AnimatedItem } from "@/components/page-wrapper";
import { HelpCircle, BookOpen, MessageCircle, Video, ChevronDown, ChevronUp, Search, Send, Rocket, Wallet, ArrowLeftRight, BarChart3, Target, CreditCard, PiggyBank, Receipt, Tag, Settings, Keyboard } from "lucide-react";
import { toast } from "sonner";

const faqs = [
  { q: "Como criar uma conta bancária?", a: "Vá em Contas, clique em 'Nova Conta', preencha o nome, tipo e cor, e salve." },
  { q: "Como registrar uma transação?", a: "Na página de Transações, clique em 'Nova Transação'. Preencha descrição, valor, conta, categoria e data." },
  { q: "Como categorizar transações automaticamente?", a: "Configure Regras Automáticas em Regras Auto. Defina condições de texto para categorização automática." },
  { q: "Como criar um orçamento?", a: "Vá em Orçamentos, clique em 'Novo Orçamento', selecione a categoria e defina o limite mensal." },
  { q: "Como acompanhar metas financeiras?", a: "Na página de Metas, crie uma nova meta com nome, valor alvo e prazo. Faça depósitos para acompanhar o progresso." },
  { q: "Como importar transações de um arquivo?", a: "Vá em Importar, selecione um arquivo CSV ou Excel, mapeie as colunas e confirme a importação." },
  { q: "O que é o Dashboard?", a: "O Dashboard mostra uma visão geral das suas finanças: saldo total, receitas, despesas, gráficos e insights." },
  { q: "Como usar cartões de crédito?", a: "Cadastre seus cartões em Cartões, registre gastos vinculados a eles e acompanhe as faturas." },
  { q: "Como funcionam as transações recorrentes?", a: "Configure recorrências para transações que se repetem (aluguel, salário, etc). O sistema cria automaticamente." },
  { q: "Como exportar relatórios?", a: "Na página de Exportação, escolha o formato (Excel ou PDF), período e tipo de relatório." },
  { q: "Como usar tags?", a: "Tags são etiquetas personalizadas para organizar transações além das categorias. Crie em Tags e vincule às transações." },
  { q: "O que são contas a pagar?", a: "Contas a Pagar rastreia compromissos futuros com datas de vencimento, valores e status de pagamento." },
  { q: "Como usar a paleta de comandos?", a: "Pressione Ctrl+K para abrir a paleta de comandos. Digite para buscar páginas, transações e ações rápidas." },
  { q: "Como configurar alertas?", a: "Em Configurações > Alertas, defina regras para receber notificações sobre gastos, saldos e vencimentos." },
  { q: "O que é o Open Finance?", a: "O Open Finance permite conectar suas contas bancárias para sincronização automática de transações." },
  { q: "Como usar o modo escuro?", a: "Em Configurações > Temas, escolha entre tema claro, escuro ou automático." },
  { q: "Como funcionam as parcelas?", a: "Ao criar uma transação parcelada, o sistema divide automaticamente em parcelas com datas de vencimento." },
  { q: "Como compartilhar relatórios?", a: "Use a função de Compartilhar para gerar links de acesso a relatórios específicos." },
  { q: "Como funciona o multi-tenant?", a: "Cada organização tem seus dados isolados. Gerencie usuários e permissões em Configurações." },
  { q: "Como ver a saúde financeira?", a: "A página Saúde Financeira calcula um score baseado em seus hábitos de gastos, economia e organização." },
  { q: "Como usar atalhos de teclado?", a: "Pressione ? em qualquer página para ver todos os atalhos disponíveis. Veja também a página /shortcuts." },
  { q: "Como fazer backup dos dados?", a: "Em Configurações, use Exportar Dados para criar um backup completo em formato JSON." },
];

const modules = [
  { icon: Wallet, title: "Contas", desc: "Gerencie contas bancárias, carteiras e investimentos. Acompanhe saldos em tempo real." },
  { icon: ArrowLeftRight, title: "Transações", desc: "Registre receitas e despesas. Filtre, busque e organize com categorias e tags." },
  { icon: BarChart3, title: "Relatórios", desc: "Visualize análises de gastos, comparativos mensais e tendências financeiras." },
  { icon: Target, title: "Orçamentos", desc: "Defina limites de gastos por categoria e acompanhe o consumo em tempo real." },
  { icon: PiggyBank, title: "Metas", desc: "Crie objetivos financeiros com prazos e acompanhe o progresso de economia." },
  { icon: CreditCard, title: "Cartões", desc: "Gerencie cartões de crédito, acompanhe faturas e limites disponíveis." },
  { icon: Receipt, title: "Faturas", desc: "Controle faturas a pagar e receber com datas de vencimento e status." },
  { icon: Tag, title: "Categorias e Tags", desc: "Organize transações com categorias hierárquicas e tags personalizadas." },
  { icon: Settings, title: "Configurações", desc: "Personalize o sistema: temas, moedas, notificações, usuários e permissões." },
  { icon: Keyboard, title: "Atalhos", desc: "Navegue rapidamente com atalhos de teclado. Pressione ? para ver todos." },
];

export default function HelpPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [contactForm, setContactForm] = useState({ name: "", email: "", message: "" });

  const filteredFaqs = faqs.filter(
    (f) => f.q.toLowerCase().includes(searchTerm.toLowerCase()) || f.a.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleContact = () => {
    if (!contactForm.name || !contactForm.email || !contactForm.message) {
      toast.error("Preencha todos os campos");
      return;
    }
    toast.success("Mensagem enviada! Responderemos em até 24h.");
    setContactForm({ name: "", email: "", message: "" });
  };

  return (
    <PageWrapper>
      <AnimatedItem>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-primary/10"><HelpCircle className="h-6 w-6 text-primary" /></div>
          <div>
            <h1 className="text-2xl font-bold">Central de Ajuda</h1>
            <p className="text-sm text-muted-foreground">Tudo que você precisa saber sobre o Ori Financeiro</p>
          </div>
        </div>
      </AnimatedItem>

      <Tabs defaultValue="start" className="space-y-4">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="start"><Rocket className="h-4 w-4 mr-1.5" />Começar</TabsTrigger>
          <TabsTrigger value="faq"><HelpCircle className="h-4 w-4 mr-1.5" />FAQ</TabsTrigger>
          <TabsTrigger value="modules"><BookOpen className="h-4 w-4 mr-1.5" />Módulos</TabsTrigger>
          <TabsTrigger value="videos"><Video className="h-4 w-4 mr-1.5" />Vídeos</TabsTrigger>
          <TabsTrigger value="contact"><MessageCircle className="h-4 w-4 mr-1.5" />Contato</TabsTrigger>
        </TabsList>

        <TabsContent value="start">
          <AnimatedItem>
            <Card>
              <CardHeader><CardTitle>🚀 Guia de Início Rápido</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  {[
                    { step: 1, title: "Crie suas contas", desc: "Adicione suas contas bancárias e carteiras para rastrear saldos.", link: "/accounts" },
                    { step: 2, title: "Adicione categorias", desc: "Configure categorias de receita e despesa para organizar transações.", link: "/categories" },
                    { step: 3, title: "Registre transações", desc: "Comece a registrar suas receitas e despesas diárias.", link: "/transactions" },
                    { step: 4, title: "Defina orçamentos", desc: "Crie limites de gastos por categoria para controlar despesas.", link: "/budgets" },
                    { step: 5, title: "Crie metas", desc: "Estabeleça objetivos financeiros e acompanhe o progresso.", link: "/goals" },
                    { step: 6, title: "Explore o dashboard", desc: "Veja gráficos, insights e resumos das suas finanças.", link: "/" },
                  ].map((s) => (
                    <div key={s.step} className="flex gap-4 items-start p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">{s.step}</div>
                      <div>
                        <h3 className="font-semibold">{s.title}</h3>
                        <p className="text-sm text-muted-foreground">{s.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </AnimatedItem>
        </TabsContent>

        <TabsContent value="faq">
          <AnimatedItem>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar perguntas..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" data-search />
            </div>
            <div className="space-y-2">
              {filteredFaqs.map((faq, i) => (
                <Card key={i} className="cursor-pointer" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{faq.q}</span>
                      {openFaq === i ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </div>
                    {openFaq === i && <p className="text-sm text-muted-foreground mt-3 pt-3 border-t">{faq.a}</p>}
                  </CardContent>
                </Card>
              ))}
              {filteredFaqs.length === 0 && <p className="text-center text-muted-foreground py-8">Nenhuma pergunta encontrada.</p>}
            </div>
          </AnimatedItem>
        </TabsContent>

        <TabsContent value="modules">
          <div className="grid gap-4 md:grid-cols-2">
            {modules.map((mod) => (
              <AnimatedItem key={mod.title}>
                <Card>
                  <CardContent className="p-5 flex gap-4 items-start">
                    <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0"><mod.icon className="h-5 w-5 text-primary" /></div>
                    <div>
                      <h3 className="font-semibold mb-1">{mod.title}</h3>
                      <p className="text-sm text-muted-foreground">{mod.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              </AnimatedItem>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="videos">
          <AnimatedItem>
            <div className="grid gap-4 md:grid-cols-2">
              {["Introdução ao Ori Financeiro", "Gerenciando Contas", "Transações e Categorias", "Orçamentos e Metas", "Relatórios e Análises", "Dicas Avançadas"].map((title) => (
                <Card key={title}>
                  <CardContent className="p-5">
                    <div className="aspect-video bg-muted rounded-lg flex items-center justify-center mb-3">
                      <Video className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="font-medium text-sm">{title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">Em breve</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </AnimatedItem>
        </TabsContent>

        <TabsContent value="contact">
          <AnimatedItem>
            <Card className="max-w-lg">
              <CardHeader><CardTitle>Fale Conosco</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div><Label htmlFor="contact-name">Nome</Label><Input id="contact-name" value={contactForm.name} onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })} placeholder="Seu nome" /></div>
                <div><Label htmlFor="contact-email">Email</Label><Input id="contact-email" type="email" value={contactForm.email} onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })} placeholder="seu@email.com" /></div>
                <div><Label htmlFor="contact-message">Mensagem</Label><textarea id="contact-message" className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm" value={contactForm.message} onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })} placeholder="Descreva sua dúvida ou sugestão..." /></div>
                <Button onClick={handleContact}><Send className="h-4 w-4 mr-2" />Enviar mensagem</Button>
              </CardContent>
            </Card>
          </AnimatedItem>
        </TabsContent>
      </Tabs>
    </PageWrapper>
  );
}
