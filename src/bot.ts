import { Bot } from "grammy";
import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { emails } from "./db/schema";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const HELP_TEXT = [
  "Email manager bot.",
  "",
  "/add <email> [label] - store an email",
  "/del <email> - remove an email",
  "/list - show stored emails",
  "/help - show this message",
].join("\n");

const isValidEmail = (value: string) => EMAIL_PATTERN.test(value);

const formatEmail = (row: typeof emails.$inferSelect) => {
  const date = row.createdAt.toISOString().slice(0, 10);
  const label = row.label ? ` (${row.label})` : "";
  return `- ${row.email}${label} [${date}]`;
};

export const buildBot = (env: Env) => {
  const bot = new Bot(env.BOT_TOKEN);
  const db = getDb(env);

  bot.use(async (ctx, next) => {
    if (String(ctx.from?.id) !== env.OWNER_ID) {
      await ctx.reply("Not authorized.");
      return;
    }
    await next();
  });

  bot.command(["start", "help"], (ctx) => ctx.reply(HELP_TEXT));

  bot.command("add", async (ctx) => {
    const parts = ctx.match.trim().split(/\s+/);
    const email = parts.shift() ?? "";
    const label = parts.join(" ").trim() || null;

    if (!isValidEmail(email)) {
      await ctx.reply("Usage: /add <email> [label]");
      return;
    }

    console.log("DBG add: before insert", email);
    let inserted;
    try {
      inserted = await db
        .insert(emails)
        .values({ email, label })
        .onConflictDoNothing({ target: emails.email })
        .returning({ id: emails.id });
      console.log("DBG add: insert ok", JSON.stringify(inserted));
    } catch (e) {
      console.log("DBG add: insert THREW", String(e));
      throw e;
    }

    await ctx.reply(
      inserted.length > 0 ? `Added ${email}` : `${email} already exists`,
    );
  });

  bot.command("del", async (ctx) => {
    const email = ctx.match.trim();

    if (!isValidEmail(email)) {
      await ctx.reply("Usage: /del <email>");
      return;
    }

    const deleted = await db
      .delete(emails)
      .where(eq(emails.email, email))
      .returning({ id: emails.id });

    await ctx.reply(
      deleted.length > 0 ? `Removed ${email}` : `${email} not found`,
    );
  });

  bot.command("list", async (ctx) => {
    const rows = await db.select().from(emails).orderBy(emails.createdAt);

    if (rows.length === 0) {
      await ctx.reply("No emails stored.");
      return;
    }

    await ctx.reply(rows.map(formatEmail).join("\n"));
  });

  bot.catch((err) => {
    console.error("bot error", err.error);
  });

  return bot;
};
