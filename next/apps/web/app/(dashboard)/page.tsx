import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@koillection/db";
import { Card, CardContent, CardHeader, CardTitle } from "@koillection/ui";
import { Library, Image, Heart, Tag } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const session = await requireAuth();

  const [collectionsCount, albumsCount, wishlistsCount, tagsCount] = await Promise.all([
    prisma.collection.count({ where: { ownerId: session.user.id, parentId: null } }),
    prisma.album.count({ where: { ownerId: session.user.id, parentId: null } }),
    prisma.wishlist.count({ where: { ownerId: session.user.id, parentId: null } }),
    prisma.tag.count({ where: { ownerId: session.user.id } }),
  ]);

  const stats = [
    { label: "Collezioni", count: collectionsCount, icon: Library, href: "/collections", color: "text-blue-500" },
    { label: "Album", count: albumsCount, icon: Image, href: "/albums", color: "text-purple-500" },
    { label: "Wishlist", count: wishlistsCount, icon: Heart, href: "/wishlists", color: "text-pink-500" },
    { label: "Tag", count: tagsCount, icon: Tag, href: "/tags", color: "text-green-500" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Benvenuto, {session.user.name}!
        </h1>
        <p className="text-muted-foreground">Ecco un riepilogo delle tue collezioni.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.href} href={stat.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.count}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

