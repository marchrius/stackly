"use client";

import type { DisplayConfiguration } from "@stackly/db";
import Link from "next/link";
import { Badge, Button } from "@stackly/ui";
import { Box, Edit, Layers } from "lucide-react";
import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { deleteCollection } from "@/lib/actions/collection.actions";
import {
  CollectionIndexCollection,
  getCollectionCounter,
  getCollectionDatumDisplayValue,
  sortCollectionsForDisplay,
} from "@/lib/collection-index-display";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { getUploadUrl } from "@stackly/lib";
import { EmptyState } from "@/components/shared/EmptyState";

interface CollectionListProps {
  collections: CollectionIndexCollection[];
  displayConfiguration: Pick<
    DisplayConfiguration,
    | "id"
    | "displayMode"
    | "sortingProperty"
    | "sortingType"
    | "sortingDirection"
    | "showVisibility"
    | "showActions"
    | "showNumberOfChildren"
    | "showNumberOfItems"
    | "columns"
  > | null;
  basePath?: string;
}

function asHexColor(color: string | null): string {
  if (!color) return "#6366f1";
  return color.startsWith("#") ? color : `#${color}`;
}

export function CollectionList({
  collections,
  displayConfiguration,
  basePath = "/collections",
}: CollectionListProps) {
  const t = useTranslations("collections");
  const tCommon = useTranslations("common");
  const tVisibility = useTranslations("visibility");
  const sortedCollections = useMemo(
    () => sortCollectionsForDisplay(collections, displayConfiguration),
    [collections, displayConfiguration],
  );
  const columns = Array.isArray(displayConfiguration?.columns)
    ? displayConfiguration.columns.filter(
        (column): column is string => typeof column === "string",
      )
    : [];

  if (collections.length === 0) {
    return (
      <EmptyState
        icon={Layers}
        title={t("empty")}
        description={t("emptyHint")}
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="min-w-full divide-y divide-border text-sm">
        <thead className="bg-muted/40">
          <tr>
            <th className="w-20 px-3 py-2 text-left font-medium"></th>
            <th className="px-3 py-2 text-left font-medium">
              {tCommon("name")}
            </th>
            {columns.map((column) => (
              <th key={column} className="px-3 py-2 text-left font-medium">
                {column}
              </th>
            ))}
            {displayConfiguration?.showNumberOfChildren && (
              <th className="px-3 py-2 text-center font-medium">
                {t("form.numberOfChildren")}
              </th>
            )}
            {displayConfiguration?.showNumberOfItems && (
              <th className="px-3 py-2 text-center font-medium">
                {t("form.numberOfItems")}
              </th>
            )}
            {displayConfiguration?.showVisibility && (
              <th className="px-3 py-2 text-center font-medium">
                {tCommon("visibility")}
              </th>
            )}
            {displayConfiguration?.showActions && (
              <th className="px-3 py-2 text-center font-medium">
                {tCommon("actions")}
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {sortedCollections.map((collection) => {
            const childrenCount = getCollectionCounter(collection, "children");
            const itemsCount = getCollectionCounter(collection, "items");

            return (
              <tr
                key={collection.id}
                className="align-middle hover:bg-muted/20"
              >
                <td className="px-3 py-2">
                  <Link href={`${basePath}/${collection.id}`} className="block">
                    <div
                      className="relative flex aspect-[10/13] w-14 items-center justify-center overflow-hidden rounded-md bg-muted"
                      style={{
                        backgroundColor: collection.color
                          ? `${asHexColor(collection.color)}22`
                          : undefined,
                      }}
                    >
                      {collection.image ? (
                        <img
                          src={getUploadUrl(collection.image) ?? ""}
                          alt={collection.title}
                          loading="lazy"
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : (
                        <div
                          className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white"
                          style={{
                            backgroundColor: asHexColor(collection.color),
                          }}
                        >
                          {collection.title.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                  </Link>
                </td>
                <td className="px-3 py-2 font-medium">
                  <Link
                    href={`${basePath}/${collection.id}`}
                    className="hover:text-primary"
                  >
                    {collection.title}
                  </Link>
                </td>
                {columns.map((column) => (
                  <td
                    key={`${collection.id}-${column}`}
                    className="px-3 py-2 text-muted-foreground"
                  >
                    {getCollectionDatumDisplayValue(collection, column) ?? "-"}
                  </td>
                ))}
                {displayConfiguration?.showNumberOfChildren && (
                  <td className="px-3 py-2 text-center">
                    <span className="inline-flex items-center gap-1">
                      <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                      {childrenCount}
                    </span>
                  </td>
                )}
                {displayConfiguration?.showNumberOfItems && (
                  <td className="px-3 py-2 text-center">
                    <span className="inline-flex items-center gap-1">
                      <Box className="h-3.5 w-3.5 text-muted-foreground" />
                      {itemsCount}
                    </span>
                  </td>
                )}
                {displayConfiguration?.showVisibility && (
                  <td className="px-3 py-2 text-center">
                    <Badge variant="outline">
                      {tVisibility(
                        collection.finalVisibility as
                          | "public"
                          | "internal"
                          | "private",
                      )}
                    </Badge>
                  </td>
                )}
                {displayConfiguration?.showActions && (
                  <td className="px-3 py-2">
                    {basePath === "/collections" ? (
                      <div className="flex items-center justify-center gap-2">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/collections/${collection.id}/edit`}>
                            <Edit className="mr-1 h-4 w-4" />
                            {tCommon("edit")}
                          </Link>
                        </Button>
                        <DeleteConfirmDialog
                          description={t("delete.confirm", {
                            name: collection.title,
                          })}
                          onConfirm={deleteCollection.bind(null, collection.id)}
                          size="icon"
                        />
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
