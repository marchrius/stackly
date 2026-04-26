"use client";

import type { Item, Datum, Tag, Loan } from "@stackly/db";
import Link from "next/link";
import { Button, Badge } from "@stackly/ui";
import { ChevronLeft, ChevronRight, Edit, FileDown } from "lucide-react";
import { deleteItem } from "@/lib/actions/item.actions";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { buildItemMediaEntries, getDisplayData, mergeRelatedItems } from "@/lib/item-detail";
import { getChoiceListDisplayMode, limitChoiceValues, parseChoiceListValues } from "@/lib/choice-lists";
import { formatCountryValue, formatDateValue, formatPriceValue, parseListValues, renderRatingValue } from "@/lib/datum-format";
import { getUploadUrl } from "@stackly/lib";

type DatumWithChoiceList = Datum & {
  choiceList: { id: string; name: string; displayMode: string | null; selectionMode: string | null } | null;
};

type ItemWithRelations = Item & {
  data: DatumWithChoiceList[];
  tags: Tag[];
  loans: Loan[];
  collection: { id: string; title: string } | null;
  relatedItems: { id: string; name: string; imageSmallThumbnail: string | null }[];
  relatedTo: { id: string; name: string; imageSmallThumbnail: string | null }[];
};

type SiblingItem = { id: string; name: string } | null;

export function ItemDetail({ item, previousItem, nextItem }: { item: ItemWithRelations; previousItem?: SiblingItem; nextItem?: SiblingItem }) {
  const t = useTranslations("items");
  const tCommon = useTranslations("common");
  const tVisibility = useTranslations("visibility");
  const activeLoans = item.loans.filter((loan) => !loan.returnedAt);
  const mediaEntries = useMemo(() => buildItemMediaEntries(item), [item]);
  const displayData = useMemo(() => getDisplayData(item.data), [item.data]);
  const relatedItems = useMemo(() => mergeRelatedItems(item.relatedItems, item.relatedTo), [item.relatedItems, item.relatedTo]);
  const [selectedMediaId, setSelectedMediaId] = useState(mediaEntries[0]?.id ?? null);
  const selectedMedia = mediaEntries.find((entry) => entry.id === selectedMediaId) ?? mediaEntries[0] ?? null;

  function renderChoiceListValue(datum: DatumWithChoiceList) {
    const values = limitChoiceValues(parseChoiceListValues(datum.value), datum.choiceList);
    if (values.length === 0) return <span className="text-sm text-muted-foreground">{tCommon("none")}</span>;

    if (getChoiceListDisplayMode(datum.choiceList) === "list") {
      return (
        <ul className="list-disc space-y-1 pl-5 text-sm">
          {values.map((choice) => (
            <li key={choice}>{choice}</li>
          ))}
        </ul>
      );
    }

    return (
      <div className="flex flex-wrap gap-2">
        {values.map((choice) => (
          <Badge key={choice} variant="secondary" className="rounded-full px-3 py-1">
            {choice}
          </Badge>
        ))}
      </div>
    );
  }

  function renderListValue(datum: DatumWithChoiceList) {
    const values = parseListValues(datum.value);
    if (values.length === 0) return <span className="text-sm text-muted-foreground">{tCommon("none")}</span>;

    if (datum.displayMode === "pill") {
      return (
        <div className="flex flex-wrap gap-2">
          {values.map((choice) => (
            <Badge key={choice} variant="secondary" className="rounded-full px-3 py-1">
              {choice}
            </Badge>
          ))}
        </div>
      );
    }

    return (
      <ul className="list-disc space-y-1 pl-5 text-sm">
        {values.map((choice) => (
          <li key={choice}>{choice}</li>
        ))}
      </ul>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{item.name}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            {item.collection && (
              <Link href={`/collections/${item.collection.id}`} className="text-sm text-primary hover:underline">
                {t("fromCollection", { name: item.collection.title })}
              </Link>
            )}
            {item.quantity > 1 && <Badge variant="secondary">×{item.quantity}</Badge>}
            <Badge variant="outline">{tVisibility(item.finalVisibility as "public" | "internal" | "private")}</Badge>
            {item.tags.map((tag) => (
              <Badge key={tag.id} variant="secondary">
                <Link href={`/tags/${tag.id}`} className="hover:underline">
                  {tag.label}
                </Link>
              </Badge>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/loans/new?itemId=${item.id}`}>{t("loanItem")}</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={`/items/${item.id}/edit`}><Edit className="mr-1 h-4 w-4" />{tCommon("edit")}</Link>
          </Button>
          <DeleteConfirmDialog
            description={t("delete.confirm", { name: item.name })}
            onConfirm={deleteItem.bind(null, item.id)}
          />
        </div>
      </div>

      {selectedMedia && (
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">{t("media")}</h2>
            {selectedMedia.label !== "main" && <p className="text-sm text-muted-foreground">{selectedMedia.label}</p>}
          </div>

          <div className="rounded-lg border bg-muted/30 p-4">
            {selectedMedia.kind === "video" ? (
              <video controls className="max-h-[28rem] w-full rounded-lg bg-black" src={selectedMedia.src}>
                <track kind="captions" />
              </video>
            ) : (
              <img src={selectedMedia.src} alt={selectedMedia.label === "main" ? item.name : selectedMedia.label} className="max-h-[28rem] w-full rounded-lg object-contain" />
            )}
          </div>

          {mediaEntries.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {mediaEntries.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => setSelectedMediaId(entry.id)}
                  className={`rounded-lg border p-1 transition ${entry.id === selectedMedia.id ? "border-primary ring-2 ring-primary/20" : "border-border"}`}
                  aria-label={entry.label || item.name}
                >
                  {entry.kind === "video" ? (
                    <div className="flex h-16 w-16 items-center justify-center rounded bg-black text-xs font-medium text-white">
                      {t("video")}
                    </div>
                  ) : (
                    <img
                      src={entry.thumbnailSrc ?? entry.src}
                      alt={entry.label || item.name}
                      className="h-16 w-16 rounded object-cover"
                    />
                  )}
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      {displayData.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">{t("form.data")}</h2>
          <div className="space-y-3">
            {displayData.map((datum) => {
              if (datum.type === "section") {
                return (
                  <div key={datum.id} className="pt-2">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{datum.label}</h3>
                  </div>
                );
              }

              if (datum.type === "blank-line") {
                return <div key={datum.id} className="border-t" />;
              }

              return (
                <div key={datum.id} className="rounded-lg border p-3">
                  {datum.label && <p className="mb-1 text-xs font-medium text-muted-foreground">{datum.label}</p>}
                  {datum.type === "checkbox" ? (
                    <span className="text-sm">{datum.value === "1" ? `✓ ${tCommon("yes")}` : `✗ ${tCommon("no")}`}</span>
                  ) : datum.type === "link" && datum.value ? (
                    <a href={datum.value} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline break-all">
                      {datum.value}
                    </a>
                  ) : datum.type === "date" && datum.value ? (
                    <p className="break-words text-sm">{formatDateValue(datum.value)}</p>
                  ) : datum.type === "list" ? (
                    renderListValue(datum)
                  ) : datum.type === "textarea" ? (
                    <p className="whitespace-pre-line break-words text-sm">{datum.value ?? tCommon("none")}</p>
                  ) : datum.type === "file" && datum.file ? (
                    <a
                      href={getUploadUrl(datum.file) ?? ""}
                      target="_blank"
                      rel="noreferrer"
                      download={datum.originalFilename ?? undefined}
                      className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <FileDown className="h-4 w-4" />
                      {datum.originalFilename ?? t("unknownFile")}
                    </a>
                  ) : datum.type === "choice-list" ? (
                    renderChoiceListValue(datum)
                  ) : datum.type === "price" ? (
                    <p className="break-words text-sm">{formatPriceValue(datum.value, datum.currency) ?? tCommon("none")}</p>
                  ) : datum.type === "rating" ? (
                    <p className="break-words text-sm">{renderRatingValue(datum.value) ?? tCommon("none")}</p>
                  ) : datum.type === "country" ? (
                    <p className="break-words text-sm">{formatCountryValue(datum.value) ?? tCommon("none")}</p>
                  ) : (
                    <p className="break-words text-sm">{datum.value ?? tCommon("none")}</p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {relatedItems.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">{t("relatedItems", { count: relatedItems.length })}</h2>
          </div>
          <div
            className="grid gap-x-2.5 gap-y-4"
            style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }}
          >
            {relatedItems.map((relatedItem) => (
              <Link
                key={relatedItem.id}
                href={`/items/${relatedItem.id}`}
                className="group block cursor-pointer overflow-hidden rounded-lg border bg-card hover:shadow-md transition-shadow"
              >
                <div className="relative aspect-[10/13] bg-muted flex items-center justify-center overflow-hidden">
                  {relatedItem.imageSmallThumbnail ? (
                    <img
                      src={getUploadUrl(relatedItem.imageSmallThumbnail) ?? ""}
                      alt={relatedItem.name}
                      loading="lazy"
                      className="max-h-full max-w-full object-contain transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <span className="p-3 text-center text-xs text-muted-foreground">{relatedItem.name}</span>
                  )}
                </div>
                <div className="p-2">
                  <p className="truncate text-xs font-medium">{relatedItem.name}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">{t("activeLoans", { count: activeLoans.length })}</h2>
          {activeLoans.length > 0 && (
            <Button asChild variant="ghost" size="sm">
              <Link href="/loans">{t("viewAllLoans")}</Link>
            </Button>
          )}
        </div>
        {activeLoans.length > 0 ? (
          <div className="space-y-2">
            {activeLoans.map((loan) => (
              <Link key={loan.id} href={`/loans/${loan.id}/edit`} className="block rounded-lg border p-3 text-sm hover:bg-accent">
                {loan.lentTo} — {new Date(loan.lentAt).toLocaleDateString()}
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{t("noActiveLoans")}</p>
        )}
      </section>

      {(previousItem || nextItem) && (
        <nav className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
          {previousItem ? (
            <Button asChild variant="ghost" size="sm">
              <Link href={`/items/${previousItem.id}`}>
                <ChevronLeft className="mr-1 h-4 w-4" />
                {previousItem.name}
              </Link>
            </Button>
          ) : (
            <span />
          )}

          {nextItem ? (
            <Button asChild variant="ghost" size="sm">
              <Link href={`/items/${nextItem.id}`}>
                {nextItem.name}
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          ) : null}
        </nav>
      )}
    </div>
  );
}
