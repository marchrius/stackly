import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    seed: "node ../../scripts/seed-demo-data.mjs",
  },
});
