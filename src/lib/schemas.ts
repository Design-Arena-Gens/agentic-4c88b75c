import { z } from "zod";

export const SourceSchema = z.object({
  title: z.string().min(1, "Source title is required."),
  url: z.string().url("Source URL must be valid."),
});

export const ClientMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1, "Message content cannot be empty.").max(4000),
});

export const ChatRequestSchema = z.object({
  messages: z.array(ClientMessageSchema).min(1).max(24),
});

export const AgentResponseSchema = z.object({
  final: z.string().min(1),
  plan: z.array(z.string().min(1)).max(6).optional(),
  insights: z.array(z.string().min(1)).max(6).optional(),
  confidence: z.number().min(0).max(1).optional(),
  sources: z.array(SourceSchema).max(5).optional(),
  followUp: z.array(z.string().min(1)).max(4).optional(),
});

export type ClientMessage = z.infer<typeof ClientMessageSchema>;
export type AgentResponsePayload = z.infer<typeof AgentResponseSchema>;
export type Source = z.infer<typeof SourceSchema>;
