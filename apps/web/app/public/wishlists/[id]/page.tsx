import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Badge } from "@stackly/ui";
import { ChevronRight } from "lucide-react";
import { PublicCollectionCard, PublicCount, PublicGrid, PublicWishCard } from "@/components/public/PublicCards";
import { PublicShell } from "@/components/public/PublicShell";
import { getPublicWishlist, getPublicWishlistAncestors } from "@/lib/public/public-queries";
import { getUploadUrl } from "@stackly/lib";
import { sortByNaturalText } from "@/lib/natural-sort";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const wishlist = await getPublicWishlist(id);
  return { title: wishlist?.name ?? "Wishlist" };
}

export default async function PublicWishlistPage({ params }: Props) {
  const { id } = await params;
  const [tPublic, tWishlists] = await Promise.all([
    getTranslations("public"),
    getTranslations("wishlists"),
  ]);
  const wishlist = await getPublicWishlist(id);

  if (!wishlist) notFound();

  const ancestors = await getPublicWishlistAncestors(wishlist.parentId);
  const imageUrl = getUploadUrl(wishlist.image);
  const sortedChildren = sortByNaturalText(wishlist.children, (child) => child.name);
  const sortedWishes = sortByNaturalText(wishlist.wishes, (wish) => wish.name);

  return (
    <PublicShell eyebrow={tPublic("eyebrow")} title={wishlist.name}>
      <div className="space-y-8">
        <nav className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
          <span>{tWishlists("title")}</span>
          {ancestors.map((ancestor) => (
            <span key={ancestor.id} className="inline-flex items-center gap-1">
              <ChevronRight className="h-3 w-3" />
              <Link href={`/public/wishlists/${ancestor.id}`} className="hover:text-foreground">
                {ancestor.name}
              </Link>
            </span>
          ))}
        </nav>

        <section className="grid gap-6 md:grid-cols-[220px_1fr]">
          <div className="flex aspect-[10/13] items-center justify-center overflow-hidden rounded-lg border bg-muted">
            {imageUrl ? (
              <img src={imageUrl} alt={wishlist.name} className="max-h-full max-w-full object-contain" />
            ) : (
              <div
                className="flex h-20 w-20 items-center justify-center rounded-full text-3xl font-bold text-white"
                style={{ backgroundColor: wishlist.color ? (wishlist.color.startsWith("#") ? wishlist.color : `#${wishlist.color}`) : "#ec4899" }}
              >
                {wishlist.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-start gap-3">
            <Badge variant="outline">{tPublic("publicBadge")}</Badge>
            <PublicCount icon="layers" label={tWishlists("childrenCount", { count: wishlist.children.length })} />
            <PublicCount icon="wishes" label={tWishlists("wishesCount", { count: wishlist.wishes.length })} />
          </div>
        </section>

        {wishlist.children.length > 0 ? (
          <section className="space-y-3">
            <h2 className="text-xl font-semibold">{tWishlists("subWishlists")}</h2>
            <PublicGrid>
              {sortedChildren.map((child) => (
                <PublicCollectionCard
                  key={child.id}
                  href={`/public/wishlists/${child.id}`}
                  title={child.name}
                  image={child.image}
                  color={child.color}
                  meta={tWishlists("cardMeta", { children: child._count.children, wishes: child._count.wishes })}
                />
              ))}
            </PublicGrid>
          </section>
        ) : null}

        {wishlist.wishes.length > 0 ? (
          <section className="space-y-3">
            <h2 className="text-xl font-semibold">{tWishlists("wishes")}</h2>
            <PublicGrid>
              {sortedWishes.map((wish) => (
                <PublicWishCard
                  key={wish.id}
                  name={wish.name}
                  image={wish.imageSmallThumbnail ?? wish.image}
                  price={wish.price}
                  currency={wish.currency}
                  url={wish.url}
                />
              ))}
            </PublicGrid>
          </section>
        ) : null}
      </div>
    </PublicShell>
  );
}
