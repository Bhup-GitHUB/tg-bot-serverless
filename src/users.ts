import { eq } from "drizzle-orm";
import type { Db } from "./db";
import { users, type User } from "./db/schema";

export const isKnownUser = async (db: Db, telegramId: string) => {
  const rows = await db
    .select({ id: users.telegramId })
    .from(users)
    .where(eq(users.telegramId, telegramId))
    .limit(1);
  return rows.length > 0;
};

export const addUser = (db: Db, telegramId: string, addedBy: string) =>
  db
    .insert(users)
    .values({ telegramId, role: "member", addedBy })
    .onConflictDoNothing({ target: users.telegramId })
    .returning({ id: users.telegramId });

export const removeUser = (db: Db, telegramId: string) =>
  db
    .delete(users)
    .where(eq(users.telegramId, telegramId))
    .returning({ id: users.telegramId });

export const listUsers = (db: Db): Promise<User[]> =>
  db.select().from(users).orderBy(users.createdAt);
