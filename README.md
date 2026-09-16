# Marea Digital - Chatbot Backend

One backend serves the AI chatbot for every client. Each client gets a `businessId`
entry in `clients.ts` (their own system prompt, allowed website, and conversation cap).
Their site embeds `widget-example.html`'s script, pointed at your deployed URL.

## Deploy (one-time setup)

1. Create a free account at vercel.com and install their CLI: `npm i -g vercel`
2. From this folder, run `vercel` and follow the prompts (link or create a new project)
3. Add your Anthropic API key as a secret: `vercel env add ANTHROPIC_API_KEY`
   (paste your key from console.anthropic.com when prompted; choose Production + Preview)
4. Deploy: `vercel --prod`
5. Note the URL it gives you (e.g. `https://marea-digital-chatbot.vercel.app`) -
   that's your `API_URL` for every client's widget.

## Onboarding a new client

1. Open `clients.ts`, add a new entry with their `businessId`, business info as
   the `systemPrompt`, their real domain in `allowedOrigins`, and a
   `monthlyConversationCap` matching the package they bought (500 for Sistema
   de Crecimiento, 2000 for Sistema Pro).
2. Redeploy: `vercel --prod`
3. Copy `widget-example.html`'s `<script>` block into their site, set `API_URL`
   to your deployment URL and `BUSINESS_ID` to the key you just added.

## Notes

- `monthlyConversationCap` is not yet enforced automatically - it documents the
  fair-use number from the site. Worth adding real usage tracking (a simple
  database counter) before this scales past a couple of clients.
- The API key never reaches the browser - it only lives in Vercel's environment,
  read server-side by `api/chat.ts`.
