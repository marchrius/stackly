"use client";

import type { ChoiceList, Collection, Datum, DisplayConfiguration, Template } from "@stackly/db";
import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Badge,
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@stackly/ui";
import { createCollection, updateCollection } from "@/lib/actions/collection.actions";
import {
  type DisplayConfigOption,
  type DisplayConfigPayload,
  getDefaultDisplayConfig,
  RESERVED_SORTING_VALUES,
} from "@/lib/collection-display-config";
import { isSingleChoiceList, limitChoiceValues, normalizeChoiceValues, parseChoiceListValues } from "@/lib/choice-lists";
import { getUploadUrl, VISIBILITY_OPTIONS } from "@stackly/lib";
import { useTranslations } from "next-intl";

type ChoiceListOption = Pick<ChoiceList, "id" | "name" | "choices" | "displayMode" | "selectionMode">;
type CollectionWithData = Collection & {
  data: Datum[];
  childrenDisplayConfig: DisplayConfiguration | null;
  itemsDisplayConfig: DisplayConfiguration | null;
};
type ScraperOption = { id: string; name: string };

type ManagedCollectionDatumField = {
  key: string;
  datumId: string | null;
  label: string;
  type: string;
  visibility: "public" | "internal" | "private";
  choiceListId: string | null;
  position: number;
  value: string;
  choices: string[];
  selectedChoices: string[];
  file: string | null;
  originalFilename: string | null;
};

const COLLECTION_FIELD_TYPES = ["text", "number", "country", "date", "file", "checkbox"] as const;

interface ParentOption {
  id: string;
  title: string;
}

interface CollectionFormProps {
  collection?: CollectionWithData;
  templates: Template[];
  choiceLists: ChoiceListOption[];
  scrapers: ScraperOption[];
  childrenSortingOptions: DisplayConfigOption[];
  itemsSortingOptions: DisplayConfigOption[];
  childrenColumnOptions: DisplayConfigOption[];
  itemsColumnOptions: DisplayConfigOption[];
  parentOptions: ParentOption[];
  parentId?: string;
  cancelHref: string;
}

function normalizeColorValue(value: string | null | undefined): string {
  if (!value) return "#6366f1";
  return value.startsWith("#") ? value : `#${value}`;
}

function toUploadUrl(path: string | null): string | null {
  return getUploadUrl(path);
}

function buildManagedFields(collection: CollectionWithData | undefined, choiceLists: ChoiceListOption[]) {
  if (!collection) return [];

  return [...collection.data]
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    .map((datum, index) => {
        const fallbackChoiceList = choiceLists.find((choiceList) => choiceList.id === datum.choiceListId) ?? null;
        return {
        key: `datum-${datum.id}`,
        datumId: datum.id,
        label: datum.label ?? "",
        type: datum.type,
        visibility: datum.visibility as ManagedCollectionDatumField["visibility"],
        choiceListId: datum.choiceListId ?? null,
        position: datum.position ?? index,
        value: datum.type === "checkbox" ? (datum.value === "1" ? "1" : "0") : datum.value ?? "",
        choices: normalizeChoiceValues(fallbackChoiceList?.choices),
        selectedChoices: datum.type === "choice-list" ? limitChoiceValues(parseChoiceListValues(datum.value), fallbackChoiceList) : [],
        file: datum.file ?? null,
        originalFilename: datum.originalFilename ?? null,
      } satisfies ManagedCollectionDatumField;
    });
}

function buildFieldFromPreset(
  preset: {
    label: string;
    type: string;
    visibility: "public" | "internal" | "private";
    choiceListId: string | null;
    value: string;
  },
  choiceLists: ChoiceListOption[],
  position: number,
) {
  const fallbackChoiceList = choiceLists.find((choiceList) => choiceList.id === preset.choiceListId) ?? null;
  return {
    key: `preset-${preset.type}-${position}-${Math.random().toString(36).slice(2, 8)}`,
    datumId: null,
    label: preset.label,
    type: preset.type,
    visibility: preset.visibility,
    choiceListId: preset.choiceListId,
    position,
    value: preset.type === "checkbox" ? (preset.value === "1" ? "1" : "0") : preset.value,
    choices: normalizeChoiceValues(fallbackChoiceList?.choices),
    selectedChoices: preset.type === "choice-list" ? limitChoiceValues(parseChoiceListValues(preset.value), fallbackChoiceList) : [],
    file: null,
    originalFilename: null,
  } satisfies ManagedCollectionDatumField;
}

function serializeField(field: ManagedCollectionDatumField, position: number) {
  let value = field.value;
  if (field.type === "checkbox") value = field.value === "1" ? "1" : "0";
  if (field.type === "choice-list") {
    value = field.selectedChoices.length > 0 ? JSON.stringify(field.selectedChoices) : "";
  }

  return {
    id: field.datumId,
    label: field.label,
    type: field.type,
    visibility: field.visibility,
    choiceListId: field.choiceListId,
    position,
    value,
    file: field.file,
    originalFilename: field.originalFilename,
    uploadKey: `datum-upload-${field.key}`,
  };
}

export function CollectionForm({
  collection,
  templates,
  choiceLists,
  scrapers,
  childrenSortingOptions,
  itemsSortingOptions,
  childrenColumnOptions,
  itemsColumnOptions,
  parentOptions,
  parentId,
  cancelHref,
}: CollectionFormProps) {
  const t = useTranslations("collections");
  const tCommon = useTranslations("common");
  const tItems = useTranslations("items");
  const tTemplates = useTranslations("templates");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const isEdit = !!collection;

  const [title, setTitle] = useState(collection?.title ?? "");
  const [visibility, setVisibility] = useState(collection?.visibility ?? "public");
  const [selectedParentId, setSelectedParentId] = useState(parentId ?? collection?.parentId ?? "none");
  const [selectedTemplateId, setSelectedTemplateId] = useState(collection?.itemsDefaultTemplateId ?? "none");
  const [imagePath, setImagePath] = useState<string | null>(collection?.image ?? null);
  const [imagePreview, setImagePreview] = useState<string | null>(toUploadUrl(collection?.image ?? null));
  const [scrapedFromUrl, setScrapedFromUrl] = useState(collection?.scrapedFromUrl ?? "");
  const [remoteImageUrl, setRemoteImageUrl] = useState("");
  const [selectedScraperId, setSelectedScraperId] = useState("");
  const [scrapeUrl, setScrapeUrl] = useState(collection?.scrapedFromUrl ?? "");
  const [scrapeName, setScrapeName] = useState(!collection);
  const [scrapeImage, setScrapeImage] = useState(!collection);
  const [deleteImage, setDeleteImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [managedFields, setManagedFields] = useState<ManagedCollectionDatumField[]>(() => buildManagedFields(collection, choiceLists));
  const [childrenDisplayConfig, setChildrenDisplayConfig] = useState<DisplayConfigPayload>(() =>
    getDefaultDisplayConfig("children", collection?.childrenDisplayConfig),
  );
  const [itemsDisplayConfig, setItemsDisplayConfig] = useState<DisplayConfigPayload>(() =>
    getDefaultDisplayConfig("items", collection?.itemsDisplayConfig),
  );
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const scrapeHtmlInputRef = useRef<HTMLInputElement | null>(null);

  const selectableParents = useMemo(() => {
    if (!collection) return parentOptions;
    return parentOptions.filter((option) => option.id !== collection.id);
  }, [collection, parentOptions]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    formData.set("visibility", visibility);
    formData.set("title", title);
    formData.set("parentId", selectedParentId === "none" ? "" : selectedParentId);
    formData.set("itemsDefaultTemplateId", selectedTemplateId === "none" ? "" : selectedTemplateId);
    formData.set("image", imagePath ?? "");
    formData.set("scrapedFromUrl", scrapedFromUrl);
    formData.set("remoteImageUrl", remoteImageUrl);
    formData.set("deleteImage", deleteImage ? "true" : "false");
    formData.set("dataPayload", JSON.stringify(managedFields.map((field, index) => serializeField(field, index))));
    formData.set("childrenDisplayConfigPayload", JSON.stringify(childrenDisplayConfig));
    formData.set("itemsDisplayConfigPayload", JSON.stringify(itemsDisplayConfig));

    const result = isEdit
      ? await updateCollection(collection.id, formData)
      : await createCollection(formData);

    if (result?.error) {
      const fieldErrors = Object.values(result.error).flat().filter(Boolean);
      setError(String(fieldErrors[0] ?? t("form.saveFailed")));
      setLoading(false);
      return;
    }

    setLoading(false);
  }

  async function handleImageUpload(file: File) {
    setUploadError(null);
    setLoading(true);

    try {
      const payload = new FormData();
      payload.set("file", file);
      payload.set("entity", "collection");

      const response = await fetch("/api/upload", {
        method: "POST",
        body: payload,
      });

      if (!response.ok) {
        const err = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(err?.error ?? tCommon("loading"));
      }

      const result = (await response.json()) as { path?: string; smallThumbnail?: string };
      const uploadedPath = result.smallThumbnail ?? result.path;

      if (!uploadedPath) {
        throw new Error(t("form.saveFailed"));
      }

      setImagePath(uploadedPath);
      setImagePreview(toUploadUrl(uploadedPath));
      setRemoteImageUrl("");
      setDeleteImage(false);
    } catch (uploadError) {
      setUploadError(uploadError instanceof Error ? uploadError.message : t("form.saveFailed"));
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
      setLoading(false);
    }
  }

  function handleRemoveImage() {
    setImagePath(null);
    setImagePreview(null);
    setRemoteImageUrl("");
    setDeleteImage(true);
    setUploadError(null);
  }

  function mergePresetFields(fields: Array<{ label: string; type: string; value: string; visibility?: "public" | "internal" | "private"; choiceListId?: string | null }>) {
    const supportedTypes = new Set(["text", "number", "country", "date", "checkbox", "choice-list"]);

    setManagedFields((current) => {
      const next = [...current];
      for (const preset of fields) {
        if (!supportedTypes.has(preset.type) || !preset.value) continue;

        const existingIndex = next.findIndex(
          (field) => field.label === preset.label && field.type === preset.type && field.choiceListId === (preset.choiceListId ?? null),
        );

        if (existingIndex >= 0) {
          next[existingIndex] = {
            ...next[existingIndex],
            visibility: preset.visibility ?? next[existingIndex].visibility,
            value: preset.type === "checkbox" ? (preset.value === "1" ? "1" : "0") : preset.value,
            selectedChoices:
              preset.type === "choice-list"
                ? limitChoiceValues(parseChoiceListValues(preset.value), choiceLists.find((choiceList) => choiceList.id === preset.choiceListId) ?? null)
                : next[existingIndex].selectedChoices,
          };
          continue;
        }

        next.push(
          buildFieldFromPreset(
            {
              label: preset.label,
              type: preset.type,
              visibility: preset.visibility ?? "public",
              choiceListId: preset.choiceListId ?? null,
              value: preset.value,
            },
            choiceLists,
            next.length,
          ),
        );
      }
      return next;
    });
  }

  async function previewScraper() {
    const htmlFile = scrapeHtmlInputRef.current?.files?.[0];
    if (!selectedScraperId || (!scrapeUrl && !htmlFile)) return;

    const request = new FormData();
    request.set("scraperId", selectedScraperId);
    request.set("url", scrapeUrl);
    request.set("scrapName", scrapeName ? "1" : "0");
    request.set("scrapImage", scrapeImage ? "1" : "0");
    if (htmlFile) request.set("htmlFile", htmlFile);

    const response = await fetch("/api/scrapers/collection-preview", { method: "POST", body: request });
    if (!response.ok) {
      setError(t("form.scrapeFailed"));
      return;
    }

    const data = (await response.json()) as {
      name: string | null;
      imageUrl: string | null;
      scrapedUrl: string | null;
      data: Array<{ id: string; label: string; type: string; value: string | null }>;
    };

    if (data.name) setTitle(data.name);
    if (data.scrapedUrl) {
      setScrapeUrl(data.scrapedUrl);
      setScrapedFromUrl(data.scrapedUrl);
    }
    if (data.imageUrl) {
      setImagePath(null);
      setDeleteImage(false);
      setRemoteImageUrl(data.imageUrl);
      setImagePreview(data.imageUrl);
    }

    mergePresetFields(
      data.data.flatMap((datum) => (datum.value ? [{ label: datum.label, type: datum.type, value: datum.value }] : [])),
    );
  }

  function addField(type: (typeof COLLECTION_FIELD_TYPES)[number] | "choice-list", choiceList?: ChoiceListOption) {
    setManagedFields((current) => [
      ...current,
      {
        key: `new-${type}-${Math.random().toString(36).slice(2, 10)}`,
        datumId: null,
        label: type === "choice-list" ? choiceList?.name ?? "" : "",
        type,
        visibility: "public",
        choiceListId: choiceList?.id ?? null,
        position: current.length,
        value: type === "checkbox" ? "0" : "",
        choices: normalizeChoiceValues(choiceList?.choices),
        selectedChoices: [],
        file: null,
        originalFilename: null,
      },
    ]);
  }

  function updateField(key: string, updater: (field: ManagedCollectionDatumField) => ManagedCollectionDatumField) {
    setManagedFields((current) => current.map((field) => (field.key === key ? updater(field) : field)));
  }

  function removeField(key: string) {
    setManagedFields((current) => current.filter((field) => field.key !== key));
  }

  function moveField(key: string, direction: -1 | 1) {
    setManagedFields((current) => {
      const index = current.findIndex((field) => field.key === key);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function updateDisplayConfig(kind: "children" | "items", updater: (current: DisplayConfigPayload) => DisplayConfigPayload) {
    if (kind === "children") {
      setChildrenDisplayConfig((current) => updater(current));
      return;
    }

    setItemsDisplayConfig((current) => updater(current));
  }

  function toggleDisplayColumn(kind: "children" | "items", value: string) {
    updateDisplayConfig(kind, (current) => ({
      ...current,
      columns: current.columns.includes(value)
        ? current.columns.filter((column) => column !== value)
        : [...current.columns, value],
    }));
  }

  function renderDisplayConfigSection(
    kind: "children" | "items",
    title: string,
    description: string,
    config: DisplayConfigPayload,
    sortingOptions: DisplayConfigOption[],
    columnOptions: DisplayConfigOption[],
  ) {
    const isListMode = config.displayMode === "list";

    return (
      <div className="space-y-4 rounded-lg border p-4">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={`${kind}-label`}>{t("form.displayTitle")}</Label>
            <Input
              id={`${kind}-label`}
              value={config.label}
              onChange={(event) => updateDisplayConfig(kind, (current) => ({ ...current, label: event.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${kind}-display-mode`}>{t("form.displayMode")}</Label>
            <Select
              value={config.displayMode}
              onValueChange={(value) =>
                updateDisplayConfig(kind, (current) => ({ ...current, displayMode: value as DisplayConfigPayload["displayMode"] }))
              }
            >
              <SelectTrigger id={`${kind}-display-mode`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="grid">{t("form.gridMode")}</SelectItem>
                <SelectItem value="list">{t("form.listMode")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={`${kind}-sorting-property`}>{t("form.sortingProperty")}</Label>
            <Select
              value={config.sortingProperty ?? "__default__"}
              onValueChange={(value) => updateDisplayConfig(kind, (current) => ({ ...current, sortingProperty: value === "__default__" ? null : value }))}
            >
              <SelectTrigger id={`${kind}-sorting-property`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sortingOptions.map((option) => (
                  <SelectItem key={`${kind}-${option.value || "default"}`} value={option.value || "__default__"}>
                    {option.value === ""
                      ? t("form.defaultSorting")
                      : option.value === RESERVED_SORTING_VALUES.numberOfChildren
                      ? t("form.numberOfChildren")
                      : option.value === RESERVED_SORTING_VALUES.numberOfItems
                        ? t("form.numberOfItems")
                        : option.value === RESERVED_SORTING_VALUES.quantity
                          ? tCommon("quantity")
                          : option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${kind}-sorting-direction`}>{t("form.sortingDirection")}</Label>
            <Select
              value={config.sortingDirection}
              onValueChange={(value) =>
                updateDisplayConfig(kind, (current) => ({ ...current, sortingDirection: value as DisplayConfigPayload["sortingDirection"] }))
              }
            >
              <SelectTrigger id={`${kind}-sorting-direction`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ASC">{t("form.sortAsc")}</SelectItem>
                <SelectItem value="DESC">{t("form.sortDesc")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {isListMode && (
          <>
            <div className="space-y-2">
              <Label>{t("form.listColumns")}</Label>
              {columnOptions.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {columnOptions.map((option) => {
                    const selected = config.columns.includes(option.value);
                    return (
                      <Badge
                        key={`${kind}-${option.value}`}
                        variant={selected ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleDisplayColumn(kind, option.value)}
                      >
                        {option.label}
                      </Badge>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{t("form.noColumnOptions")}</p>
              )}
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={config.showVisibility}
                  onChange={(event) => updateDisplayConfig(kind, (current) => ({ ...current, showVisibility: event.target.checked }))}
                />
                <span>{t("form.showVisibility")}</span>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={config.showActions}
                  onChange={(event) => updateDisplayConfig(kind, (current) => ({ ...current, showActions: event.target.checked }))}
                />
                <span>{t("form.showActions")}</span>
              </label>
              {kind === "children" ? (
                <>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={config.showNumberOfChildren}
                      onChange={(event) =>
                        updateDisplayConfig(kind, (current) => ({ ...current, showNumberOfChildren: event.target.checked }))
                      }
                    />
                    <span>{t("form.showNumberOfChildren")}</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={config.showNumberOfItems}
                      onChange={(event) =>
                        updateDisplayConfig(kind, (current) => ({ ...current, showNumberOfItems: event.target.checked }))
                      }
                    />
                    <span>{t("form.showNumberOfItems")}</span>
                  </label>
                </>
              ) : (
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={config.showItemQuantities}
                    onChange={(event) =>
                      updateDisplayConfig(kind, (current) => ({ ...current, showItemQuantities: event.target.checked }))
                    }
                  />
                  <span>{t("form.showItemQuantities")}</span>
                </label>
              )}
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="space-y-2">
        <Label htmlFor="title">{t("form.title")} *</Label>
        <Input id="title" name="title" required value={title} onChange={(event) => setTitle(event.target.value)} />
      </div>

      {scrapers.length > 0 && (
        <div className="space-y-4 rounded-lg border p-4">
          <div>
            <h2 className="text-lg font-semibold">{t("form.scrape")}</h2>
            <p className="text-sm text-muted-foreground">{t("form.scrapeHelp")}</p>
          </div>
          <p className="rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">{t("form.scrapeManualNotice")}</p>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="collection-scraper">{t("form.scraper")}</Label>
              <Select value={selectedScraperId || "none"} onValueChange={(value) => setSelectedScraperId(value === "none" ? "" : value)}>
                <SelectTrigger id="collection-scraper">
                  <SelectValue placeholder={t("form.noScraper")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("form.noScraper")}</SelectItem>
                  {scrapers.map((scraper) => (
                    <SelectItem key={scraper.id} value={scraper.id}>
                      {scraper.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="scrape-url">{t("form.scrapeUrl")}</Label>
              <Input id="scrape-url" value={scrapeUrl} onChange={(event) => setScrapeUrl(event.target.value)} />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="scrape-html-file">{t("form.scrapeHtmlFile")}</Label>
              <Input ref={scrapeHtmlInputRef} id="scrape-html-file" type="file" accept=".html,text/html" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="scrapedFromUrl">{t("form.scrapedFromUrl")}</Label>
              <Input id="scrapedFromUrl" value={scrapedFromUrl} onChange={(event) => setScrapedFromUrl(event.target.value)} />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={scrapeName} onChange={(event) => setScrapeName(event.target.checked)} />
              <span>{t("form.scrapeName")}</span>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={scrapeImage} onChange={(event) => setScrapeImage(event.target.checked)} />
              <span>{t("form.scrapeImage")}</span>
            </label>
            <Button type="button" variant="outline" onClick={previewScraper} disabled={!selectedScraperId || loading}>
              {t("form.previewScrape")}
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="parentId">{t("form.parent")}</Label>
        <Select value={selectedParentId} onValueChange={setSelectedParentId}>
          <SelectTrigger id="parentId">
            <SelectValue placeholder={t("form.noParent")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">{t("form.noParent")}</SelectItem>
            {selectableParents.map((parent) => (
              <SelectItem key={parent.id} value={parent.id}>
                {parent.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="color">{t("form.color")}</Label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            id="color"
            name="color"
            defaultValue={normalizeColorValue(collection?.color)}
            className="h-9 w-16 cursor-pointer rounded border border-input"
          />
          <span className="text-sm text-muted-foreground">{t("form.colorHelp")}</span>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="imageFile">{t("form.image")}</Label>
        <div className="flex flex-col gap-3 rounded-md border p-3">
          {imagePreview ? (
            <div className="flex items-center gap-3">
              <img
                src={imagePreview}
                alt={t("form.image")}
                className="h-20 w-20 rounded object-cover"
              />
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={loading}>
                  {t("form.changeImage")}
                </Button>
                <Button type="button" variant="outline" onClick={handleRemoveImage} disabled={loading}>
                  {t("form.removeImage")}
                </Button>
              </div>
            </div>
          ) : (
            <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={loading}>
              {t("form.image")}
            </Button>
          )}

          <input
            ref={fileInputRef}
            id="imageFile"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleImageUpload(file);
            }}
          />

          {uploadError && <p className="text-sm text-destructive">{uploadError}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="visibility">{tCommon("visibility")}</Label>
        <Select value={visibility} onValueChange={setVisibility}>
          <SelectTrigger id="visibility">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {VISIBILITY_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {templates.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="itemsDefaultTemplateId">{t("form.template")}</Label>
          <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
            <SelectTrigger id="itemsDefaultTemplateId">
              <SelectValue placeholder={t("form.noTemplate")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{t("form.noTemplate")}</SelectItem>
              {templates.map((template) => (
                <SelectItem key={template.id} value={template.id}>
                  {template.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {renderDisplayConfigSection(
        "items",
        t("form.itemsSettings"),
        t("form.itemsSettingsHelp"),
        itemsDisplayConfig,
        itemsSortingOptions,
        itemsColumnOptions,
      )}

      {renderDisplayConfigSection(
        "children",
        t("form.childrenSettings"),
        t("form.childrenSettingsHelp"),
        childrenDisplayConfig,
        childrenSortingOptions,
        childrenColumnOptions,
      )}

      <div className="space-y-3 rounded-lg border p-4">
        <div>
          <h2 className="text-lg font-semibold">{t("form.data")}</h2>
          <p className="text-sm text-muted-foreground">{t("form.dataHelp")}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {COLLECTION_FIELD_TYPES.map((type) => (
            <Button key={type} type="button" variant="outline" size="sm" onClick={() => addField(type)}>
              {tItems("form.addFieldType", { type: tTemplates(`fieldTypes.${type}` as never) })}
            </Button>
          ))}
          {choiceLists.map((choiceList) => (
            <Button key={choiceList.id} type="button" variant="outline" size="sm" onClick={() => addField("choice-list", choiceList)}>
              {tItems("form.addChoiceListField", { name: choiceList.name })}
            </Button>
          ))}
        </div>

        <div className="space-y-4">
          {managedFields.length > 0 ? managedFields.map((field, index) => (
            <div key={field.key} className="space-y-3 rounded-lg border p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium">{field.label || tItems("form.fieldFallback", { index: index + 1 })}</p>
                  <Badge variant="outline" className="rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide">
                    {tTemplates(`fieldTypes.${field.type}` as never)}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => moveField(field.key, -1)} disabled={index === 0}>↑</Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => moveField(field.key, 1)} disabled={index === managedFields.length - 1}>↓</Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => removeField(field.key)}>{tCommon("delete")}</Button>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor={`${field.key}-label`}>{tItems("form.fieldLabel")}</Label>
                  <Input id={`${field.key}-label`} value={field.label} onChange={(event) => updateField(field.key, (current) => ({ ...current, label: event.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`${field.key}-visibility`}>{tCommon("visibility")}</Label>
                  <Select value={field.visibility} onValueChange={(value) => updateField(field.key, (current) => ({ ...current, visibility: value as ManagedCollectionDatumField["visibility"] }))}>
                    <SelectTrigger id={`${field.key}-visibility`}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {VISIBILITY_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {field.type === "choice-list" ? (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {field.choices.map((choice) => {
                      const choiceList = choiceLists.find((entry) => entry.id === field.choiceListId) ?? null;
                      const selected = isSingleChoiceList(choiceList) ? field.selectedChoices[0] === choice : field.selectedChoices.includes(choice);
                      return (
                        <Badge
                          key={choice}
                          variant={selected ? "default" : "outline"}
                          className="cursor-pointer rounded-full px-3 py-1"
                          onClick={() =>
                            updateField(field.key, (current) => ({
                              ...current,
                              selectedChoices: isSingleChoiceList(choiceList)
                                ? selected
                                  ? []
                                  : [choice]
                                : selected
                                  ? current.selectedChoices.filter((entry) => entry !== choice)
                                  : [...current.selectedChoices, choice],
                            }))
                          }
                        >
                          {choice}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              ) : field.type === "checkbox" ? (
                <label className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                  <input id={field.key} type="checkbox" checked={field.value === "1"} onChange={(event) => updateField(field.key, (current) => ({ ...current, value: event.target.checked ? "1" : "0" }))} />
                  <span>{tItems("form.checkboxLabel")}</span>
                </label>
              ) : field.type === "file" ? (
                <div className="space-y-3">
                  <div className="rounded-lg border border-dashed p-3 text-sm">
                    {field.originalFilename ?? field.file ?? tCommon("none")}
                  </div>
                  <Input
                    type="file"
                    name={`datum-upload-${field.key}`}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (!file) return;
                      updateField(field.key, (current) => ({
                        ...current,
                        originalFilename: file.name,
                      }));
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => updateField(field.key, (current) => ({ ...current, file: null, originalFilename: null }))}
                  >
                    {tItems("form.removeFile")}
                  </Button>
                </div>
              ) : (
                <Input
                  id={field.key}
                  value={field.value}
                  onChange={(event) => updateField(field.key, (current) => ({ ...current, value: event.target.value }))}
                  type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
                />
              )}
            </div>
          )) : <p className="text-sm text-muted-foreground">{t("form.noDataFields")}</p>}
        </div>
      </div>

      <input type="hidden" name="visibility" value={visibility} />
      <input type="hidden" name="parentId" value={selectedParentId === "none" ? "" : selectedParentId} />
      <input type="hidden" name="itemsDefaultTemplateId" value={selectedTemplateId === "none" ? "" : selectedTemplateId} />
      <input type="hidden" name="image" value={imagePath ?? ""} />
      <input type="hidden" name="scrapedFromUrl" value={scrapedFromUrl} />
      <input type="hidden" name="remoteImageUrl" value={remoteImageUrl} />
      <input type="hidden" name="childrenDisplayConfigPayload" value={JSON.stringify(childrenDisplayConfig)} />
      <input type="hidden" name="itemsDisplayConfigPayload" value={JSON.stringify(itemsDisplayConfig)} />
      <input type="hidden" name="deleteImage" value={deleteImage ? "true" : "false"} />

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={loading}>
          {loading ? tCommon("saving") : isEdit ? tCommon("edit") : tCommon("create")}
        </Button>
        <Button asChild type="button" variant="outline">
          <Link href={cancelHref}>
            {tCommon("cancel")}
          </Link>
        </Button>
      </div>
    </form>
  );
}
