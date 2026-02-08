"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MessageSquare, Plus, Send, Trash2, Bot, User, Sparkles, Search, PanelLeftClose, PanelLeft, ArrowDown, Zap, TrendingUp, PiggyBank, Target, Lightbulb } from "lucide-react";
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
  { label: "Resumo do mês", icon: "💰", text: "resumo do mês" },
  { label: "Meus gastos", icon: "📊", text: "quanto gastei esse mês?" },
  { label: "Saldo das contas", icon: "💳", text: "qual meu saldo?" },
  { label: "Minhas metas", icon: "📈", text: "como estão minhas metas?" },
  { label: "Dica financeira", icon: "💡", text: "dica financeira" },
];

const TIPS = [
  { icon: TrendingUp, title: "Analise seus gastos", desc: "Peça um resumo mensal detalhado" },
  { icon: PiggyBank, title: "Controle seu saldo", desc: "Consulte o saldo de todas as contas" },
  { icon: Target, title: "Acompanhe metas", desc: "Veja o progresso das suas metas" },
  { icon: Lightbulb, title: "Receba dicas", desc: "Peça conselhos financeiros personalizados" },
];

function formatRelativeDate(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMin < 1) return "agora";
  if (diffMin < 60) return `${diffMin}min`;
  if (diffHrs < 24) return `${diffHrs}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export default function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 100);
    };
    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = inputRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = Math.min(textarea.scrollHeight, 128) + "px";
    }
  }, [input]);

  const loadMessages = async (convId: string) => {
    setActiveConvId(convId);
    const res = await fetch(`/api/chat/conversations/${convId}/messages`);
    const msgs = await res.json();
    setMessages(msgs);
  };

  const newConversation = () => {
    setActiveConvId(null);
    setMessages([]);
    inputRef.current?.focus();
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

  const filteredConversations = conversations.filter(c =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-4rem)] -mx-4 sm:-mx-6 lg:-mx-8 -my-6 sm:-my-8 overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? "w-80 border-r" : "w-0"} transition-all duration-200 ease-out border-border/40 bg-zinc-950/50 flex flex-col overflow-hidden shrink-0`}>
        {/* Sidebar Header */}
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Conversas</h2>
            <span className="text-[10px] tabular-nums text-muted-foreground/50">{conversations.length}</span>
          </div>
          <button
            onClick={newConversation}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-all duration-150 active:scale-[0.98] shadow-sm shadow-violet-600/20"
          >
            <Plus className="w-4 h-4" />
            Nova conversa
          </button>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar conversas..."
              className="w-full pl-9 pr-3 py-2 bg-zinc-900/60 border border-border/30 rounded-lg text-xs outline-none placeholder:text-muted-foreground/40 focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5 scrollbar-thin">
          {filteredConversations.length === 0 && (
            <div className="text-center py-8">
              <MessageSquare className="w-5 h-5 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground/40">
                {searchQuery ? "Nenhuma conversa encontrada" : "Nenhuma conversa ainda"}
              </p>
            </div>
          )}
          {filteredConversations.map(conv => (
            <div
              key={conv.id}
              className={`group flex items-center gap-2.5 px-3 py-2.5 rounded-lg cursor-pointer text-sm transition-all duration-150 ${
                activeConvId === conv.id
                  ? "bg-violet-500/15 text-violet-200 border border-violet-500/20"
                  : "hover:bg-zinc-800/60 text-zinc-400 hover:text-zinc-300 border border-transparent"
              }`}
              onClick={() => loadMessages(conv.id)}
            >
              <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${activeConvId === conv.id ? "text-violet-400" : "text-zinc-600"}`} />
              <div className="flex-1 min-w-0">
                <span className="block truncate text-[13px] leading-tight">{conv.title}</span>
                <span className="text-[10px] text-muted-foreground/40 mt-0.5 block">{formatRelativeDate(conv.updatedAt)}</span>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id); }}
                className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all p-1 rounded hover:bg-red-500/10"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col min-w-0 relative">
        {/* Header */}
        <header className="flex items-center gap-3 px-5 py-3.5 border-b border-border/40 bg-zinc-950/30 backdrop-blur-sm shrink-0">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg text-muted-foreground/60 hover:text-foreground hover:bg-zinc-800/50 transition-all"
            title={sidebarOpen ? "Fechar sidebar" : "Abrir sidebar"}
          >
            {sidebarOpen ? <PanelLeftClose className="w-4.5 h-4.5" /> : <PanelLeft className="w-4.5 h-4.5" />}
          </button>

          <div className="w-px h-5 bg-border/40" />

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-600/20 border border-violet-500/20 flex items-center justify-center">
              <Sparkles className="w-4.5 h-4.5 text-violet-400" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-foreground flex items-center gap-2">
                Ori Chat IA
                <span className="flex items-center gap-1.5 text-[10px] font-normal text-emerald-400/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Online
                </span>
              </h1>
              <p className="text-[11px] text-muted-foreground/60">Assistente financeiro inteligente</p>
            </div>
          </div>
        </header>

        {/* Messages Area */}
        <div ref={messagesContainerRef} className="flex-1 overflow-y-auto scroll-smooth">
          {messages.length === 0 ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center h-full px-6 py-12">
              <div className="max-w-lg w-full space-y-8">
                {/* Hero */}
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500/15 to-purple-600/15 border border-violet-500/10 flex items-center justify-center mx-auto">
                    <Bot className="w-10 h-10 text-violet-400/80" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold text-foreground mb-2">Olá! Sou o Ori 🤖</h2>
                    <p className="text-sm text-muted-foreground/70 max-w-sm mx-auto leading-relaxed">
                      Seu assistente financeiro pessoal. Posso registrar transações, consultar saldos, gerar relatórios e muito mais!
                    </p>
                  </div>
                </div>

                {/* Tips Grid */}
                <div className="grid grid-cols-2 gap-3">
                  {TIPS.map((tip) => (
                    <div key={tip.title} className="p-4 rounded-xl bg-zinc-900/40 border border-border/30 hover:border-violet-500/20 transition-colors group">
                      <tip.icon className="w-5 h-5 text-violet-400/60 mb-2.5 group-hover:text-violet-400 transition-colors" />
                      <h3 className="text-[13px] font-medium text-zinc-300 mb-1">{tip.title}</h3>
                      <p className="text-[11px] text-muted-foreground/50 leading-relaxed">{tip.desc}</p>
                    </div>
                  ))}
                </div>

                {/* Quick Actions */}
                <div className="space-y-2.5">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground/40 font-medium text-center">Comece com uma pergunta</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {QUICK_ACTIONS.map(qa => (
                      <button
                        key={qa.text}
                        onClick={() => sendMessage(qa.text)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-zinc-900/60 hover:bg-violet-500/15 text-[13px] text-zinc-400 hover:text-violet-300 border border-border/30 hover:border-violet-500/30 transition-all duration-150 active:scale-[0.97]"
                      >
                        <span>{qa.icon}</span>
                        <span>{qa.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Messages */
            <div className="max-w-3xl mx-auto px-5 py-6 space-y-1">
              {messages.map((msg, i) => {
                const isUser = msg.role === "USER";
                const showTimestamp = i === 0 || 
                  new Date(msg.createdAt).getTime() - new Date(messages[i-1].createdAt).getTime() > 300000;
                return (
                  <div key={msg.id}>
                    {showTimestamp && (
                      <div className="flex justify-center py-3">
                        <span className="text-[10px] text-muted-foreground/30 tabular-nums">{formatTime(msg.createdAt)}</span>
                      </div>
                    )}
                    <div className={`flex gap-3 py-1.5 ${isUser ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                      {!isUser && (
                        <div className="w-8 h-8 rounded-lg bg-zinc-800/80 border border-border/30 flex items-center justify-center shrink-0 mt-0.5">
                          <Bot className="w-4 h-4 text-zinc-500" />
                        </div>
                      )}
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-3 text-[13.5px] leading-relaxed ${
                          isUser
                            ? "bg-violet-600 text-white rounded-br-lg shadow-sm shadow-violet-600/15"
                            : "bg-zinc-800/50 text-zinc-200 border border-border/20 rounded-bl-lg"
                        }`}
                      >
                        {isUser ? (
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        ) : (
                          <div className="prose prose-invert prose-sm max-w-none prose-p:my-1.5 prose-li:my-0.5 prose-table:text-sm prose-headings:text-violet-300 prose-strong:text-zinc-100 prose-a:text-violet-400 prose-code:text-violet-300 prose-code:bg-zinc-900/50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded">
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                          </div>
                        )}
                      </div>
                      {isUser && (
                        <div className="w-8 h-8 rounded-lg bg-violet-500/20 border border-violet-500/20 flex items-center justify-center shrink-0 mt-0.5">
                          <User className="w-4 h-4 text-violet-300" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Typing Indicator */}
              {loading && (
                <div className="flex gap-3 py-1.5 justify-start animate-in fade-in slide-in-from-bottom-2 duration-200">
                  <div className="w-8 h-8 rounded-lg bg-zinc-800/80 border border-border/30 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-zinc-500" />
                  </div>
                  <div className="bg-zinc-800/50 border border-border/20 rounded-2xl rounded-bl-lg px-5 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-violet-400/60 animate-bounce" style={{ animationDelay: "0ms", animationDuration: "1s" }} />
                      <div className="w-2 h-2 rounded-full bg-violet-400/40 animate-bounce" style={{ animationDelay: "150ms", animationDuration: "1s" }} />
                      <div className="w-2 h-2 rounded-full bg-violet-400/20 animate-bounce" style={{ animationDelay: "300ms", animationDuration: "1s" }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} className="h-1" />
            </div>
          )}
        </div>

        {/* Scroll to bottom button */}
        {showScrollBtn && (
          <button
            onClick={scrollToBottom}
            className="absolute bottom-32 right-6 w-9 h-9 rounded-full bg-zinc-800 border border-border/40 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-zinc-700 transition-all shadow-lg animate-in fade-in zoom-in duration-200"
          >
            <ArrowDown className="w-4 h-4" />
          </button>
        )}

        {/* Quick actions strip (when conversation active) */}
        {messages.length > 0 && !loading && (
          <div className="px-5 pb-1 pt-0.5 max-w-3xl mx-auto w-full">
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
              {QUICK_ACTIONS.map(qa => (
                <button
                  key={qa.text}
                  onClick={() => sendMessage(qa.text)}
                  className="shrink-0 px-3 py-1.5 rounded-full bg-zinc-900/50 hover:bg-violet-500/15 text-[11px] text-zinc-500 hover:text-violet-300 border border-border/20 hover:border-violet-500/25 transition-all duration-150"
                >
                  {qa.icon} {qa.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="px-5 pb-5 pt-3 max-w-3xl mx-auto w-full">
          <div className="flex items-end gap-3 bg-zinc-900/60 border border-border/40 rounded-xl p-2 focus-within:border-violet-500/40 focus-within:ring-1 focus-within:ring-violet-500/15 transition-all duration-200">
            <div className="flex-1 flex items-center">
              <Zap className="w-4 h-4 text-muted-foreground/20 ml-2 mr-1 shrink-0" />
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Pergunte sobre suas finanças..."
                className="flex-1 bg-transparent resize-none outline-none text-[13.5px] max-h-32 min-h-[40px] py-2 px-2 placeholder:text-muted-foreground/30 text-foreground leading-relaxed"
                rows={1}
              />
            </div>
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              className="p-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white transition-all duration-150 active:scale-95 shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground/25 text-center mt-2">
            Ori pode cometer erros. Verifique informações importantes.
          </p>
        </div>
      </main>
    </div>
  );
}
