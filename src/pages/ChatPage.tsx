import React, { useState, useRef, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Send, ThumbsUp, ThumbsDown, Ticket, Loader2, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TicketModal } from "@/components/TicketModal";

interface Source {
  chunk_id: string;
  article_title: string;
  article_id?: string;
  section?: string;
  source_url?: string;
  snippet: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  confidence?: "low" | "medium" | "high";
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());
  const [selectedSources, setSelectedSources] = useState<Source[]>([]);
  const [ticketModal, setTicketModal] = useState<{ question: string; answer: string; sources: Source[] } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: input.trim(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("chat", {
        body: { session_id: sessionId, user_message: userMsg.content },
      });

      if (error) throw error;

      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.answer || "I couldn't find relevant information in the knowledge base.",
        sources: data.sources || [],
        confidence: data.confidence || "medium",
      };
      setMessages((prev) => [...prev, assistantMsg]);
      if (data.sources?.length) setSelectedSources(data.sources);
    } catch (err) {
      console.error("Chat error:", err);
      const errorMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Sorry, I encountered an error processing your request. Please try again.",
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async (msgId: string, helpful: boolean) => {
    toast.success(helpful ? "Thanks for the positive feedback!" : "Thanks for the feedback — we'll improve.");
  };

  const renderMessage = (msg: ChatMessage, index: number) => {
    const isUser = msg.role === "user";
    return (
      <div key={msg.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
        <div className={`max-w-[80%] rounded-lg px-4 py-3 ${isUser ? "bg-chat-user text-foreground" : "bg-chat-assistant border text-foreground"}`}>
          <div className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</div>
          {!isUser && msg.sources && msg.sources.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2 border-t pt-2">
              {msg.sources.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedSources(msg.sources || [])}
                  className="inline-flex items-center gap-1 rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
                >
                  <BookOpen className="h-3 w-3" />
                  Source {i + 1}
                </button>
              ))}
            </div>
          )}
          {!isUser && (
            <div className="mt-2 flex items-center gap-2 border-t pt-2">
              <button onClick={() => handleFeedback(msg.id, true)} className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
                <ThumbsUp className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => handleFeedback(msg.id, false)} className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
                <ThumbsDown className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => {
                  const lastUserMsg = messages.slice(0, index).reverse().find((m) => m.role === "user");
                  setTicketModal({
                    question: lastUserMsg?.content || "",
                    answer: msg.content,
                    sources: msg.sources || [],
                  });
                }}
                className="ml-auto flex items-center gap-1 rounded px-2 py-1 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              >
                <Ticket className="h-3.5 w-3.5" />
                Create Ticket
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        {/* Chat Area */}
        <div className="flex flex-1 flex-col">
          <div className="flex-1 overflow-y-auto p-4">
            {messages.length === 0 && (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <BookOpen className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" />
                  <h2 className="mb-2 text-lg font-semibold text-foreground">Ask IKAP</h2>
                  <p className="text-sm text-muted-foreground">
                    Ask a question about IT services, policies, or procedures.
                  </p>
                </div>
              </div>
            )}
            <div className="mx-auto max-w-2xl space-y-4">
              {messages.map((msg, i) => renderMessage(msg, i))}
              {loading && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2 rounded-lg border bg-chat-assistant px-4 py-3">
                    <div className="flex gap-1">
                      <span className="h-2 w-2 rounded-full bg-primary animate-pulse-dot" />
                      <span className="h-2 w-2 rounded-full bg-primary animate-pulse-dot [animation-delay:0.2s]" />
                      <span className="h-2 w-2 rounded-full bg-primary animate-pulse-dot [animation-delay:0.4s]" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input */}
          <div className="border-t bg-card p-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage();
              }}
              className="mx-auto flex max-w-2xl gap-2"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about IT services, MFA, VPN, accounts..."
                className="flex-1 rounded-lg border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                disabled={loading}
              />
              <Button type="submit" disabled={loading || !input.trim()} size="icon">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </form>
          </div>
        </div>

        {/* Sources Panel */}
        <div className="hidden w-80 flex-col border-l bg-source-panel lg:flex">
          <div className="border-b p-4">
            <h3 className="font-semibold text-foreground">Sources</h3>
            <p className="text-xs text-muted-foreground">Referenced KB articles</p>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {selectedSources.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground">
                Sources will appear here when you ask a question.
              </p>
            ) : (
              <div className="space-y-3">
                {selectedSources.map((source, i) => (
                  <div key={i} className="source-card">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded bg-primary text-[10px] font-bold text-primary-foreground">
                        {i + 1}
                      </span>
                      <span className="text-xs font-semibold text-foreground line-clamp-1">
                        {source.article_title}
                      </span>
                    </div>
                    {source.section && (
                      <p className="mb-1 text-[11px] font-medium text-muted-foreground">
                        § {source.section}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground line-clamp-4">{source.snippet}</p>
                    {source.source_url && (
                      <a
                        href={source.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-block text-xs text-primary hover:underline"
                      >
                        View article →
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {ticketModal && (
        <TicketModal
          open={!!ticketModal}
          onClose={() => setTicketModal(null)}
          question={ticketModal.question}
          answer={ticketModal.answer}
          sources={ticketModal.sources}
          sessionId={sessionId}
        />
      )}
    </div>
  );
}
