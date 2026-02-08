"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MessageSquare, Plus, Send, Trash2, X, Bot, User, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface Message {
  id: string;
  role: string;
  content: string;
  createdAt: string;
}

interface Conversation {
  id: string;
  title: string;
  updatedAt: string;
  messages?: Message[];
}

const QUICK_ACTIONS = [
  { label: "💰 Resumo do mês", text: "resumo do mês" },
  { label: "📊 Meus gastos", text: "quanto gastei esse mês?" },
  { label: "💳 Saldo das contas", text: "qual meu saldo?" },
  { label: "📈 Como estão minhas metas?", text: "como estão minhas metas?" },
  { label: "💡 Dica financeira", text: "dica financeira" },
];

export default function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  useEffect(() => {
    fetch("/api/chat/conversations")
      .then(r => r.json())
      .then(setConversations)
      .catch(() => {});
  }, []);

  const loadMessages = async (convId: string) => {
    setActiveConvId(convId);
    const res = await fetch(`/api/chat/conversations/${convId}/messages`);
    const msgs = await res.json();
    setMessages(msgs);
  };

  const newConversation = () => {
    setActiveConvId(null);
    setMessages([]);
  };

  const deleteConversation = async (id: string) => {
    await fetch(`/api/chat/conversations?id=${id}`, { method: "DELETE" });
    setConversations(prev => prev.filter(c => c.id !== id));
    if (activeConvId === id) newConversation();
  };

  const sendMessage = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput("");

    const userMsg: Message = { id: `temp-${Date.now()}`, role: "USER", content: msg, createdAt: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, conversationId: activeConvId }),
      });
      const data = await res.json();

      if (!activeConvId && data.conversationId) {
        setActiveConvId(data.conversationId);
        setConversations(prev => [
          { id: data.conversationId, title: msg.slice(0, 60), updatedAt: new Date().toISOString() },
          ...prev,
        ]);
      }

      setMessages(prev => [...prev, data.message]);
    } catch {
      setMessages(prev => [...prev, { id: `err-${Date.now()}`, role: "ASSISTANT", content: "❌ Erro ao processar mensagem. Tente novamente.", createdAt: new Date().toISOString() }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex h-[calc(100vh-6rem)] -mx-4 sm:-mx-6 lg:-mx-8 -my-6 sm:-my-8 rounded-xl overflow-hidden border border-border/50">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? "w-72" : "w-0"} transition-all duration-300 bg-card/50 border-r border-border/50 flex flex-col overflow-hidden`}>
        <div className="p-3 border-b border-border/50">
          <button
            onClick={newConversation}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nova conversa
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations.map(conv => (
            <div
              key={conv.id}
              className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-sm transition-colors ${
                activeConvId === conv.id ? "bg-violet-600/20 text-violet-300" : "hover:bg-muted/50 text-muted-foreground"
              }`}
              onClick={() => loadMessages(conv.id)}
            >
              <MessageSquare className="w-4 h-4 shrink-0" />
              <span className="truncate flex-1">{conv.title}</span>
              <button
                onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id); }}
                className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-opacity"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50 bg-card/30">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-muted-foreground hover:text-foreground">
            {sidebarOpen ? <X className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-violet-600/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-violet-400" />
            </div>
            <div>
              <h1 className="text-sm font-semibold">Ori Chat IA</h1>
              <p className="text-xs text-muted-foreground">Assistente financeiro inteligente</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-violet-600/20 flex items-center justify-center">
                <Bot className="w-8 h-8 text-violet-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-2">Olá! Sou o Ori 🤖</h2>
                <p className="text-muted-foreground text-sm max-w-md">
                  Seu assistente financeiro pessoal. Posso registrar transações, consultar saldos, gerar relatórios e muito mais!
                </p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                {QUICK_ACTIONS.map(qa => (
                  <button
                    key={qa.text}
                    onClick={() => sendMessage(qa.text)}
                    className="px-3 py-1.5 rounded-full bg-muted/50 hover:bg-violet-600/20 text-sm text-muted-foreground hover:text-violet-300 border border-border/50 transition-colors"
                  >
                    {qa.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map(msg => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === "USER" ? "justify-end" : "justify-start"}`}>
              {msg.role !== "USER" && (
                <div className="w-8 h-8 rounded-full bg-zinc-700/50 flex items-center justify-center shrink-0 mt-1">
                  <Bot className="w-4 h-4 text-zinc-400" />
                </div>
              )}
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "USER"
                    ? "bg-violet-600 text-white rounded-br-md"
                    : "bg-zinc-800/50 text-zinc-200 border border-border/30 rounded-bl-md"
                }`}
              >
                {msg.role === "USER" ? (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                ) : (
                  <div className="prose prose-invert prose-sm max-w-none prose-p:my-1 prose-li:my-0.5 prose-table:text-sm prose-headings:text-violet-300 prose-strong:text-zinc-100">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                )}
              </div>
              {msg.role === "USER" && (
                <div className="w-8 h-8 rounded-full bg-violet-600/30 flex items-center justify-center shrink-0 mt-1">
                  <User className="w-4 h-4 text-violet-300" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-zinc-700/50 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-zinc-400" />
              </div>
              <div className="bg-zinc-800/50 border border-border/30 rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-2 h-2 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-2 h-2 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick actions when conversation has messages */}
        {messages.length > 0 && (
          <div className="px-4 pb-2 flex gap-2 overflow-x-auto">
            {QUICK_ACTIONS.map(qa => (
              <button
                key={qa.text}
                onClick={() => sendMessage(qa.text)}
                className="shrink-0 px-2.5 py-1 rounded-full bg-muted/30 hover:bg-violet-600/20 text-xs text-muted-foreground hover:text-violet-300 border border-border/30 transition-colors"
              >
                {qa.label}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="px-4 pb-4 pt-2">
          <div className="flex items-end gap-2 bg-card/50 border border-border/50 rounded-xl p-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Digite sua mensagem..."
              className="flex-1 bg-transparent resize-none outline-none text-sm max-h-32 min-h-[40px] py-2 px-2 placeholder:text-muted-foreground/50"
              rows={1}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              className="p-2 rounded-lg bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
