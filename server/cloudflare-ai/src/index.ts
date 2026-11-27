export interface Env {
  AI: {
    run(model: string, input: Record<string, unknown>): Promise<any>;
  };
  LOCALMIND_API_KEY: string;
  AI_MODEL?: string;
}

const MODEL_DEFAULT = "@cf/zai-org/glm-4.7-flash";
const MAX_BODY_BYTES = 1_000_000;
const MAX_MESSAGES = 80;
const MAX_OUTPUT_TOKENS = 2048;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
  "Access-Control-Max-Age": "86400",
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {...corsHeaders, "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store"},
  });
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function authorized(request: Request, env: Env): boolean {
  const expected = env.LOCALMIND_API_KEY;
  const supplied = request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  return Boolean(expected && supplied && constantTimeEqual(supplied, expected));
}

function validMessages(value: unknown): value is Array<{role: string; content: string}> {
  return Array.isArray(value) &&
    value.length > 0 &&
    value.length <= MAX_MESSAGES &&
    value.every((item: any) =>
      item && typeof item === "object" &&
      ["system", "user", "assistant"].includes(item.role) &&
      typeof item.content === "string" &&
      item.content.length <= 100_000
    );
}

function sseChunk(id: string, model: string, content: string): string {
  return `data: ${JSON.stringify({
    id, object: "chat.completion.chunk", created: Math.floor(Date.now() / 1000),
    model, choices: [{index: 0, delta: {content}, finish_reason: null}],
  })}\n\n`;
}

async function streamAsOpenAI(source: ReadableStream<Uint8Array>, model: string): Promise<Response> {
  const id = `chatcmpl-${crypto.randomUUID()}`;
  const reader = source.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";
  let closed = false;

  const body = new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        while (!closed) {
          const {value, done} = await reader.read();
          if (done) {
            buffer += decoder.decode();
            closed = true;
            if (buffer.trim()) emitLines(buffer, controller, id, model, encoder);
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
            return;
          }
          buffer += decoder.decode(value, {stream: true});
          const boundary = buffer.lastIndexOf("\n");
          if (boundary >= 0) {
            const ready = buffer.slice(0, boundary + 1);
            buffer = buffer.slice(boundary + 1);
            emitLines(ready, controller, id, model, encoder);
            return;
          }
        }
      } catch {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({error:{message:"AI stream interrupted",type:"server_error"}})}\n\n`));
        controller.close();
      }
    },
    cancel() {
      closed = true;
      return reader.cancel();
    },
  });

  return new Response(body, {
    headers: {...corsHeaders, "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-cache, no-transform", "Connection": "keep-alive"},
  });
}

function emitLines(text: string, controller: ReadableStreamDefaultController<Uint8Array>, id: string, model: string, encoder: TextEncoder) {
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("data:")) continue;
    const payload = trimmed.slice(5).trim();
    if (!payload || payload === "[DONE]") continue;
    try {
      const parsed = JSON.parse(payload);
      const token = typeof parsed.response === "string" ? parsed.response : "";
      if (token) controller.enqueue(encoder.encode(sseChunk(id, model, token)));
    } catch {
      // Ignore non-JSON provider heartbeat or metadata frames.
    }
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return new Response(null, {status: 204, headers: corsHeaders});

    if (request.method === "GET" && (url.pathname === "/" || url.pathname === "/health")) {
      return json({ok: true, service: "LocalMind AI API", status: "online"});
    }

    if (url.pathname === "/v1/models" && request.method === "GET") {
      if (!authorized(request, env)) return json({error: {message: "Unauthorized", type: "authentication_error"}}, 401);
      const model = env.AI_MODEL || MODEL_DEFAULT;
      return json({object: "list", data: [{id: model, object: "model", created: 0, owned_by: "localmind"}]});
    }

    if (url.pathname === "/v1/chat/completions" && request.method === "POST") {
      if (!authorized(request, env)) return json({error: {message: "Unauthorized", type: "authentication_error"}}, 401);
      const declaredLength = Number(request.headers.get("Content-Length") || 0);
      if (declaredLength > MAX_BODY_BYTES) return json({error: {message: "Request body too large", type: "invalid_request_error"}}, 413);

      let rawBody: string;
      try { rawBody = await request.text(); } catch { return json({error: {message: "Could not read request body", type: "invalid_request_error"}}, 400); }
      if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES) return json({error: {message: "Request body too large", type: "invalid_request_error"}}, 413);
      let body: any;
      try { body = JSON.parse(rawBody); } catch { return json({error: {message: "Invalid JSON body", type: "invalid_request_error"}}, 400); }
      if (!validMessages(body.messages)) return json({error: {message: "messages must contain 1–80 text messages with system, user or assistant roles", type: "invalid_request_error"}}, 400);

      const model = env.AI_MODEL || MODEL_DEFAULT;
      const max_tokens = Math.min(Math.max(Number(body.max_tokens ?? body.max_completion_tokens ?? 1024) || 1024, 1), MAX_OUTPUT_TOKENS);
      const input = {
        messages: body.messages,
        max_tokens,
        ...(Number.isFinite(body.temperature) ? {temperature: Math.min(Math.max(body.temperature, 0), 2)} : {}),
      };

      try {
        if (body.stream === true) {
          const result = await env.AI.run(model, {...input, stream: true});
          if (result instanceof ReadableStream) return streamAsOpenAI(result as ReadableStream<Uint8Array>, model);
          if (result?.getReader) return streamAsOpenAI(result as ReadableStream<Uint8Array>, model);
          return json({error: {message: "Selected AI model does not provide streaming output", type: "server_error"}}, 502);
        }

        const result = await env.AI.run(model, input);
        const content = typeof result?.response === "string" ? result.response : "";
        if (!content) return json({error: {message: "AI model returned an empty response", type: "server_error"}}, 502);
        return json({
          id: `chatcmpl-${crypto.randomUUID()}`, object: "chat.completion",
          created: Math.floor(Date.now() / 1000), model,
          choices: [{index: 0, message: {role: "assistant", content}, finish_reason: "stop"}],
          usage: {prompt_tokens: 0, completion_tokens: 0, total_tokens: 0},
        });
      } catch (error) {
        return json({error: {message: error instanceof Error ? error.message : "AI provider request failed", type: "server_error"}}, 502);
      }
    }

    return json({error: {message: "Not found", type: "invalid_request_error"}}, 404);
  },
};
