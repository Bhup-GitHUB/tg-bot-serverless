import { Bot, type Context } from "grammy";
import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { emails } from "./db/schema";
import { isAuthorized, parseAuthorizedIds } from "./auth";
import * as messages from "./messages";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isValidEmail = (value: string) => EMAIL_PATTERN.test(value);

const reply = (ctx: Context, text: string) =>
  ctx.reply(text, { parse_mode: "HTML" });

export const buildBot = (env: Env) => {
  const bot = new Bot(env.BOT_TOKEN);
  const db = getDb(env);
  const authorizedIds = parseAuthorizedIds(env.AUTHORIZED_IDS);

  bot.use(async (ctx, next) => {
    if (!isAuthorized(authorizedIds, ctx.from?.id)) {
      await reply(ctx, messages.notAuthorized(String(ctx.from?.id ?? "unknown")));
      return;
    }
    await next();
  });

  bot.command(["start", "help"], (ctx) => reply(ctx, messages.WELCOME));

  bot.command("add", async (ctx) => {
    const parts = ctx.match.trim().split(/\s+/).filter(Boolean);
    const email = parts.shift() ?? "";
    const label = parts.join(" ") || null;

    if (!isValidEmail(email)) {
      await reply(ctx, messages.ADD_USAGE);
      return;
    }

    const inserted = await db
      .insert(emails)
      .values({ email, label })
      .onConflictDoNothing({ target: emails.email })
      .returning({ id: emails.id });

    await reply(
      ctx,
      inserted.length > 0
        ? messages.added(email, label)
        : messages.alreadyExists(email),
    );
  });

  bot.command("del", async (ctx) => {
    const email = ctx.match.trim();

    if (!isValidEmail(email)) {
      await reply(ctx, messages.DEL_USAGE);
      return;
    }

    const deleted = await db
      .delete(emails)
      .where(eq(emails.email, email))
      .returning({ id: emails.id });

    await reply(
      ctx,
      deleted.length > 0 ? messages.removed(email) : messages.notInList(email),
    );
  });

  bot.command("list", async (ctx) => {
    const rows = await db.select().from(emails).orderBy(emails.createdAt);

    await reply(
      ctx,
      rows.length > 0 ? messages.formatList(rows) : messages.LIST_EMPTY,
    );
  });

  bot.on("message", (ctx) => reply(ctx, messages.UNKNOWN));

  bot.catch((err) => {
    console.error("bot error", err.error);
  });

  return bot;
};
