"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MessageBubble } from "@/components/message-bubble";
import type { AgentMessage, AgentRole } from "@/lib/types";
import type { ClientMessage, Source } from "@/lib/schemas";

const EXAMPLE_PROMPTS = [
  "Create a 3-step launch plan for a productivity app targeting remote teams.",
  "Summarize the latest trends in AI agents and suggest follow-up research topics.",
  "Break down how to automate a weekly analytics report using low-code tools.",
];

const QUICK_ACTIONS = [
  "Draft an onboarding checklist for new engineers joining a startup.",
  "Design a personal learning sprint to master prompt engineering in two weeks.",
  "Outline a marketing experiment to test a new landing page concept.",
];

function createMessage(
  role: AgentRole,
  content: string,
  extras: Partial<AgentMessage> = {},
): AgentMessage {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);

  return {
    id,
    role,
    content,
    createdAt: new Date().toISOString(),
    ...extras,
  };
}

function ConfidenceBadge({ value }: { value?: number | null }) {
  if (value === null || value === undefined) {
    return null;
  }

  const score = Math.round(value * 100);
  const tier =
    score >= 80 ? "High" : score >= 50 ? "Moderate" : score > 0 ? "Low" : "None";

  return (
    <div className="rounded-2xl border border-amber-400/40 bg-amber-400/10 px-4 py-3 text-xs text-amber-100">
      <p className="font-semibold uppercase tracking-wide text-amber-200/80">
        Confidence
      </p>
      <div className="mt-2 flex items-center justify-between text-sm">
        <span className="text-amber-50">{tier}</span>
        <span className="font-mono text-amber-200">{score}%</span>
      </div>
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-amber-200/20">
        <div
          className="h-full rounded-full bg-amber-300 transition-all"
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

function SourceList({ sources }: { sources: Source[] }) {
  if (sources.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-white/60">
        Sources
      </p>
      <ul className="space-y-2 text-sm text-white/85">
        {sources.map((source) => (
          <li key={source.url}>
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-2 text-sky-300 transition hover:text-sky-200"
            >
              <span className="truncate">{source.title}</span>
              <span
                aria-hidden
                className="inline-block translate-x-0 text-xs opacity-0 transition group-hover:translate-x-1 group-hover:opacity-100"
              >
                ↗
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Home() {
  const [messages, setMessages] = useState<AgentMessage[]>([
    createMessage(
      "assistant",
      "👋 Hi, I’m Atlas — your autonomous agent for research, planning, and strategy. Share a goal or challenge and I’ll break it into clear next steps.",
      {
        plan: ["Outline your objective", "Highlight constraints", "Share data or context"],
        insights: [
          "Atlas can synthesize research from cited sources",
          "You’ll always receive a confidence score",
        ],
        followUp: ["Ask for a plan", "Request research", "Brainstorm experiments"],
      },
    ),
  ]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const latestAssistant = useMemo(
    () =>
      [...messages]
        .reverse()
        .find((message) => message.role === "assistant" && message.status !== "error"),
    [messages],
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  const sendMessage = async (prompt: string) => {
    if (!prompt.trim() || isSending) {
      return;
    }

    setError(null);
    const userMessage = createMessage("user", prompt.trim());

    setMessages((current) => [...current, userMessage]);
    setInput("");
    setIsSending(true);

    const pendingAssistant = createMessage(
      "assistant",
      "_Thinking…_",
      {
        status: "pending",
      },
    );

    setMessages((current) => [...current, pendingAssistant]);

    const payload: { messages: ClientMessage[] } = {
      messages: [...messages, userMessage]
        .filter((message) => message.role !== "assistant" || message.status !== "pending")
        .map((message) => ({
          role: message.role,
          content: message.content,
        })),
    };

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? "Unable to reach the agent.");
      }

      const data = await response.json();

      setMessages((current) =>
        current.map((message) =>
          message.id === pendingAssistant.id
            ? {
                ...message,
                content: data.reply,
                plan: data.plan,
                insights: data.insights,
                followUp: data.followUp,
                confidence: data.confidence,
                sources: data.sources,
                status: "complete",
              }
            : message,
        ),
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unexpected error talking to the agent.";
      setError(message);
      setMessages((current) =>
        current.map((entry) =>
          entry.id === pendingAssistant.id
            ? {
                ...entry,
                content: "Something went wrong while connecting to the model.",
                error: message,
                status: "error",
              }
            : entry,
        ),
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void sendMessage(input);
  };

  const handlePromptClick = (prompt: string) => {
    setInput(prompt);
    requestAnimationFrame(() => {
      void sendMessage(prompt);
    });
  };

  const resetConversation = () => {
    setMessages((current) => current.slice(0, 1));
    setInput("");
    setError(null);
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#05060c] text-white">
      <header className="border-b border-white/5 bg-black/30 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/50">
              Atlas Agent
            </p>
            <h1 className="mt-1 text-xl font-semibold text-white/90">
              Operate faster with an autonomous copilot
            </h1>
          </div>
          <button
            onClick={resetConversation}
            className="rounded-full border border-white/15 bg-white/[0.03] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-white/[0.08]"
          >
            New Session
          </button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col-reverse gap-6 px-4 pb-12 pt-6 lg:flex-row">
        <section className="flex w-full flex-1 flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] shadow-[0_30px_120px_-60px_rgba(65,105,225,0.4)] backdrop-blur">
          <div className="flex-1 space-y-6 overflow-y-auto px-6 py-8">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form
            onSubmit={handleSubmit}
            className="border-t border-white/10 bg-black/40 p-6 backdrop-blur"
          >
            <div className="flex items-end gap-3">
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask Atlas to plan, research, or reason through your next move…"
                rows={3}
                className="w-full resize-none rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white shadow-inner outline-none transition focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/40"
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void sendMessage(input);
                  }
                }}
              />
              <button
                type="submit"
                disabled={isSending || !input.trim()}
                className="flex h-12 w-24 items-center justify-center rounded-2xl bg-sky-500 text-sm font-semibold uppercase tracking-wide text-black transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-white/20 disabled:text-white/60"
              >
                {isSending ? (
                  <span className="flex items-center gap-2 text-xs uppercase">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
                    Sending
                  </span>
                ) : (
                  "Send"
                )}
              </button>
            </div>
            {error && (
              <p className="mt-3 text-xs text-rose-300/80">⚠️ {error}</p>
            )}
          </form>
        </section>

        <aside className="flex w-full flex-col gap-4 lg:max-w-sm">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/40">
              Latest Summary
            </p>
            <h2 className="mt-2 text-lg font-semibold text-white/90">
              Agent Snapshot
            </h2>

            {latestAssistant?.plan && latestAssistant.plan.length > 0 && (
              <div className="mt-4 space-y-3">
                <p className="text-xs uppercase tracking-wide text-white/50">Active Plan</p>
                <ol className="space-y-2 text-sm text-white/85">
                  {latestAssistant.plan.map((step, index) => (
                    <li key={step} className="flex items-start gap-3">
                      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-xs font-semibold text-white/70">
                        {index + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {latestAssistant?.insights && latestAssistant.insights.length > 0 && (
              <div className="mt-4">
                <p className="text-xs uppercase tracking-wide text-white/50">Signals</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {latestAssistant.insights.map((insight) => (
                    <span
                      key={insight}
                      className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs text-white/70"
                    >
                      {insight}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <ConfidenceBadge value={latestAssistant?.confidence ?? null} />

            {latestAssistant?.sources && latestAssistant.sources.length > 0 && (
              <div className="mt-4">
                <SourceList sources={latestAssistant.sources} />
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/40">
              Quick Start
            </p>
            <h2 className="mt-2 text-lg font-semibold text-white/90">
              Try These Prompts
            </h2>
            <div className="mt-4 space-y-3">
              {EXAMPLE_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => handlePromptClick(prompt)}
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-left text-xs text-white/75 transition hover:border-sky-500/40 hover:bg-sky-500/10"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/40">
              Automations
            </p>
            <h2 className="mt-2 text-lg font-semibold text-white/90">
              One-Tap Actions
            </h2>
            <div className="mt-4 space-y-3">
              {QUICK_ACTIONS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => handlePromptClick(prompt)}
                  className="w-full rounded-2xl border border-sky-500/40 bg-sky-500/10 px-4 py-3 text-left text-xs text-sky-100 transition hover:bg-sky-500/20"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
