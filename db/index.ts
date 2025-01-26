import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "@db/schema";

function getDatabaseUrl() {
  if (process.env.NODE_ENV === 'production') {
    // Use production database configuration
    const host = process.env.PRODUCTION_DB_HOST;
    const port = process.env.PRODUCTION_DB_PORT;
    const user = process.env.PRODUCTION_DB_USER;
    const password = process.env.PRODUCTION_DB_PASSWORD;
    const database = process.env.PRODUCTION_DB_NAME;

    if (!host || !port || !user || !password || !database) {
      throw new Error("Missing production database credentials");
    }

    return `postgres://${user}:${password}@${host}:${port}/${database}`;
  }

  // Development database URL
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL must be set for development environment");
  }

  return process.env.DATABASE_URL;
}

const databaseUrl = getDatabaseUrl();

export const db = drizzle({
  connection: databaseUrl,
  schema,
  ws: process.env.NODE_ENV === 'production' ? undefined : ws,
});