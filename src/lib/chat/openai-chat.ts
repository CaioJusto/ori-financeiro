import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/encryption";
import { TenantSession } from "@/lib/tenant";

const DEFAULT_SYSTEM_PROMPT = `Você é o Ori, um assistente financeiro pessoal inteligente integrado ao sistema Ori Financeiro. Você ajuda o usuário a gerenciar suas finanças, analisar gastos, acompanhar metas e tomar decisões financeiras melhores. Responda sempre em português brasileiro, de forma clara e objetiva. Use emojis quando apropriado. Formate com markdown quando necessário.`;

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function getAISettings(tenantId: string) {
  const settings = await prisma.tenantSettings.findUnique({
    where: { tenantId },
  });
  if (!settings || !settings.aiEnabled || !settings.aiApiKey) return null;

  try {
    const apiKey = decrypt(settings.aiApiKey);
    return {
      apiKey,
      model: settings.aiModel || "gpt-4.1-mini",
      systemPrompt: settings.aiSystemPrompt || DEFAULT_SYSTEM_PROMPT,
    };
  } catch {
    return null;
  }
}

export async function chatWithOpenAI(
  tenant: TenantSession,
  userMessage: string,
  conversationId?: string
): Promise<{ response: string; usedAI: boolean }> {
  const aiSettings = await getAISettings(tenant.tenantId);
  if (!aiSettings) return { response: "", usedAI: false };

  // Build context from recent messages
  const messages: ChatMessage[] = [
    { role: "system", content: aiSettings.systemPrompt },
  ];

  if (conversationId) {
    const recentMsgs = await prisma.chatMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    recentMsgs.reverse().forEach((m) => {
      messages.push({
        role: m.role === "USER" ? "user" : "assistant",
        content: m.content,
      });
    });
  }

  messages.push({ role: "user", content: userMessage });

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${aiSettings.apiKey}`,
      },
      body: JSON.stringify({
        model: aiSettings.model,
        messages,
        max_tokens: 2000,
        temperature: 0.7,
      }),
    });

    if (!res.ok) {
      console.error("OpenAI API error:", res.status);
      return { response: "", usedAI: false };
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || "";
    return { response: content, usedAI: true };
  } catch (err) {
    console.error("OpenAI chat error:", err);
    return { response: "", usedAI: false };
  }
}
