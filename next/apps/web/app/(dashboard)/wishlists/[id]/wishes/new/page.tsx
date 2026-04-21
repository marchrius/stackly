import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@stackly/db";
import { notFound } from "next/navigation";
import { WishForm } from "@/components/wishes/WishForm";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("wishes");
  return { title: t("new") };
}

interface Props {
  params: Promise<{ id: string }>;
}

export default async function NewWishPage({ params }: Props) {
  const { id: wishlistId } = await params;
  const session = await requireAuth();
  const t = await getTranslations("wishes");

  const wishlist = await prisma.wishlist.findFirst({
    where: { id: wishlistId, ownerId: session.user.id },
    select: { id: true, name: true },
  });

  if (!wishlist) notFound();

  const allWishlists = await prisma.wishlist.findMany({
    where: { ownerId: session.user.id },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">
        {t("new")} <span className="text-muted-foreground font-normal">— {wishlist.name}</span>
      </h1>
      <WishForm wishlists={allWishlists} wishlistId={wishlistId} />
    </div>
  );
}
