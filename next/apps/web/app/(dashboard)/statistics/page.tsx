import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@koillection/db";
import { StatisticsCharts } from "@/components/statistics/StatisticsCharts";

export const metadata: Metadata = { title: "Statistiche" };

export default async function StatisticsPage() {
  const session = await requireAuth();

  const [
    collectionsCount, itemsCount, albumsCount, photosCount,
    wishlistsCount, wishesCount, tagsCount, loansCount,
  ] = await Promise.all([
    prisma.collection.count({ where: { ownerId: session.user.id } }),
    prisma.item.count({ where: { ownerId: session.user.id } }),
    prisma.album.count({ where: { ownerId: session.user.id } }),
    prisma.photo.count({ where: { ownerId: session.user.id } }),
    prisma.wishlist.count({ where: { ownerId: session.user.id } }),
    prisma.wish.count({ where: { ownerId: session.user.id } }),
    prisma.tag.count({ where: { ownerId: session.user.id } }),
    prisma.loan.count({ where: { ownerId: session.user.id, returnedAt: null } }),
  ]);

  const stats = {
    collectionsCount, itemsCount, albumsCount, photosCount,
    wishlistsCount, wishesCount, tagsCount, loansCount,
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Statistiche</h1>
      <StatisticsCharts stats={stats} />
    </div>
  );
}

