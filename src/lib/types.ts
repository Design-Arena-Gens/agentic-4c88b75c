import type { AgentResponsePayload, Source } from "./schemas";

export type AgentRole = "user" | "assistant";

export interface AgentMessage
  extends Pick<
      AgentResponsePayload,
      "plan" | "insights" | "confidence" | "sources" | "followUp"
    > {
  id: string;
  role: AgentRole;
  content: string;
  createdAt: string;
  status?: "pending" | "complete" | "error";
  error?: string;
}

export interface AgentSummary {
  plan?: string[];
  insights?: string[];
  sources?: Source[];
  followUp?: string[];
  confidence?: number;
}
