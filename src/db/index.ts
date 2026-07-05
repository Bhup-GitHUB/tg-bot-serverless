import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

export const getDb = (env: Env) => drizzle(neon(env.DATABASE_URL), { schema });

export type Db = ReturnType<typeof getDb>;
