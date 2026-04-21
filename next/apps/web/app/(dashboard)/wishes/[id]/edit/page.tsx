import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@stackly/db";
import { notFound } from "next/navigation";
import { WishForm } from "@/components/wishes/WishForm";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("wishes");
  return { title: t("edit") };
}

interface Props { params: Promise<{ id: string }> }

export default async function EditWishPage({ params }: Props) {
  const { id } = await params;
  const session = await requireAuth();
  const t = await getTranslations("wishes");

  const [wish, allWishlists] = await Promise.all([
    prisma.wish.findFirst({ where: { id, ownerId: session.user.id } }),
    prisma.wishlist.findMany({
      where: { ownerId: session.user.id },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  if (!wish) notFound();

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">{t("edit")}</h1>
      <WishForm wish={wish} wishlists={allWishlists} />
    </div>
  );
}
