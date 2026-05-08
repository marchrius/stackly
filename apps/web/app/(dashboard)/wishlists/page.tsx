import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@stackly/db";
import { Button } from "@stackly/ui";
import { WishlistGrid } from "@/components/wishlists/WishlistGrid";
import { Plus } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/shared/PageHeader";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("wishlists");
  return { title: t("title") };
}

export default async function WishlistsPage() {
  const session = await requireAuth();
  const t = await getTranslations("wishlists");

  const wishlists = await prisma.wishlist.findMany({
    where: { ownerId: session.user.id, parentId: null },
    orderBy: { name: "asc" },
    include: { _count: { select: { children: true, wishes: true } } },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={
          <p>
            {wishlists.length} {t("title").toLowerCase()}
          </p>
        }
        actions={
          <Button asChild>
            <Link href="/wishlists/new">
              <Plus className="mr-2 h-4 w-4" />
              {t("new")}
            </Link>
          </Button>
        }
      />
      <WishlistGrid wishlists={wishlists} />
    </div>
  );
}
