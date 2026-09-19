import { PrismaClient } from "@prisma/client";

export { Prisma, PrismaClient } from "@prisma/client";
export type {
  Album,
  ChoiceList,
  Collection,
  Datum,
  DisplayConfiguration,
  Field,
  Inventory,
  Item,
  Loan,
  OAuthProvider,
  Path,
  Photo,
  Scraper,
  Tag,
  TagCategory,
  Template,
  User,
  Wish,
  Wishlist,
} from "@prisma/client";

// Singleton PrismaClient per Next.js (evita multiple istanze in dev con hot-reload)
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
