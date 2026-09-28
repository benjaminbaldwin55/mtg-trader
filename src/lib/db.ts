import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL environment variable is not set.");
  return drizzle(neon(url), { schema });
}

// Lazily initialized so build-time static analysis doesn't require the env var
let _db: ReturnType<typeof getDb> | null = null;
export function db() {
  if (!_db) _db = getDb();
  return _db;
}
