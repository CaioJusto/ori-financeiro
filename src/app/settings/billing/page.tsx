"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PageWrapper, AnimatedItem } from "@/components/page-wrapper";
import { formatCurrency } from "@/lib/utils";
import { CreditCard, Users, Wallet, ArrowRight, Check, Zap, Star, Crown } from "lucide-react";

interface PlanData {
  id: string; name: string; slug: string; price: number; currency: string;
  interval: string; features: string[]; maxUsers: number; maxAccounts: number;
  maxTransactionsPerMonth: number;
}

interface SubscriptionData {
  status: string; plan: PlanData; startDate: string; trialEnd: string | null;
}

interface UsageData {
  users: number; accounts: number; transactionsThisMonth: number;
}

export default function BillingPage() {
  const [plans, setPlans] = useState<PlanData[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [usage, setUsage] = useState<UsageData>({ users: 0, accounts: 0, transactionsThisMonth: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/billing/plans").then(r => r.json()),
      fetch("/api/billing/subscription").then(r => r.json()),
      fetch("/api/billing/usage").then(r => r.json()),
    ]).then(([p, s, u]) => {
      setPlans(p.plans || []);
      setSubscription(s.subscription || null);
      setUsage(u.usage || { users: 0, accounts: 0, transactionsThisMonth: 0 });
    }).finally(() => setLoading(false));
  }, []);

  const planIcons: Record<string, React.ReactNode> = {
    free: <Wallet className="h-5 w-5" />,
    starter: <Zap className="h-5 w-5" />,
    pro: <Star className="h-5 w-5" />,
    enterprise: <Crown className="h-5 w-5" />,
  };

  const planColors: Record<string, string> = {
    free: "bg-gray-100 dark:bg-gray-800",
    starter: "bg-blue-50 dark:bg-blue-950",
    pro: "bg-purple-50 dark:bg-purple-950 ring-2 ring-purple-500",
    enterprise: "bg-amber-50 dark:bg-amber-950",
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  const currentPlan = subscription?.plan;

  return (
    <PageWrapper>
      <AnimatedItem>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Billing & Planos</h1>
            <p className="text-muted-foreground">Gerencie seu plano e uso</p>
          </div>
          {subscription && (
            <Badge variant={subscription.status === "ACTIVE" ? "default" : "secondary"}>
              {subscription.status}
            </Badge>
          )}
        </div>
      </AnimatedItem>

      {/* Usage Stats */}
      <AnimatedItem>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-3">
                <Users className="h-5 w-5 text-blue-500" />
                <span className="text-sm font-medium">Usuários</span>
              </div>
              <div className="text-2xl font-bold">{usage.users} / {currentPlan?.maxUsers === -1 ? "∞" : currentPlan?.maxUsers || 1}</div>
              {currentPlan && currentPlan.maxUsers > 0 && (
                <Progress value={(usage.users / currentPlan.maxUsers) * 100} className="mt-2" />
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-3">
                <Wallet className="h-5 w-5 text-green-500" />
                <span className="text-sm font-medium">Contas</span>
              </div>
              <div className="text-2xl font-bold">{usage.accounts} / {currentPlan?.maxAccounts === -1 ? "∞" : currentPlan?.maxAccounts || 2}</div>
              {currentPlan && currentPlan.maxAccounts > 0 && (
                <Progress value={(usage.accounts / currentPlan.maxAccounts) * 100} className="mt-2" />
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-3">
                <CreditCard className="h-5 w-5 text-purple-500" />
                <span className="text-sm font-medium">Transações/mês</span>
              </div>
              <div className="text-2xl font-bold">{usage.transactionsThisMonth} / {currentPlan?.maxTransactionsPerMonth === -1 ? "∞" : currentPlan?.maxTransactionsPerMonth || 100}</div>
              {currentPlan && currentPlan.maxTransactionsPerMonth > 0 && (
                <Progress value={(usage.transactionsThisMonth / currentPlan.maxTransactionsPerMonth) * 100} className="mt-2" />
              )}
            </CardContent>
          </Card>
        </div>
      </AnimatedItem>

      {/* Plan Comparison */}
      <AnimatedItem>
        <h2 className="text-lg font-semibold mt-4">Escolha seu plano</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-3">
          {plans.map(plan => (
            <Card key={plan.id} className={`relative ${planColors[plan.slug] || ""}`}>
              {plan.slug === "pro" && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-purple-600 text-white">Popular</Badge>
                </div>
              )}
              <CardHeader className="text-center pb-2">
                <div className="mx-auto mb-2">{planIcons[plan.slug]}</div>
                <CardTitle className="text-lg">{plan.name}</CardTitle>
                <CardDescription>
                  {plan.price === 0 ? (
                    <span className="text-2xl font-bold">Grátis</span>
                  ) : (
                    <span><span className="text-2xl font-bold">{formatCurrency(plan.price)}</span>/mês</span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm space-y-2">
                  <div className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" />{plan.maxUsers === -1 ? "Ilimitados" : plan.maxUsers} usuário{plan.maxUsers !== 1 ? "s" : ""}</div>
                  <div className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" />{plan.maxAccounts === -1 ? "Ilimitadas" : plan.maxAccounts} conta{plan.maxAccounts !== 1 ? "s" : ""}</div>
                  <div className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" />{plan.maxTransactionsPerMonth === -1 ? "Ilimitadas" : plan.maxTransactionsPerMonth} transações/mês</div>
                  {(plan.features as string[]).map((f: string, i: number) => (
                    <div key={i} className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" />{f}</div>
                  ))}
                </div>
                <Button
                  className="w-full mt-4"
                  variant={currentPlan?.slug === plan.slug ? "secondary" : "default"}
                  disabled={currentPlan?.slug === plan.slug}
                >
                  {currentPlan?.slug === plan.slug ? "Plano atual" : <>Upgrade <ArrowRight className="h-4 w-4 ml-1" /></>}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </AnimatedItem>
    </PageWrapper>
  );
}
