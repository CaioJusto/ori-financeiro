"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { MessageSquare, X, Send, Bot, User, Maximize2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";

interface Message {
  id: string;
  role: string;
  content: string;
}

const QUICK_ACTIONS = [
  { label: "💰 Resumo", text: "resumo do mês" },
  { label: "💳 Saldo", text: "qual meu saldo?" },
  { label: "💡 Dica", text: "dica financeira" },
];

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [convId, setConvId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  const sendMessage = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput("");

    setMessages(prev => [...prev, { id: `u-${Date.now()}`, role: "USER", content: msg }]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, conversationId: convId }),
      });
      const data = await res.json();
      if (data.conversationId) setConvId(data.conversationId);
      setMessages(prev => [...prev, data.message]);
    } catch {
      setMessages(prev => [...prev, { id: `e-${Date.now()}`, role: "ASSISTANT", content: "❌ Erro. Tente novamente." }]);
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-600/25 flex items-center justify-center transition-all hover:scale-105"
      >
        <MessageSquare className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 h-[32rem] bg-background border border-border/50 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-violet-600/10 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-violet-400" />
          <span className="text-sm font-semibold">Ori Chat</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => router.push("/chat")} className="p-1.5 hover:bg-muted/50 rounded-lg transition-colors">
            <Maximize2 className="w-4 h-4 text-muted-foreground" />
          </button>
          <button onClick={() => setOpen(false)} className="p-1.5 hover:bg-muted/50 rounded-lg transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center space-y-3 py-8">
            <Bot className="w-10 h-10 text-violet-400 mx-auto" />
            <p className="text-xs text-muted-foreground">Como posso ajudar?</p>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {QUICK_ACTIONS.map(qa => (
                <button key={qa.text} onClick={() => sendMessage(qa.text)} className="px-2 py-1 rounded-full bg-muted/40 text-xs hover:bg-violet-600/20 transition-colors">
                  {qa.label}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map(msg => (
          <div key={msg.id} className={`flex gap-2 ${msg.role === "USER" ? "justify-end" : "justify-start"}`}>
            {msg.role !== "USER" && <Bot className="w-5 h-5 text-zinc-500 mt-1 shrink-0" />}
            <div className={`max-w-[80%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
              msg.role === "USER" ? "bg-violet-600 text-white" : "bg-zinc-800/50 border border-border/30"
            }`}>
              {msg.role === "USER" ? (
                <p className="whitespace-pre-wrap">{msg.content}</p>
              ) : (
                <div className="prose prose-invert prose-xs max-w-none prose-p:my-0.5 prose-headings:text-violet-300 prose-strong:text-zinc-100">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              )}
            </div>
            {msg.role === "USER" && <User className="w-5 h-5 text-violet-400 mt-1 shrink-0" />}
          </div>
        ))}
        {loading && (
          <div className="flex gap-2">
            <Bot className="w-5 h-5 text-zinc-500 shrink-0" />
            <div className="bg-zinc-800/50 border border-border/30 rounded-xl px-3 py-2 flex gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce" />
              <div className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: "150ms" }} />
              <div className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-2 border-t border-border/50">
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && sendMessage()}
            placeholder="Digite sua mensagem..."
            className="flex-1 bg-muted/30 rounded-lg px-3 py-2 text-xs outline-none placeholder:text-muted-foreground/50"
          />
          <button onClick={() => sendMessage()} disabled={!input.trim() || loading} className="p-2 rounded-lg bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white">
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
