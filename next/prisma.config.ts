import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "packages/db/prisma/schema.prisma",
  migrations: {
    path: "packages/db/prisma/migrations",
    seed: "node scripts/seed-demo-data.mjs",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
