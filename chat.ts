import Anthropic from "@anthropic-ai/sdk";
import { CLIENTS } from "../clients";

// One deployment serves every client - the client's own site sends its
// businessId so this function picks the right system prompt and origin
// allowlist from clients.ts. Add a new client there, no redeploy of new code.

const client = new Anthropic(); // reads ANTHROPIC_API_KEY from the environment

interface ChatRequestBody {
  businessId?: string;
  message?: string;
  history?: { role: "user" | "assistant"; content: string }[];
}

export default async function handler(req: any, res: any) {
  const origin = req.headers.origin as string | undefined;

  if (req.method === "OPTIONS") {
    applyCors(res, origin, null);
    res.status(204).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  const body: ChatRequestBody = typeof req.body === "string" ? JSON.parse(req.body) : req.body ?? {};
  const { businessId, message } = body;
  const history = Array.isArray(body.history) ? body.history : [];

  const clientConfig = businessId ? CLIENTS[businessId] : undefined;
  if (!clientConfig) {
    res.status(404).json({ error: "unknown_business" });
    return;
  }

  applyCors(res, origin, clientConfig.allowedOrigins);
  if (origin && !clientConfig.allowedOrigins.includes(origin)) {
    res.status(403).json({ error: "origin_not_allowed" });
    return;
  }

  if (!message || typeof message !== "string" || message.length > 2000) {
    res.status(400).json({ error: "invalid_message" });
    return;
  }

  // Each stored turn is one round-trip; cap how much history a single
  // conversation can replay so cost per conversation stays bounded.
  const trimmedHistory = history.slice(-clientConfig.maxTurnsPerConversation * 2);

  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 600,
      system: clientConfig.systemPrompt,
      messages: [...trimmedHistory, { role: "user", content: message }],
    });

    let reply = "";
    for (const block of response.content) {
      if (block.type === "text") {
        reply += block.text;
      }
    }

    res.status(200).json({ reply });
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) {
      res.status(429).json({ error: "rate_limited" });
    } else if (err instanceof Anthropic.APIConnectionError) {
      res.status(502).json({ error: "upstream_unavailable" });
    } else if (err instanceof Anthropic.APIError) {
      console.error("Anthropic API error:", err.status, err.message);
      res.status(502).json({ error: "upstream_error" });
    } else {
      console.error("Unexpected chat handler error:", err);
      res.status(500).json({ error: "internal_error" });
    }
  }
}

function applyCors(res: any, origin: string | undefined, allowedOrigins: string[] | null) {
  if (origin && (allowedOrigins === null || allowedOrigins.includes(origin))) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}
