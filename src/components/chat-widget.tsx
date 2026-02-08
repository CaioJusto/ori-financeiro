"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { MessageSquare, X, Send, Bot, User, Maximize2, Sparkles, Volume2, VolumeX } from "lucide-react";
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
  { label: "📊 Gastos", text: "quanto gastei esse mês?" },
  { label: "🔮 Previsão", text: "previsão de gastos pro mês" },
  { label: "🎯 Metas", text: "como estão minhas metas?" },
];

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [convId, setConvId] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [size, setSize] = useState({ width: 380, height: 520 });
  const [isResizing, setIsResizing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resizeRef = useRef<{ startX: number; startY: number; startW: number; startH: number } | null>(null);
  const router = useRouter();

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
      setUnreadCount(0);
    }
  }, [open]);

  // Resize handlers
  useEffect(() => {
    if (!isResizing) return;
    const handleMouseMove = (e: MouseEvent) => {
      if (!resizeRef.current) return;
      const { startX, startY, startW, startH } = resizeRef.current;
      const newW = Math.max(320, Math.min(600, startW - (e.clientX - startX)));
      const newH = Math.max(400, Math.min(700, startH - (e.clientY - startY)));
      setSize({ width: newW, height: newH });
    };
    const handleMouseUp = () => {
      setIsResizing(false);
      resizeRef.current = null;
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    resizeRef.current = { startX: e.clientX, startY: e.clientY, startW: size.width, startH: size.height };
    setIsResizing(true);
  };

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
      if (!open) setUnreadCount(prev => prev + 1);
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
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-violet-600 hover:bg-violet-500 text-white shadow-xl shadow-violet-600/25 flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 group"
      >
        <MessageSquare className="w-6 h-6 group-hover:hidden" />
        <Sparkles className="w-6 h-6 hidden group-hover:block" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center animate-in zoom-in duration-200">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
    );
  }

  return (
    <div
      className="fixed bottom-6 right-6 z-50 bg-zinc-950 border border-border/40 rounded-2xl shadow-2xl shadow-black/40 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 zoom-in-95 duration-200"
      style={{ width: size.width, height: size.height }}
    >
      {/* Resize handle */}
      <div
        className="absolute top-0 left-0 w-4 h-4 cursor-nw-resize z-10 hover:bg-violet-500/20 rounded-br-lg transition-colors"
        onMouseDown={handleResizeStart}
        title="Redimensionar"
      />

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/30 bg-zinc-950">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-600/20 border border-violet-500/15 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
          </div>
          <div>
            <span className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              Ori Chat
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </span>
          </div>
        </div>
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1.5 hover:bg-zinc-800/60 rounded-lg transition-colors"
            title={soundEnabled ? "Desativar som" : "Ativar som"}
          >
            {soundEnabled ? (
              <Volume2 className="w-3.5 h-3.5 text-violet-400" />
            ) : (
              <VolumeX className="w-3.5 h-3.5 text-muted-foreground/60" />
            )}
          </button>
          <button
            onClick={() => router.push("/chat")}
            className="p-1.5 hover:bg-zinc-800/60 rounded-lg transition-colors"
            title="Abrir chat completo"
          >
            <Maximize2 className="w-3.5 h-3.5 text-muted-foreground/60 hover:text-foreground" />
          </button>
          <button
            onClick={() => setOpen(false)}
            className="p-1.5 hover:bg-zinc-800/60 rounded-lg transition-colors"
          >
            <X className="w-3.5 h-3.5 text-muted-foreground/60 hover:text-foreground" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center space-y-4 py-8">
            <div className="w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/10 flex items-center justify-center mx-auto">
              <Bot className="w-7 h-7 text-violet-400/70" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-300 mb-1">Como posso ajudar?</p>
              <p className="text-[11px] text-muted-foreground/40">Pergunte sobre suas finanças</p>
            </div>
            {/* Quick actions grid */}
            <div className="flex flex-wrap gap-1.5 justify-center pt-1">
              {QUICK_ACTIONS.slice(0, 3).map(qa => (
                <button
                  key={qa.text}
                  onClick={() => sendMessage(qa.text)}
                  className="px-3 py-1.5 rounded-full bg-zinc-900/60 border border-border/20 text-[11px] text-zinc-400 hover:text-violet-300 hover:bg-violet-500/15 hover:border-violet-500/25 transition-all duration-150"
                >
                  {qa.label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {QUICK_ACTIONS.slice(3, 6).map(qa => (
                <button
                  key={qa.text}
                  onClick={() => sendMessage(qa.text)}
                  className="px-3 py-1.5 rounded-full bg-zinc-900/60 border border-border/20 text-[11px] text-zinc-400 hover:text-violet-300 hover:bg-violet-500/15 hover:border-violet-500/25 transition-all duration-150"
                >
                  {qa.label}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map(msg => (
          <div key={msg.id} className={`flex gap-2 ${msg.role === "USER" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-1 duration-200`}>
            {msg.role !== "USER" && (
              <div className="w-6 h-6 rounded-md bg-zinc-800 border border-border/20 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-3 h-3 text-zinc-500" />
              </div>
            )}
            <div className={`max-w-[80%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
              msg.role === "USER"
                ? "bg-gradient-to-br from-violet-600 to-violet-700 text-white rounded-br-md shadow-sm shadow-violet-600/10"
                : "bg-gradient-to-br from-zinc-800/60 to-zinc-800/40 border border-border/20 text-zinc-200 rounded-bl-md"
            }`}>
              {msg.role === "USER" ? (
                <p className="whitespace-pre-wrap">{msg.content}</p>
              ) : (
                <div className="prose prose-invert prose-xs max-w-none prose-p:my-0.5 prose-headings:text-violet-300 prose-strong:text-zinc-100 prose-a:text-violet-400">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              )}
            </div>
            {msg.role === "USER" && (
              <div className="w-6 h-6 rounded-md bg-violet-500/15 border border-violet-500/15 flex items-center justify-center shrink-0 mt-0.5">
                <User className="w-3 h-3 text-violet-300" />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex gap-2 animate-in fade-in duration-200">
            <div className="w-6 h-6 rounded-md bg-zinc-800 border border-border/20 flex items-center justify-center shrink-0">
              <Bot className="w-3 h-3 text-zinc-500" />
            </div>
            <div className="bg-zinc-800/50 border border-border/20 rounded-xl rounded-bl-md px-4 py-2.5 flex gap-1.5 items-center">
              <div className="w-1.5 h-1.5 rounded-full bg-violet-400/50 animate-bounce" style={{ animationDuration: "1s" }} />
              <div className="w-1.5 h-1.5 rounded-full bg-violet-400/35 animate-bounce" style={{ animationDelay: "150ms", animationDuration: "1s" }} />
              <div className="w-1.5 h-1.5 rounded-full bg-violet-400/20 animate-bounce" style={{ animationDelay: "300ms", animationDuration: "1s" }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-border/30">
        <div className="flex items-center gap-2 bg-zinc-900/60 border border-border/30 rounded-xl px-1 focus-within:border-violet-500/40 transition-all">
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) sendMessage(); }}
            placeholder="Pergunte algo..."
            className="flex-1 bg-transparent px-3 py-2.5 text-xs outline-none placeholder:text-muted-foreground/30 text-foreground"
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="p-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white transition-all duration-150 active:scale-95 shrink-0 mr-1"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
