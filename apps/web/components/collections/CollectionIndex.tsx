"use client";

import type { DisplayConfiguration } from "@stackly/db";
import { Input } from "@stackly/ui";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { CollectionGrid } from "./CollectionGrid";
import { CollectionList } from "./CollectionList";
import {
  filterCollectionsByTitle,
  type CollectionIndexCollection,
} from "@/lib/collection-index-display";
import type { CollectionAggregateCounters } from "@/lib/collection-detail";

interface CollectionIndexProps {
  collections: CollectionIndexCollection[];
  displayConfiguration: DisplayConfiguration | null;
  counterOverrides?: Record<string, CollectionAggregateCounters>;
}

export function CollectionIndex({
  collections,
  displayConfiguration,
  counterOverrides,
}: CollectionIndexProps) {
  const tCommon = useTranslations("common");
  const [query, setQuery] = useState("");
  const filteredCollections = useMemo(
    () => filterCollectionsByTitle(collections, query),
    [collections, query],
  );

  return (
    <div className="space-y-4">
      {collections.length > 0 && (
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={tCommon("search")}
            aria-label={tCommon("search")}
            className="pl-9"
          />
        </div>
      )}

      {displayConfiguration?.displayMode === "list" ? (
        <CollectionList
          collections={filteredCollections}
          displayConfiguration={displayConfiguration}
          counterOverrides={counterOverrides}
        />
      ) : (
        <CollectionGrid
          collections={filteredCollections}
          displayConfiguration={displayConfiguration}
          counterOverrides={counterOverrides}
        />
      )}
    </div>
  );
}
