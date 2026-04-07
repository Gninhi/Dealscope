'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Loader2, Bot, User, Trash2, Sparkles, Brain, Copy, Check, MessageSquare, ArrowRight } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

interface Message {
  id: string;
  role: string;
  content: string;
  createdAt: string;
}

const SUGGESTED_PROMPTS = [
  'Analyse le secteur tech en France',
  'Quels critères pour une cible SaaS B2B ?',
  'Comment préparer une approche M&A ?',
  'Tendances fusions-acquisitions 2025',
];

export default function ChatTab() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const copiedTimeoutRef = useRef<NodeJS.Timeout>(null);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch('/api/chat');
      if (!res.ok) return;
      const text = await res.text();
      try { const data = JSON.parse(text); if (data && Array.isArray(data.messages)) setMessages(data.messages); } catch {}
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  }, []);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    return () => { if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current); };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleCopy = async (content: string, msgId: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(msgId);
      if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current);
      copiedTimeoutRef.current = setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Fallback: do nothing
    }
  };

  const handleSuggestedPrompt = (prompt: string) => {
    setInput(prompt);
    // Focus the input
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);

    // Add user message optimistically
    const optimisticUser: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: userMessage,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimisticUser]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage }),
      });

      if (!res.ok) throw new Error('Chat failed');

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No reader');

      const decoder = new TextDecoder();
      let fullContent = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                fullContent = parsed.content;
              }
            } catch (e) {
              // Skip unparseable lines
            }
          }
        }
      }

      // Update with the full assistant message
      if (fullContent) {
        setMessages(prev => {
          const filtered = prev.filter(m => m.id !== optimisticUser.id);
          return [
            ...filtered,
            optimisticUser,
            {
              id: `assistant-${Date.now()}`,
              role: 'assistant',
              content: fullContent,
              createdAt: new Date().toISOString(),
            },
          ];
        });
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [
        ...prev.filter(m => m.id !== optimisticUser.id),
        optimisticUser,
        {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: 'Désolé, une erreur est survenue. Veuillez réessayer.',
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const [confirmState, setConfirmState] = useState<{open: boolean; title: string; description: string; onConfirm: () => void}>({open: false, title: '', description: '', onConfirm: () => {}});

  const handleClear = async () => {
    setConfirmState({
      open: true,
      title: 'Effacer la conversation',
      description: 'Effacer toute la conversation ?',
      onConfirm: () => {
        setConfirmState(prev => ({...prev, open: false}));
        setMessages([]);
      },
    });
    return;
  };

  const isEmpty = messages.length === 0 && !isLoading;

  return (
    <div className="flex flex-col h-[calc(100vh-180px)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <span>Chat IA</span>
              <span className="text-base font-semibold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">— Gemma 4</span>
            </h2>
            <p className="text-muted-foreground text-sm mt-0.5">Propulsé par Gemma 4</p>
          </div>
        </div>
        <button
          onClick={handleClear}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Effacer
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto rounded-xl border border-border bg-card/30 backdrop-blur-sm p-4 space-y-4 custom-scrollbar mb-4">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            {/* Gemma 4 branding icon */}
            <div className="relative mb-6">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 flex items-center justify-center">
                <Brain className="w-10 h-10 text-indigo-400" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              DealScope IA — Gemma 4
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mb-8">
              Votre assistant M&A intelligent propulsé par Gemma 4. Posez vos questions sur l&apos;analyse M&A, les entreprises cibles, les secteurs d&apos;activité...
            </p>

            {/* Suggested prompts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
              {SUGGESTED_PROMPTS.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestedPrompt(prompt)}
                  className="flex items-center gap-3 p-3.5 rounded-xl border border-border bg-card/50 hover:bg-card/80 hover:border-indigo-500/30 transition-all duration-200 text-left group"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500/10 to-violet-500/10 flex items-center justify-center shrink-0 group-hover:from-indigo-500/20 group-hover:to-violet-500/20 transition-colors">
                    <MessageSquare className="w-4 h-4 text-indigo-400" />
                  </div>
                  <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors leading-snug">{prompt}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all shrink-0 ml-auto" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}
              <div className="relative group">
                <div
                  className={`max-w-[80%] rounded-xl px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white'
                      : 'bg-card/80 border border-border text-foreground'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                </div>
                {/* Copy button for assistant messages */}
                {msg.role === 'assistant' && (
                  <button
                    onClick={() => handleCopy(msg.content, msg.id)}
                    className="absolute -bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-1 px-2 py-1 rounded-md bg-card border border-border text-muted-foreground hover:text-foreground hover:border-indigo-500/30 text-xs"
                  >
                    {copiedId === msg.id ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Copié</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copier</span>
                      </>
                    )}
                  </button>
                )}
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-foreground" />
                </div>
              )}
            </div>
          ))
        )}
        {/* Streaming indicator */}
        {isLoading && (
          <div className="flex gap-3 animate-fade-in-up">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-card/80 border border-border rounded-xl px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-sm text-muted-foreground">Gemma 4 analyse...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex items-end gap-3 shrink-0">
        <div className="flex-1 relative">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Posez une question sur les M&A..."
            rows={1}
            className="w-full px-4 py-3 pr-12 rounded-xl text-sm bg-card/80 border border-border text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-colors resize-none"
            style={{ minHeight: '48px', maxHeight: '120px' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="absolute right-2 bottom-2 w-8 h-8 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 text-white flex items-center justify-center hover:from-indigo-600 hover:to-violet-600 disabled:opacity-30 transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
      <ConfirmDialog
        open={confirmState.open}
        onOpenChange={(open) => setConfirmState(prev => ({...prev, open}))}
        title={confirmState.title}
        description={confirmState.description}
        onConfirm={confirmState.onConfirm}
        variant="destructive"
      />
    </div>
  );
}
