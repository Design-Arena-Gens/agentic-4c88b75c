import OpenAI from "openai";
import { NextResponse } from "next/server";
import {
  AgentResponseSchema,
  ChatRequestSchema,
  ClientMessage,
} from "@/lib/schemas";

const MODEL_NAME = process.env.OPENAI_MODEL ?? "gpt-4.1-mini";

const SYSTEM_PROMPT = `
You are Atlas, a pragmatic AI agent that helps users accomplish their goals with clear, structured guidance.

Always return JSON that strictly matches the provided schema. When relevant, outline a concise plan (≤6 steps), highlight key insights, reference credible sources, and offer practical follow-up ideas.

Guidelines:
- Keep language direct and user-focused.
- Only include plan steps when they genuinely move the task forward.
- Insights should be short facts, metrics, or takeaways.
- Confidence reflects how certain you are in the final answer (0 to 1).
- Only cite sources that directly informed your response.
- If you cannot comply, set "final" to an apology and omit other fields.
`.trim();

type ToolFriendlyMessage = ClientMessage & { role: "user" | "assistant" };

export async function POST(req: Request) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "OPENAI_API_KEY is not set. Add it to your environment before using the agent.",
      },
      { status: 500 },
    );
  }

  try {
    const json = await req.json();
    const parsed = ChatRequestSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request payload.", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const messages: ToolFriendlyMessage[] = parsed.data.messages.map(
      (message) => ({
        role: message.role,
        content: message.content,
      }),
    );

    const client = new OpenAI({ apiKey });

    const response = await client.responses.create({
      model: MODEL_NAME,
      input: [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
        ...messages,
      ],
      text: {
        format: {
          type: "json_schema",
          name: "AgentResponse",
          schema: {
            type: "object",
            properties: {
              final: { type: "string" },
              plan: {
                type: "array",
                items: { type: "string" },
                maxItems: 6,
              },
              insights: {
                type: "array",
                items: { type: "string" },
                maxItems: 6,
              },
              confidence: {
                type: "number",
                minimum: 0,
                maximum: 1,
              },
              sources: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    url: { type: "string", format: "uri" },
                  },
                  required: ["title", "url"],
                  additionalProperties: false,
                },
                maxItems: 5,
              },
              followUp: {
                type: "array",
                items: { type: "string" },
                maxItems: 4,
              },
            },
            required: ["final"],
            additionalProperties: false,
          },
        },
      },
    });

    const rawOutput = response.output_text;

    if (!rawOutput) {
      throw new Error("The model returned an empty response.");
    }

    const parsedResponse = AgentResponseSchema.parse(JSON.parse(rawOutput));

    return NextResponse.json({
      reply: parsedResponse.final,
      plan: parsedResponse.plan ?? [],
      insights: parsedResponse.insights ?? [],
      confidence: parsedResponse.confidence ?? null,
      sources: parsedResponse.sources ?? [],
      followUp: parsedResponse.followUp ?? [],
      usage: response.usage,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred.";

    console.error("[Agent::POST]", message);

    return NextResponse.json(
      {
        error: "The agent encountered an error while processing your request.",
        details: message,
      },
      { status: 500 },
    );
  }
}
