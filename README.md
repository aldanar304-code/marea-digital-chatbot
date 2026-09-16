# Marea Digital - Chatbot

One backend serves the AI chatbot for every client. Each client gets a `businessId`
entry in `clients.ts` (their own system prompt, allowed website, and conversation cap).
Their site embeds `widget-example.html`'s script, pointed at your deployed URL.

## Deploy

1. Import this repository into Vercel.
2. Deploy on the Hobby plan for private testing.
3. Open the generated URL. The homepage includes the Marea Digital chat.

This version uses predefined FAQ replies and does not require an API key or paid AI provider.

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
- Replies are intentionally limited to the FAQ logic in `api/chat.ts`.
- For AI-generated replies later, restore a server-side provider integration and
   store its key only in Vercel environment variables.
