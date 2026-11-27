# LocalMind Cloud AI API

A minimal OpenAI-compatible API for LocalMind, implemented as a Cloudflare Worker and backed by the Cloudflare Workers AI binding.

## Routes

- `GET /` and `GET /health` — public health check.
- `GET /v1/models` — authenticated model list.
- `POST /v1/chat/completions` — authenticated chat completion; supports OpenAI-style message history and SSE streaming.

## Deploy

Requirements: a Cloudflare account with Workers AI enabled, Node.js, and Wrangler.

1. From this directory, authenticate:

   ```sh
   npx wrangler login
   ```

2. Set a long random API key as a Worker secret:

   ```sh
   npx wrangler secret put LOCALMIND_API_KEY
   ```

3. Deploy:

   ```sh
   npx wrangler deploy
   ```

Wrangler prints the Worker URL. Keep the API key private. Do not commit it or put it in the Android source code.

## Connect LocalMind

In LocalMind, add a remote OpenAI-compatible model with:

- Server URL: the Worker URL (without `/v1`)
- API key: the value stored as `LOCALMIND_API_KEY`
- Server type: OpenAI / Unknown (the default OpenAI-compatible profile)

The app will request `GET /v1/models`, then send chat turns to `POST /v1/chat/completions`.

## Change the model

Change `AI_MODEL` in `wrangler.toml` to a Workers AI model enabled for your Cloudflare account, then deploy again. Model availability, free quota, context limits, and streaming support depend on Cloudflare's current plan and model catalog; verify them in the Cloudflare dashboard before relying on a model.

## Smoke test

```sh
curl https://YOUR-WORKER.workers.dev/health

curl https://YOUR-WORKER.workers.dev/v1/models \
  -H "Authorization: Bearer YOUR_LOCALMIND_API_KEY"

curl https://YOUR-WORKER.workers.dev/v1/chat/completions \
  -H "Authorization: Bearer YOUR_LOCALMIND_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"@cf/zai-org/glm-4.7-flash","messages":[{"role":"user","content":"Привет"}],"stream":false}'
```

## Security notes

- The API key is checked server-side and must be stored as a Worker secret.
- The mobile client stores its entered server key in the platform keychain.
- A shared key embedded in a public APK can still be extracted by a determined user. Before public distribution, add per-user authentication or a gateway that issues revocable user tokens and enforces per-user quotas.
- CORS is permissive for mobile compatibility; it is not an authentication mechanism.
- This Worker does not store conversation history. LocalMind sends the current conversation history with each request.
