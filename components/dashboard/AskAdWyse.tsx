'use client';

import { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, X, Loader2, MessageCircle } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AskAdWyseProps {
  storeId?: string;
}

const SUGGESTED_QUESTIONS = [
  "What's my best campaign?",
  'Which campaign is losing money?',
  'How is my ROAS trending?',
  'What should I scale next week?',
];

export function AskAdWyse({ storeId }: AskAdWyseProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        "Hey! I'm AdWyse Assistant. Ask me anything about your ad performance — campaigns, ROAS, what to scale, what to kill. I have your last 30 days of data ready.",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: 'user', content: text.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId,
          // Strip system greeting from history sent to API
          messages: newMessages.slice(1).map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      setMessages([...newMessages, { role: 'assistant', content: data.reply }]);
    } catch (err: any) {
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: `Sorry, I hit an error: ${err.message}. Try again in a moment.`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating launcher (bottom right, above QuickActions) */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-36 right-6 lg:bottom-24 z-40 w-14 h-14 bg-gradient-to-br from-purple-600 via-fuchsia-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-full shadow-lg shadow-purple-500/40 flex items-center justify-center transition-all hover:scale-105"
        title="Ask AdWyse AI"
      >
        <Sparkles className="w-6 h-6" />
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[calc(100vw-3rem)] sm:w-[420px] max-h-[80vh] flex flex-col bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-zinc-800 bg-gradient-to-r from-purple-600/20 to-pink-600/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="font-semibold text-white text-sm">AdWyse Assistant</div>
                <div className="text-xs text-white/50">Powered by Claude</div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 text-white/50 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-orange-600 text-white'
                      : 'bg-zinc-800 text-zinc-100'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-zinc-800 rounded-2xl px-4 py-2.5 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
                  <span className="text-zinc-400 text-sm">Thinking…</span>
                </div>
              </div>
            )}

            {/* Suggested prompts (shown only on first message) */}
            {messages.length === 1 && !loading && (
              <div className="pt-2">
                <div className="text-xs text-white/40 mb-2">Try asking:</div>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTED_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      onClick={() => sendMessage(q)}
                      className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white text-xs rounded-full transition"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-zinc-800 p-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage(input);
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about your ads…"
                disabled={loading}
                className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-purple-500 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="px-3 py-2 bg-gradient-to-br from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-30 text-white rounded-lg transition flex items-center"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
