import { buildBot } from "../src/bot";

const env = {
  BOT_TOKEN: process.env.BOT_TOKEN,
  DATABASE_URL: process.env.DATABASE_URL,
  OWNER_ID: process.env.OWNER_ID,
  WEBHOOK_SECRET: process.env.WEBHOOK_SECRET,
} as Env;

const bot = buildBot(env);

await bot.api.setMyCommands([
  { command: "add", description: "Store an email: /add <email> [label]" },
  { command: "del", description: "Remove an email: /del <email>" },
  { command: "list", description: "Show stored emails" },
  { command: "help", description: "Show usage" },
]);

bot.start({
  drop_pending_updates: true,
  onStart: (info) => console.log(`polling as @${info.username}`),
});
