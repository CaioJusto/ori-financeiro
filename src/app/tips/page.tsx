"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageWrapper, AnimatedItem } from "@/components/page-wrapper";
import { Lightbulb } from "lucide-react";
import { FINANCIAL_TIPS, TOPICS, getDailyTip } from "@/data/financial-tips";

export default function TipsPage() {
  const [topic, setTopic] = useState("all");
  const dailyTip = getDailyTip();
  const filtered = topic === "all" ? FINANCIAL_TIPS : FINANCIAL_TIPS.filter(t => t.topic === topic);

  return (
    <PageWrapper><AnimatedItem><h1 className="text-2xl font-bold">Educação Financeira</h1><p className="text-muted-foreground mb-6">Dicas e conteúdo para melhorar sua vida financeira</p></AnimatedItem>
      <AnimatedItem>
        <Card className="mb-6 border-primary/20 bg-primary/5">
          <CardHeader className="flex flex-row items-center gap-2 pb-2"><Lightbulb className="h-5 w-5 text-yellow-500" /><CardTitle className="text-lg">💡 Dica do Dia</CardTitle></CardHeader>
          <CardContent>
            <h3 className="font-semibold text-lg mb-1">{dailyTip.icon} {dailyTip.title}</h3>
            <p className="text-muted-foreground">{dailyTip.content}</p>
            <Badge variant="outline" className="mt-2">{TOPICS.find(t => t.id === dailyTip.topic)?.label}</Badge>
          </CardContent>
        </Card>
      </AnimatedItem>

      <AnimatedItem>
        <Tabs value={topic} onValueChange={setTopic}>
          <TabsList className="flex flex-wrap h-auto gap-1 mb-6">
            <TabsTrigger value="all">Todos</TabsTrigger>
            {TOPICS.map(t => <TabsTrigger key={t.id} value={t.id}>{t.icon} {t.label}</TabsTrigger>)}
          </TabsList>
          <TabsContent value={topic} forceMount>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(tip => (
                <Card key={tip.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">{tip.icon} {tip.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{tip.content}</p>
                    <Badge variant="outline" className="mt-3">{TOPICS.find(t => t.id === tip.topic)?.label}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </AnimatedItem>
    </PageWrapper>
  );
}
