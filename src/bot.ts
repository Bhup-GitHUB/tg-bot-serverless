import { Bot, type Context } from "grammy";
import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { emails } from "./db/schema";
import { isValidUserId, parseIds } from "./auth";
import { addUser, isKnownUser, listUsers, removeUser } from "./users";
import * as messages from "./messages";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isValidEmail = (value: string) => EMAIL_PATTERN.test(value);

const reply = (ctx: Context, text: string) =>
  ctx.reply(text, { parse_mode: "HTML" });

export const buildBot = (env: Env) => {
  const bot = new Bot(env.BOT_TOKEN);
  const db = getDb(env);
  const adminIds = parseIds(env.ADMIN_IDS);

  const isAdmin = (ctx: Context) => adminIds.has(String(ctx.from?.id ?? ""));

  bot.use(async (ctx, next) => {
    const id = String(ctx.from?.id ?? "");
    const allowed = adminIds.has(id) || (await isKnownUser(db, id));
    if (!allowed) {
      await reply(ctx, messages.notAuthorized(id));
      return;
    }
    await next();
  });

  bot.command(["start", "help"], (ctx) =>
    reply(ctx, isAdmin(ctx) ? messages.WELCOME_ADMIN : messages.WELCOME),
  );

  bot.command("add", async (ctx) => {
    const raw = ctx.match.trim();

    if (raw.includes(",")) {
      const candidates = [
        ...new Set(
          raw
            .split(",")
            .map((value) => value.trim())
            .filter(Boolean),
        ),
      ];
      const valid = candidates.filter(isValidEmail);
      const invalid = candidates.filter((value) => !isValidEmail(value));

      if (valid.length === 0) {
        await reply(ctx, messages.ADD_USAGE);
        return;
      }

      const insertedRows = await db
        .insert(emails)
        .values(valid.map((email) => ({ email, label: null })))
        .onConflictDoNothing({ target: emails.email })
        .returning({ email: emails.email });

      const added = insertedRows.map((row) => row.email);
      const addedSet = new Set(added);
      const existed = valid.filter((email) => !addedSet.has(email));

      await reply(ctx, messages.addedBulk(added, existed, invalid));
      return;
    }

    const parts = raw.split(/\s+/).filter(Boolean);
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

  bot.command("adduser", async (ctx) => {
    if (!isAdmin(ctx)) {
      await reply(ctx, messages.ADMINS_ONLY);
      return;
    }

    const id = ctx.match.trim();
    if (!isValidUserId(id)) {
      await reply(ctx, messages.ADD_USER_USAGE);
      return;
    }

    const added = await addUser(db, id, String(ctx.from?.id));
    await reply(
      ctx,
      added.length > 0 ? messages.userAdded(id) : messages.userExists(id),
    );
  });

  bot.command("deluser", async (ctx) => {
    if (!isAdmin(ctx)) {
      await reply(ctx, messages.ADMINS_ONLY);
      return;
    }

    const id = ctx.match.trim();
    if (!isValidUserId(id)) {
      await reply(ctx, messages.DEL_USER_USAGE);
      return;
    }

    if (adminIds.has(id)) {
      await reply(ctx, messages.cannotRemoveAdmin(id));
      return;
    }

    const removed = await removeUser(db, id);
    await reply(
      ctx,
      removed.length > 0 ? messages.userRemoved(id) : messages.userNotFound(id),
    );
  });

  bot.command("users", async (ctx) => {
    if (!isAdmin(ctx)) {
      await reply(ctx, messages.ADMINS_ONLY);
      return;
    }

    const members = await listUsers(db);
    await reply(ctx, messages.formatUsers([...adminIds], members));
  });

  bot.on("message", (ctx) => reply(ctx, messages.UNKNOWN));

  bot.catch((err) => {
    console.error("bot error", err.error);
  });

  return bot;
};
