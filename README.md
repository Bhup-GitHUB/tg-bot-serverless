# tg-bot-serverless

A personal Telegram bot for storing, deleting, and listing email addresses in a
Neon serverless Postgres database. Runs on Cloudflare Workers via webhook.

## Stack

- Cloudflare Workers (workerd runtime, webhook-driven)
- grammy for the Telegram bot
- Neon serverless Postgres over the HTTP driver
- Drizzle ORM and drizzle-kit for schema and migrations
- Bun as package manager and script runner

## Commands

- `/add <email> [label]` store an email with an optional label
- `/del <email>` remove an email
- `/list` show stored emails
- `/help` show usage

Access is restricted to the numeric Telegram ids listed in `AUTHORIZED_IDS`
(comma-separated). Anyone else gets a message showing their own id so they can
request access.

## Setup

1. Create a Neon project and copy the connection string into `DATABASE_URL`.
2. Create a bot with @BotFather and copy the token into `BOT_TOKEN`.
3. Get your numeric Telegram id (message the bot once; the reply shows it) and set
   it as `AUTHORIZED_IDS`. Add more users by comma-separating their ids.
4. Choose any random string for `WEBHOOK_SECRET`.
5. Copy `.dev.vars.example` to `.dev.vars` and fill in the four values.
6. Create the table in Neon:

   ```
   bun run db:push
   ```

## Local development

```
bun install
bun run dev
```

To test live in Telegram without deploying or owning a domain, run the bot in
long-polling mode (this pulls updates directly from Telegram):

```
bun run dev:poll
```

Stop it before setting a production webhook, since polling and a webhook cannot
both be active on the same bot.

To exercise the webhook path locally instead, post a simulated update to the local
worker. The secret header must match `WEBHOOK_SECRET`, and the `entities` array is
required (that is how Telegram, and grammy, recognize a command):

```
curl -X POST http://localhost:8787/webhook \
  -H "Content-Type: application/json" \
  -H "X-Telegram-Bot-Api-Secret-Token: <WEBHOOK_SECRET>" \
  -d '{"update_id":1,"message":{"message_id":1,"date":0,"chat":{"id":<YOUR_ID>,"type":"private"},"from":{"id":<YOUR_ID>,"is_bot":false,"first_name":"me"},"text":"/add test@example.com work","entities":[{"offset":0,"length":4,"type":"bot_command"}]}}'
```

Inspect the database with `bun run db:studio`.

## Deploy

```
wrangler secret put BOT_TOKEN
wrangler secret put DATABASE_URL
wrangler secret put WEBHOOK_SECRET
```

Set `AUTHORIZED_IDS` in `wrangler.jsonc` under `vars`, then deploy:

```
bun run deploy
```

Register the webhook. Telegram rejects the `*.workers.dev` TLS certificate, so a
custom domain is required for the worker.

```
curl "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook" \
  -d url=https://<your-domain>/webhook \
  -d secret_token=<WEBHOOK_SECRET>
```

## Scripts

- `bun run dev` run the worker locally
- `bun run deploy` deploy to Cloudflare
- `bun run typecheck` type-check with tsc
- `bun run cf-typegen` regenerate worker types after editing `wrangler.jsonc`
- `bun run db:generate` generate a migration from the schema
- `bun run db:push` apply the schema directly to the database
- `bun run db:studio` open Drizzle Studio
