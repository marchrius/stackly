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
import { CopyPublicLinkButton } from "@/components/public/CopyPublicLinkButton";

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

  function renderDetailValue(datum: DatumWithChoiceList) {
    if (datum.type === "checkbox") {
      return <span>{datum.value === "1" ? tCommon("yes") : tCommon("no")}</span>;
    }

    if (datum.type === "link" && datum.value) {
      return (
        <a href={datum.value} target="_blank" rel="noreferrer" className="break-all text-primary hover:underline">
          {datum.value}
        </a>
      );
    }

    if (datum.type === "date" && datum.value) return <span>{formatDateValue(datum.value)}</span>;
    if (datum.type === "list") return renderListValue(datum);
    if (datum.type === "textarea") return <span className="whitespace-pre-line break-words">{datum.value ?? tCommon("none")}</span>;

    if (datum.type === "file" && datum.file) {
      return (
        <a
          href={getUploadUrl(datum.file) ?? ""}
          target="_blank"
          rel="noreferrer"
          download={datum.originalFilename ?? undefined}
          className="inline-flex items-center gap-2 text-primary hover:underline"
        >
          <FileDown className="h-4 w-4" />
          {datum.originalFilename ?? t("unknownFile")}
        </a>
      );
    }

    if (datum.type === "choice-list") return renderChoiceListValue(datum);
    if (datum.type === "price") return <span>{formatPriceValue(datum.value, datum.currency) ?? tCommon("none")}</span>;
    if (datum.type === "rating") return <span>{renderRatingValue(datum.value) ?? tCommon("none")}</span>;
    if (datum.type === "country") return <span>{formatCountryValue(datum.value) ?? tCommon("none")}</span>;

    return <span>{datum.value ?? tCommon("none")}</span>;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 flex-1 text-center">
          {item.collection ? (
            <Link href={`/collections/${item.collection.id}`} className="mb-3 inline-block text-xs font-medium text-primary hover:underline">
              {t("fromCollection", { name: item.collection.title })}
            </Link>
          ) : null}
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{item.name}</h1>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            {item.quantity > 1 ? <Badge variant="secondary">x{item.quantity}</Badge> : null}
            <Badge variant="outline">{tVisibility(item.finalVisibility as "public" | "internal" | "private")}</Badge>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-2 md:justify-end">
          {item.finalVisibility === "public" ? <CopyPublicLinkButton path={`/public/items/${item.id}`} /> : null}
          <Button asChild variant="outline" size="sm">
            <Link href={`/loans/new?itemId=${item.id}`}>{t("loanItem")}</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={`/items/${item.id}/edit`}>
              <Edit className="mr-1 h-4 w-4" />
              {tCommon("edit")}
            </Link>
          </Button>
          <DeleteConfirmDialog
            description={t("delete.confirm", { name: item.name })}
            onConfirm={deleteItem.bind(null, item.id)}
          />
        </div>
      </div>

      <section className="grid gap-8 lg:grid-cols-[minmax(260px,360px)_minmax(0,1fr)] lg:items-start lg:justify-center">
        <div className="space-y-4">
          <div className="flex min-h-[22rem] items-center justify-center bg-background">
            {selectedMedia ? (
              selectedMedia.kind === "video" ? (
                <video controls className="max-h-[32rem] w-full rounded bg-black" src={selectedMedia.src}>
                  <track kind="captions" />
                </video>
              ) : (
                <img
                  src={selectedMedia.src}
                  alt={selectedMedia.label === "main" ? item.name : selectedMedia.label}
                  className="max-h-[32rem] max-w-full object-contain"
                />
              )
            ) : (
              <div className="flex aspect-[10/13] w-full max-w-[20rem] items-center justify-center rounded-lg bg-muted text-sm text-muted-foreground">
                {t("media")}
              </div>
            )}
          </div>

          {selectedMedia ? (
            <p className="text-center text-xs text-muted-foreground">
              {selectedMedia.label === "main" ? t("mainImage") : selectedMedia.label}
            </p>
          ) : null}

          {mediaEntries.length > 1 ? (
            <div className="flex flex-wrap justify-center gap-2">
              {mediaEntries.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => setSelectedMediaId(entry.id)}
                  className={`h-20 w-16 rounded border p-1 transition ${entry.id === selectedMedia?.id ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/60"}`}
                  aria-label={entry.label === "main" ? t("mainImage") : entry.label || item.name}
                >
                  {entry.kind === "video" ? (
                    <div className="flex h-full w-full items-center justify-center rounded bg-black text-[0.65rem] font-medium text-white">
                      {t("video")}
                    </div>
                  ) : (
                    <img
                      src={entry.thumbnailSrc ?? entry.src}
                      alt={entry.label === "main" ? item.name : entry.label || item.name}
                      className="h-full w-full rounded object-contain"
                    />
                  )}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="space-y-5 pt-1">
          {displayData.length > 0 ? (
            <div className="space-y-2 text-sm leading-6">
              {displayData.map((datum) => {
                if (datum.type === "section") {
                  return (
                    <h2 key={datum.id} className="pt-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                      {datum.label}
                    </h2>
                  );
                }

                if (datum.type === "blank-line") return <div key={datum.id} className="h-2" />;

                return (
                  <div key={datum.id} className="grid gap-x-2 sm:grid-cols-[max-content_1fr]">
                    {datum.label ? <dt className="font-semibold text-foreground">{datum.label}:</dt> : null}
                    <dd className="min-w-0 text-foreground">{renderDetailValue(datum)}</dd>
                  </div>
                );
              })}
            </div>
          ) : null}

          {activeLoans.length > 0 ? (
            <div className="space-y-2 text-sm">
              <p className="font-semibold">{t("activeLoans", { count: activeLoans.length })}</p>
              {activeLoans.map((loan) => (
                <Link key={loan.id} href={`/loans/${loan.id}/edit`} className="block text-primary hover:underline">
                  {loan.lentTo} - {new Date(loan.lentAt).toLocaleDateString()}
                </Link>
              ))}
              <Link href="/loans" className="text-xs text-muted-foreground hover:text-foreground">
                {t("viewAllLoans")}
              </Link>
            </div>
          ) : null}
        </div>
      </section>

      {relatedItems.length > 0 ? (
        <section className="text-center text-sm">
          <span className="font-semibold">{t("relatedItems", { count: relatedItems.length })}: </span>
          <span className="inline-flex flex-wrap justify-center gap-x-2 gap-y-1">
            {relatedItems.map((relatedItem, index) => (
              <Link key={relatedItem.id} href={`/items/${relatedItem.id}`} className="text-primary hover:underline">
                {relatedItem.name}
                {index < relatedItems.length - 1 ? "," : ""}
              </Link>
            ))}
          </span>
        </section>
      ) : null}

      {item.tags.length > 0 ? (
        <section className="flex flex-wrap justify-center gap-2">
          {item.tags.map((tag) => (
            <Badge key={tag.id} variant="secondary" className="rounded-full px-3 py-1">
              <Link href={`/tags/${tag.id}`} className="hover:underline">
                {tag.label}
              </Link>
            </Badge>
          ))}
        </section>
      ) : null}

      {(previousItem || nextItem) ? (
        <nav className="flex flex-wrap items-center justify-center gap-6 pt-2 text-sm">
          {previousItem ? (
            <Link href={`/items/${previousItem.id}`} className="inline-flex items-center text-primary hover:underline">
              <ChevronLeft className="mr-1 h-4 w-4" />
              {previousItem.name}
            </Link>
          ) : null}

          {nextItem ? (
            <Link href={`/items/${nextItem.id}`} className="inline-flex items-center text-primary hover:underline">
              {nextItem.name}
              <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          ) : null}
        </nav>
      ) : null}
    </div>
  );
}
