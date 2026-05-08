"use client";

import type { Item, Collection, Tag, Wishlist, Wish } from "@stackly/db";
import Link from "next/link";
import { Badge } from "@stackly/ui";
import { Box, Heart, Layers, Tag as TagIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { sortByNaturalText } from "@/lib/natural-sort";

type WishWithWishlist = Wish & { wishlist?: { id: string; name: string } | null };

interface SearchResultsProps {
  items: Item[];
  collections: Collection[];
  tags: Tag[];
  wishlists: Wishlist[];
  wishes: WishWithWishlist[];
  query: string;
  totalCount?: number;
}

export function SearchResults({ items, collections, tags, wishlists, wishes, query, totalCount }: SearchResultsProps) {
  const t = useTranslations("search");
  const tNav = useTranslations("nav");
  const tItems = useTranslations("items");
  const tWishes = useTranslations("wishes");
  const total = items.length + collections.length + tags.length + wishlists.length + wishes.length;
  const sortedCollections = sortByNaturalText(collections, (collection) => collection.title);
  const sortedWishlists = sortByNaturalText(wishlists, (wishlist) => wishlist.name);
  const sortedItems = sortByNaturalText(items, (item) => item.name);
  const sortedWishes = sortByNaturalText(wishes, (wish) => wish.name);
  const sortedTags = sortByNaturalText(tags, (tag) => tag.label);

  if (total === 0) {
    return <p className="text-muted-foreground">{query ? t("noResultsFor", { query }) : t("noResults")}</p>;
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        {query ? t("resultsFor", { count: totalCount ?? total, query }) : t("results")}
      </p>

      {collections.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-1">
            <Layers className="h-4 w-4" /> {tNav("collections")} ({collections.length})
          </h2>
          <div className="space-y-1">
            {sortedCollections.map((c) => (
              <Link key={c.id} href={`/collections/${c.id}`} className="flex items-center gap-2 rounded-md p-2 hover:bg-accent text-sm">
                <Layers className="h-4 w-4 text-primary shrink-0" />
                {c.title}
              </Link>
            ))}
          </div>
        </section>
      )}

      {wishlists.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-1">
            <Heart className="h-4 w-4" /> {tNav("wishlists")} ({wishlists.length})
          </h2>
          <div className="space-y-1">
            {sortedWishlists.map((wishlist) => (
              <Link key={wishlist.id} href={`/wishlists/${wishlist.id}`} className="flex items-center gap-2 rounded-md p-2 hover:bg-accent text-sm">
                <Heart className="h-4 w-4 text-secondary shrink-0" />
                {wishlist.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {items.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-1">
            <Box className="h-4 w-4" /> {tItems("title")} ({items.length})
          </h2>
          <div className="space-y-1">
            {sortedItems.map((item) => (
              <Link key={item.id} href={`/items/${item.id}`} className="flex items-center gap-2 rounded-md p-2 hover:bg-accent text-sm">
                <Box className="h-4 w-4 text-primary shrink-0" />
                {item.name}
                {item.quantity > 1 && <Badge variant="secondary" className="text-xs">×{item.quantity}</Badge>}
              </Link>
            ))}
          </div>
        </section>
      )}

      {wishes.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-1">
            <Heart className="h-4 w-4" /> {tWishes("title")} ({wishes.length})
          </h2>
          <div className="space-y-1">
            {sortedWishes.map((wish) => (
              <Link key={wish.id} href={`/wishes/${wish.id}`} className="flex items-center gap-2 rounded-md p-2 hover:bg-accent text-sm">
                <Heart className="h-4 w-4 text-secondary shrink-0" />
                <span className="truncate">{wish.name}</span>
                {wish.wishlist?.name && (
                  <Badge variant="outline" className="text-xs ml-auto">{wish.wishlist.name}</Badge>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {tags.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-1">
            <TagIcon className="h-4 w-4" /> {tNav("tags")} ({tags.length})
          </h2>
          <div className="flex flex-wrap gap-2">
            {sortedTags.map((tag) => (
              <Link key={tag.id} href={`/tags/${tag.id}`}>
                <Badge variant="outline" className="cursor-pointer hover:bg-accent">{tag.label}</Badge>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
