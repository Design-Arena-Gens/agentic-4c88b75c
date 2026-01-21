"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { AgentMessage } from "@/lib/types";

interface MessageBubbleProps {
  message: AgentMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={[
          "relative max-w-2xl rounded-3xl border px-5 py-4 text-sm shadow-2xl transition-all",
          isUser
            ? "border-blue-500/30 bg-blue-500/10 backdrop-blur"
            : "border-white/10 bg-white/5 backdrop-blur",
        ].join(" ")}
      >
        <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wide text-white/60">
          <span
            className={`h-2 w-2 rounded-full ${
              isUser ? "bg-blue-400" : "bg-emerald-400"
            }`}
          />
          {isUser ? "You" : "Atlas"}
          <span className="text-[10px] uppercase text-white/40">
            {new Date(message.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>

        <div className="markdown text-white/90">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {message.content}
          </ReactMarkdown>
        </div>

        {message.plan && message.plan.length > 0 && (
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/60">
              Plan
            </p>
            <ol className="mt-2 space-y-2 text-sm text-white/85">
              {message.plan.map((step, index) => (
                <li key={step} className="flex items-start gap-3">
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-xs font-semibold text-white/80">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {message.insights && message.insights.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {message.insights.map((insight) => (
              <span
                key={insight}
                className="inline-flex items-center rounded-full border border-white/15 bg-white/[0.05] px-3 py-1 text-xs text-white/80"
              >
                {insight}
              </span>
            ))}
          </div>
        )}

        {message.followUp && message.followUp.length > 0 && (
          <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-xs text-emerald-100">
            <p className="font-semibold uppercase tracking-wide text-emerald-100/80">
              Follow-up Ideas
            </p>
            <ul className="mt-2 space-y-1.5">
              {message.followUp.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-1 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-200/80" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {message.error && (
          <div className="mt-4 rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-xs text-rose-200">
            {message.error}
          </div>
        )}
      </div>
    </div>
  );
}
