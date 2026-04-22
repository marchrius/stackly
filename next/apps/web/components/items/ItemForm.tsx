"use client";

import type { ChoiceList, Datum, Field, Item, Tag, Template } from "@stackly/db";
import { CURRENCIES } from "@stackly/lib";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
  Textarea,
} from "@stackly/ui";
import { createItem, updateItem } from "@/lib/actions/item.actions";
import {
  isSingleChoiceList,
  limitChoiceValues,
  normalizeChoiceValues,
  parseChoiceListValues,
} from "@/lib/choice-lists";
import { useTranslations } from "next-intl";

type ItemWithRelations = Item & {
  data: Datum[];
  tags: Tag[];
  relatedItems: Pick<Item, "id" | "name">[];
  relatedTo: Pick<Item, "id" | "name">[];
};

type ChoiceListOption = Pick<ChoiceList, "id" | "name" | "choices" | "displayMode" | "selectionMode">;
type TemplateField = Pick<Field, "id" | "name" | "type" | "visibility" | "position" | "choiceListId" | "displayMode"> & {
  choiceList?: Pick<ChoiceList, "id" | "name" | "choices"> | null;
};
type ItemTemplate = Pick<Template, "id" | "name"> & { fields: TemplateField[] };
type CollectionOption = { id: string; title: string; itemsDefaultTemplate: ItemTemplate | null };
type RelatedItemOption = { id: string; name: string; imageSmallThumbnail: string | null; collection: { title: string } | null };
type ScraperOption = { id: string; name: string };
type PresetField = {
  label: string;
  type: string;
  visibility: "public" | "internal" | "private";
  choiceListId: string | null;
  displayMode?: "pill" | "list";
  value: string;
};

type ManagedDatumField = {
  key: string;
  datumId: string | null;
  label: string;
  type: string;
  visibility: "public" | "internal" | "private";
  choiceListId: string | null;
  displayMode: "pill" | "list";
  position: number;
  value: string;
  currency: string | null;
  choices: string[];
  selectedChoices: string[];
  image: string | null;
  imageSmallThumbnail: string | null;
  file: string | null;
  video: string | null;
  originalFilename: string | null;
  previewUrl: string | null;
  remoteUrl: string | null;
};

interface ItemFormProps {
  item?: ItemWithRelations;
  tags: Tag[];
  choiceLists: ChoiceListOption[];
  templates: ItemTemplate[];
  collections: CollectionOption[];
  relatedItems: RelatedItemOption[];
  scrapers: ScraperOption[];
  initialTemplate?: ItemTemplate | null;
  defaultCollectionId?: string | undefined;
  initialSuggestedNames?: string[];
  initialSharedTagIds?: string[];
}

const BASIC_FIELD_TYPES = ["text", "textarea", "number", "price", "date", "rating", "country", "link", "list", "checkbox"];
const MEDIA_FIELD_TYPES = ["image", "file", "video", "sign"];
const STRUCTURE_FIELD_TYPES = ["section", "blank-line"];
const MEDIA_TYPES = new Set(MEDIA_FIELD_TYPES);

function parseListValue(value: string | null | undefined) {
  if (!value) return "";

  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.filter((entry): entry is string => typeof entry === "string").join("\n") : value;
  } catch {
    return value;
  }
}

function buildManagedFields(item: ItemWithRelations | undefined, template: ItemTemplate | null | undefined, choiceLists: ChoiceListOption[]) {
  if (item) {
    return [...item.data]
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
      .map((datum, index) => {
        const fallbackChoiceList = choiceLists.find((choiceList) => choiceList.id === datum.choiceListId) ?? null;
        return {
          key: `datum-${datum.id}`,
          datumId: datum.id,
          label: datum.label ?? "",
          type: datum.type,
          visibility: datum.visibility as ManagedDatumField["visibility"],
          choiceListId: datum.choiceListId ?? null,
          displayMode: datum.displayMode === "pill" ? "pill" : "list",
          position: datum.position ?? index,
          value:
            datum.type === "list"
              ? parseListValue(datum.value)
              : datum.type === "checkbox"
                ? datum.value === "1"
                  ? "1"
                  : "0"
                : datum.value ?? "",
          currency: datum.type === "price" ? datum.currency ?? null : null,
          choices: normalizeChoiceValues(fallbackChoiceList?.choices),
          selectedChoices: datum.type === "choice-list" ? limitChoiceValues(parseChoiceListValues(datum.value), fallbackChoiceList) : [],
          image: datum.image ?? null,
          imageSmallThumbnail: datum.imageSmallThumbnail ?? null,
          file: datum.file ?? null,
          video: datum.video ?? null,
          originalFilename: datum.originalFilename ?? null,
          previewUrl: datum.imageSmallThumbnail ?? datum.image ?? null,
        remoteUrl: null,
        } satisfies ManagedDatumField;
      });
  }

  if (!template?.fields.length) return [];

  return [...template.fields]
    .sort((a, b) => a.position - b.position)
      .map((field, index) => {
        const fallbackChoiceList = choiceLists.find((choiceList) => choiceList.id === field.choiceListId) ?? null;
        return {
          key: `field-${field.id}`,
          datumId: null,
          label: field.name,
          type: field.type,
          visibility: field.visibility as ManagedDatumField["visibility"],
          choiceListId: field.choiceListId ?? null,
          displayMode: field.displayMode === "pill" ? "pill" : "list",
          position: field.position ?? index,
          value: field.type === "checkbox" ? "0" : "",
          currency: null,
          choices: normalizeChoiceValues(field.choiceList?.choices ?? fallbackChoiceList?.choices),
          selectedChoices: [],
          image: null,
          imageSmallThumbnail: null,
          file: null,
          video: null,
          originalFilename: null,
          previewUrl: null,
          remoteUrl: null,
        } satisfies ManagedDatumField;
      });
}

function buildFieldFromPreset(
  preset: PresetField,
  choiceLists: ChoiceListOption[],
  position: number,
  keyPrefix = "preset",
): ManagedDatumField {
  const fallbackChoiceList = choiceLists.find((choiceList) => choiceList.id === preset.choiceListId) ?? null;
  return {
    key: `${keyPrefix}-${preset.type}-${position}-${Math.random().toString(36).slice(2, 8)}`,
    datumId: null,
    label: preset.label,
    type: preset.type,
    visibility: preset.visibility,
    choiceListId: preset.choiceListId,
    displayMode: preset.type === "list" ? (preset.displayMode ?? "list") : "list",
    position,
    value: preset.type === "list" ? parseListValue(preset.value) : preset.type === "checkbox" ? (preset.value === "1" ? "1" : "0") : preset.value,
    currency: null,
    choices: normalizeChoiceValues(fallbackChoiceList?.choices),
    selectedChoices: preset.type === "choice-list" ? limitChoiceValues(parseChoiceListValues(preset.value), fallbackChoiceList) : [],
    image: null,
    imageSmallThumbnail: null,
    file: null,
    video: null,
    originalFilename: null,
    previewUrl: null,
    remoteUrl: null,
  };
}

function serializeField(field: ManagedDatumField, position: number) {
  let value = field.value;
  if (field.type === "checkbox") value = field.value === "1" ? "1" : "0";
  if (field.type === "list") {
    const listValues = field.value
      .split("\n")
      .map((entry) => entry.trim())
      .filter(Boolean);
    value = listValues.length > 0 ? JSON.stringify(listValues) : "";
  }
  if (field.type === "choice-list") {
    value = field.selectedChoices.length > 0 ? JSON.stringify(field.selectedChoices) : "";
  }

  return {
    id: field.datumId,
    label: field.label,
    type: field.type,
    visibility: field.visibility,
    choiceListId: field.choiceListId,
    displayMode: field.displayMode,
    position,
    value,
    currency: field.type === "price" ? field.currency : null,
    image: field.image,
    imageSmallThumbnail: field.imageSmallThumbnail,
    file: field.file,
    video: field.video,
    originalFilename: field.originalFilename,
    uploadKey: `datum-upload-${field.key}`,
    remoteUrl: field.remoteUrl,
  };
}

function getMediaPath(field: ManagedDatumField) {
  return field.imageSmallThumbnail ?? field.image ?? field.video ?? field.file ?? null;
}

export function ItemForm({
  item,
  tags,
  choiceLists,
  templates,
  collections,
  relatedItems,
  scrapers,
  initialTemplate,
  defaultCollectionId,
  initialSuggestedNames = [],
  initialSharedTagIds = [],
}: ItemFormProps) {
  const router = useRouter();
  const t = useTranslations("items");
  const tCommon = useTranslations("common");
  const tSettings = useTranslations("settings");
  const tVisibility = useTranslations("visibility");
  const tTemplates = useTranslations("templates");
  const isEdit = Boolean(item);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState(item?.name ?? initialSuggestedNames[0] ?? "");
  const [quantity, setQuantity] = useState(String(item?.quantity ?? 1));
  const [scrapedFromUrl, setScrapedFromUrl] = useState(item?.scrapedFromUrl ?? "");
  const [selectedTags, setSelectedTags] = useState<string[]>(item?.tags.map((tag) => tag.id) ?? initialSharedTagIds);
  const [relatedItemIds, setRelatedItemIds] = useState<string[]>([
    ...new Set([...(item?.relatedItems.map((related) => related.id) ?? []), ...(item?.relatedTo.map((related) => related.id) ?? [])]),
  ]);
  const [tagSearch, setTagSearch] = useState("");
  const [relatedSearch, setRelatedSearch] = useState("");
  const [visibility, setVisibility] = useState<ManagedDatumField["visibility"]>((item?.visibility as ManagedDatumField["visibility"]) ?? "public");
  const [selectedCollectionId, setSelectedCollectionId] = useState(item?.collectionId ?? defaultCollectionId ?? "");
  const [selectedTemplateId, setSelectedTemplateId] = useState(initialTemplate?.id ?? "");
  const [managedFields, setManagedFields] = useState<ManagedDatumField[]>(() => buildManagedFields(item, initialTemplate, choiceLists));
  const [suggestedNames, setSuggestedNames] = useState<string[]>(initialSuggestedNames);
  const [removeImage, setRemoveImage] = useState(false);
  const [mainImagePreview, setMainImagePreview] = useState<string | null>(item?.imageSmallThumbnail ?? item?.image ?? null);
  const [mainImageRemoteUrl, setMainImageRemoteUrl] = useState<string>("");
  const [selectedScraperId, setSelectedScraperId] = useState("");
  const [scrapeUrl, setScrapeUrl] = useState(item?.scrapedFromUrl ?? "");
  const [scrapeName, setScrapeName] = useState(true);
  const [scrapeImage, setScrapeImage] = useState(true);
  const [saveAndAddAnother, setSaveAndAddAnother] = useState(false);

  const relatedOptions = useMemo(() => relatedItems.filter((related) => related.id !== item?.id), [item?.id, relatedItems]);
  const filteredTags = useMemo(
    () => tags.filter((tag) => tag.label.toLowerCase().includes(tagSearch.trim().toLowerCase())),
    [tagSearch, tags],
  );
  const filteredRelatedItems = useMemo(() => {
    const query = relatedSearch.trim().toLowerCase();
    return relatedOptions
      .filter((related) => !relatedItemIds.includes(related.id))
      .filter((related) => !query || related.name.toLowerCase().includes(query))
      .slice(0, 12);
  }, [relatedItemIds, relatedOptions, relatedSearch]);
  const collectionDefaultTemplate = useMemo(
    () => collections.find((collection) => collection.id === selectedCollectionId)?.itemsDefaultTemplate ?? null,
    [collections, selectedCollectionId],
  );
  const textFields = useMemo(() => managedFields.filter((field) => !MEDIA_TYPES.has(field.type)), [managedFields]);
  const mediaFields = useMemo(() => managedFields.filter((field) => MEDIA_TYPES.has(field.type)), [managedFields]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(event.currentTarget);
    selectedTags.forEach((id) => formData.append("tagIds[]", id));
    relatedItemIds.forEach((id) => formData.append("relatedItemIds[]", id));
    formData.set("name", name);
    formData.set("quantity", quantity);
    formData.set("visibility", visibility);
    formData.set("collectionId", selectedCollectionId);
    formData.set("scrapedFromUrl", scrapedFromUrl);
    formData.set("remoteImageUrl", mainImageRemoteUrl);
    formData.set("removeImage", removeImage ? "1" : "0");
    formData.set("saveAndAddAnother", !isEdit && saveAndAddAnother ? "1" : "0");
    formData.set("dataPayload", JSON.stringify(managedFields.map((field, index) => serializeField(field, index))));

    const result = isEdit ? await updateItem(item!.id, formData) : await createItem(formData);

    if (result?.error) {
      const fieldErrors = Object.values(result.error).flat().filter(Boolean);
      setError(String(fieldErrors[0] ?? t("form.saveFailed")));
      setLoading(false);
      return;
    }

    setLoading(false);
  }

  function addField(type: string, preset?: Partial<PresetField>) {
    const fallbackChoiceList = choiceLists.find((choiceList) => choiceList.id === preset?.choiceListId) ?? null;
    setManagedFields((current) => [
      ...current,
      {
        key: `new-${type}-${Math.random().toString(36).slice(2, 10)}`,
        datumId: null,
        label: preset?.label ?? (type === "choice-list" ? fallbackChoiceList?.name ?? "" : ""),
        type,
        visibility: preset?.visibility ?? "public",
        choiceListId: preset?.choiceListId ?? null,
        position: current.length,
        value: type === "checkbox" ? "0" : type === "list" ? parseListValue(preset?.value ?? "") : (preset?.value ?? ""),
        currency: null,
        choices: normalizeChoiceValues(fallbackChoiceList?.choices),
        selectedChoices: type === "choice-list" ? limitChoiceValues(parseChoiceListValues(preset?.value ?? ""), fallbackChoiceList) : [],
        displayMode: type === "list" ? ((preset?.displayMode as "pill" | "list" | undefined) ?? "list") : "list",
        image: null,
        imageSmallThumbnail: null,
        file: null,
        video: null,
        originalFilename: null,
        previewUrl: null,
        remoteUrl: null,
      },
    ]);
  }

  function updateField(key: string, updater: (field: ManagedDatumField) => ManagedDatumField) {
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

  function toggleTag(id: string) {
    setSelectedTags((current) => (current.includes(id) ? current.filter((tagId) => tagId !== id) : [...current, id]));
  }

  function toggleRelatedItem(id: string) {
    setRelatedItemIds((current) => (current.includes(id) ? current.filter((itemId) => itemId !== id) : [...current, id]));
  }

  function mergePresetFields(fields: PresetField[]) {
    setManagedFields((current) => {
      const next = [...current];
      for (const preset of fields) {
        const existingIndex = next.findIndex(
          (field) => field.label === preset.label && field.type === preset.type && field.choiceListId === preset.choiceListId,
        );
        if (existingIndex >= 0) {
          next[existingIndex] = {
            ...next[existingIndex],
            visibility: preset.visibility,
            value: preset.type === "list" ? parseListValue(preset.value) : preset.value,
            displayMode: preset.type === "list" ? (preset.displayMode ?? next[existingIndex].displayMode) : next[existingIndex].displayMode,
            selectedChoices:
              preset.type === "choice-list" ? limitChoiceValues(parseChoiceListValues(preset.value), choiceLists.find((choiceList) => choiceList.id === preset.choiceListId) ?? null) : next[existingIndex].selectedChoices,
          };
          continue;
        }

        next.push(buildFieldFromPreset(preset, choiceLists, next.length));
      }
      return next;
    });
  }

  async function loadCollectionPresets(kind: "commonFields" | "collectionFields") {
    if (!selectedCollectionId) return;

    const response = await fetch(`/api/collections/${selectedCollectionId}/item-form`, { cache: "no-store" });
    if (!response.ok) {
      setError(t("form.collectionFieldsLoadFailed"));
      return;
    }

    const data = (await response.json()) as {
      template: ItemTemplate | null;
      commonFields: PresetField[];
      collectionFields: PresetField[];
      suggestedNames: string[];
      sharedTagIds: string[];
    };

    mergePresetFields(data[kind]);
    setSuggestedNames(data.suggestedNames);
    if (!isEdit && selectedTags.length === 0 && data.sharedTagIds.length > 0) {
      setSelectedTags(data.sharedTagIds);
    }
    if (!selectedTemplateId && data.template) {
      setSelectedTemplateId(data.template.id);
    }
  }

  async function previewScraper() {
    if (!selectedScraperId || (!scrapeUrl && !(document.getElementById("scrape-html-file") as HTMLInputElement | null)?.files?.[0])) return;

    const request = new FormData();
    request.set("scraperId", selectedScraperId);
    request.set("url", scrapeUrl);
    request.set("scrapName", scrapeName ? "1" : "0");
    request.set("scrapImage", scrapeImage ? "1" : "0");
    const htmlInput = document.getElementById("scrape-html-file") as HTMLInputElement | null;
    const htmlFile = htmlInput?.files?.[0];
    if (htmlFile) request.set("htmlFile", htmlFile);

    const response = await fetch("/api/scrapers/item-preview", { method: "POST", body: request });
    if (!response.ok) {
      setError(t("form.scrapeFailed"));
      return;
    }

    const data = (await response.json()) as {
      name: string | null;
      imageUrl: string | null;
      scrapedUrl: string | null;
      data: Array<{ id: string; label: string; type: string; value: string | null; displayMode?: string | null }>;
    };

    if (data.name) setName(data.name);
    if (data.scrapedUrl) {
      setScrapeUrl(data.scrapedUrl);
      setScrapedFromUrl(data.scrapedUrl);
    }
    if (data.imageUrl) {
      setRemoveImage(false);
      setMainImageRemoteUrl(data.imageUrl);
      setMainImagePreview(data.imageUrl);
    }

    setManagedFields((current) => {
      const next = [...current];
      for (const datum of data.data) {
        if (!datum.value) continue;
        const existingIndex = next.findIndex((field) => field.label === datum.label && field.type === datum.type);
        const common: PresetField = {
          label: datum.label,
          type: datum.type,
          visibility: "public" as const,
          choiceListId: null,
          displayMode: datum.displayMode === "pill" ? "pill" : "list",
          value: datum.value,
        };

        if (datum.type === "image") {
          const field = existingIndex >= 0 ? next[existingIndex] : buildFieldFromPreset(common, choiceLists, next.length, "scrape");
          const updated = { ...field, remoteUrl: datum.value, previewUrl: datum.value, image: null, imageSmallThumbnail: null, originalFilename: datum.label };
          if (existingIndex >= 0) next[existingIndex] = updated;
          else next.push(updated);
          continue;
        }

        if (existingIndex >= 0) {
          next[existingIndex] = {
            ...next[existingIndex],
            value: datum.type === "list" ? parseListValue(datum.value) : datum.value,
            displayMode: datum.type === "list" ? (datum.displayMode === "pill" ? "pill" : "list") : next[existingIndex].displayMode,
            selectedChoices:
              datum.type === "choice-list"
                ? limitChoiceValues(parseChoiceListValues(datum.value), choiceLists.find((choiceList) => choiceList.id === next[existingIndex].choiceListId) ?? null)
                : next[existingIndex].selectedChoices,
          };
          continue;
        }

        next.push(buildFieldFromPreset(common, choiceLists, next.length, "scrape"));
      }
      return next;
    });
  }

  function applySelectedTemplate() {
    const template = templates.find((entry) => entry.id === selectedTemplateId) ?? collectionDefaultTemplate;
    if (!template) return;

    mergePresetFields(
      template.fields.map((field) => ({
        label: field.name,
        type: field.type,
        visibility: field.visibility as PresetField["visibility"],
        choiceListId: field.choiceListId ?? null,
        value: "",
      })),
    );
  }

  function handleCollectionChange(nextCollectionId: string) {
    const normalized = nextCollectionId === "__none__" ? "" : nextCollectionId;
    setSelectedCollectionId(normalized);
    const nextCollection = collections.find((collection) => collection.id === normalized);
    setSelectedTemplateId(nextCollection?.itemsDefaultTemplate?.id ?? "");
  }

  function handleMainImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setRemoveImage(false);
    setMainImageRemoteUrl("");
    setMainImagePreview(URL.createObjectURL(file));
  }

  function clearMainImage() {
    setRemoveImage(true);
    setMainImageRemoteUrl("");
    setMainImagePreview(null);
  }

  function renderField(field: ManagedDatumField, index: number) {
    const choiceListOptions = field.choices;
    const fieldTitle = field.label || t("form.fieldFallback", { index: index + 1 });

    return (
      <div key={field.key} className="space-y-3 rounded-lg border p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium">{fieldTitle}</p>
            <Badge variant="outline" className="rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide">
              {t(`fieldTypes.${field.type}` as never)}
            </Badge>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => moveField(field.key, -1)} disabled={index === 0}>
              ↑
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => moveField(field.key, 1)} disabled={index === managedFields.length - 1}>
              ↓
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => removeField(field.key)}>
              {tCommon("delete")}
            </Button>
          </div>
        </div>

        {field.type !== "blank-line" && (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`${field.key}-label`}>{t("form.fieldLabel")}</Label>
              <Input id={`${field.key}-label`} value={field.label} onChange={(event) => updateField(field.key, (current) => ({ ...current, label: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${field.key}-visibility`}>{tCommon("visibility")}</Label>
              <Select value={field.visibility} onValueChange={(value) => updateField(field.key, (current) => ({ ...current, visibility: value as ManagedDatumField["visibility"] }))}>
                <SelectTrigger id={`${field.key}-visibility`}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">{tVisibility("public")}</SelectItem>
                  <SelectItem value="internal">{tVisibility("internal")}</SelectItem>
                  <SelectItem value="private">{tVisibility("private")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {field.type === "blank-line" ? (
          <div className="border-t pt-1" />
        ) : field.type === "section" ? null : MEDIA_TYPES.has(field.type) ? (
          <div className="space-y-3">
            {getMediaPath(field) ? (
              field.type === "video" ? (
                <video controls className="max-h-64 w-full rounded-lg border bg-black" src={field.video ? `/uploads/${field.video}` : field.previewUrl ?? undefined}>
                  <track kind="captions" />
                </video>
              ) : field.type === "file" ? (
                <div className="rounded-lg border border-dashed p-3 text-sm">{field.originalFilename ?? field.file ?? t("unknownFile")}</div>
              ) : (
                <img src={field.previewUrl ?? (field.image ? `/uploads/${field.image}` : undefined)} alt={fieldTitle} className="max-h-64 rounded-lg border object-contain" />
              )
            ) : (
              <p className="text-sm text-muted-foreground">{tCommon("none")}</p>
            )}

            <Input
              type="file"
              name={`datum-upload-${field.key}`}
              accept={field.type === "video" ? "video/*" : field.type === "file" ? undefined : "image/*"}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                updateField(field.key, (current) => ({
                  ...current,
                  previewUrl: current.type === "image" || current.type === "sign" ? URL.createObjectURL(file) : current.previewUrl,
                  originalFilename: file.name,
                  remoteUrl: null,
                }));
              }}
            />

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => updateField(field.key, (current) => ({ ...current, image: null, imageSmallThumbnail: null, file: null, video: null, originalFilename: null, previewUrl: null, remoteUrl: null }))}
            >
              {t("form.removeFile")}
            </Button>
          </div>
        ) : field.type === "textarea" || field.type === "list" ? (
          <div className="space-y-3">
            {field.type === "list" && (
              <div className="space-y-2">
                <Label htmlFor={`${field.key}-display-mode`}>{t("form.displayMode")}</Label>
                <Select value={field.displayMode} onValueChange={(value) => updateField(field.key, (current) => ({ ...current, displayMode: value as "pill" | "list" }))}>
                  <SelectTrigger id={`${field.key}-display-mode`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="list">{t("form.displayModes.list")}</SelectItem>
                    <SelectItem value="pill">{t("form.displayModes.pill")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <Textarea
              id={field.key}
              value={field.value}
              rows={field.type === "list" ? 5 : 4}
              placeholder={field.type === "list" ? t("form.listPlaceholder") : undefined}
              onChange={(event) => updateField(field.key, (current) => ({ ...current, value: event.target.value }))}
            />
          </div>
        ) : field.type === "choice-list" ? (
          <div className="space-y-2">
            {choiceListOptions.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {choiceListOptions.map((choice) => {
                  const choiceList = choiceLists.find((entry) => entry.id === field.choiceListId) ?? null;
                  const isSingleChoice = isSingleChoiceList(choiceList);
                  const selected = isSingleChoice ? field.selectedChoices[0] === choice : field.selectedChoices.includes(choice);
                  return (
                    <Badge
                      key={choice}
                      variant={selected ? "default" : "outline"}
                      className="cursor-pointer rounded-full px-3 py-1"
                      onClick={() =>
                        updateField(field.key, (current) => ({
                          ...current,
                          selectedChoices: isSingleChoice
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
            ) : (
              <Input value={field.value} onChange={(event) => updateField(field.key, (current) => ({ ...current, value: event.target.value }))} />
            )}
          </div>
        ) : field.type === "checkbox" ? (
          <label className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
            <input id={field.key} type="checkbox" checked={field.value === "1"} onChange={(event) => updateField(field.key, (current) => ({ ...current, value: event.target.checked ? "1" : "0" }))} />
            <span>{t("form.checkboxLabel")}</span>
          </label>
        ) : field.type === "price" ? (
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
            <div className="space-y-2">
              <Label htmlFor={field.key}>{fieldTitle}</Label>
              <Input
                id={field.key}
                value={field.value}
                onChange={(event) => updateField(field.key, (current) => ({ ...current, value: event.target.value }))}
                type="number"
                step="0.01"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${field.key}-currency`}>{tSettings("currency")}</Label>
              <Select
                value={field.currency ?? "__none__"}
                onValueChange={(value) => updateField(field.key, (current) => ({ ...current, currency: value === "__none__" ? null : value }))}
              >
                <SelectTrigger id={`${field.key}-currency`}>
                  <SelectValue placeholder={tCommon("none")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">{tCommon("none")}</SelectItem>
                  {CURRENCIES.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code}>
                      {currency.code} ({currency.symbol})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        ) : (
          <Input
            id={field.key}
            value={field.value}
            onChange={(event) => updateField(field.key, (current) => ({ ...current, value: event.target.value }))}
            type={field.type === "number" || field.type === "rating" ? "number" : field.type === "date" ? "date" : field.type === "link" ? "url" : "text"}
            step="1"
            min={field.type === "rating" ? 0 : undefined}
            max={field.type === "rating" ? 10 : undefined}
          />
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="name">{t("form.name")}</Label>
              <Input id="name" name="name" required value={name} onChange={(event) => setName(event.target.value)} />
              {suggestedNames.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {suggestedNames.map((suggestion) => (
                    <Badge key={suggestion} variant="outline" className="cursor-pointer" onClick={() => setName(suggestion)}>
                      {t("form.useSuggestedName", { name: suggestion })}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">{t("form.quantity")}</Label>
              <Input id="quantity" name="quantity" type="number" min={1} value={quantity} onChange={(event) => setQuantity(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="visibility">{tCommon("visibility")}</Label>
              <Select value={visibility} onValueChange={(value) => setVisibility(value as ManagedDatumField["visibility"])}>
                <SelectTrigger id="visibility"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">{tVisibility("public")}</SelectItem>
                  <SelectItem value="internal">{tVisibility("internal")}</SelectItem>
                  <SelectItem value="private">{tVisibility("private")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="collectionId">{t("form.collection")}</Label>
              <Select value={selectedCollectionId || "__none__"} onValueChange={handleCollectionChange}>
                <SelectTrigger id="collectionId"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">{t("form.noCollection")}</SelectItem>
                  {collections.map((collection) => (
                    <SelectItem key={collection.id} value={collection.id}>{collection.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="templateId">{t("form.template")}</Label>
              <Select value={selectedTemplateId || "__none__"} onValueChange={(value) => setSelectedTemplateId(value === "__none__" ? "" : value)}>
                <SelectTrigger id="templateId"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">{t("form.noTemplate")}</SelectItem>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>{template.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="scrapedFromUrl">{t("form.scrapedFromUrl")}</Label>
              <Input id="scrapedFromUrl" name="scrapedFromUrl" type="url" value={scrapedFromUrl} onChange={(event) => setScrapedFromUrl(event.target.value)} />
            </div>
          </div>

          <div className="space-y-3 rounded-lg border p-4">
            <div>
              <h2 className="text-lg font-semibold">{t("form.image")}</h2>
              <p className="text-sm text-muted-foreground">{t("form.imageHelp")}</p>
            </div>
            <div className="flex flex-wrap items-start gap-4">
              <div className="relative flex h-56 w-44 items-center justify-center overflow-hidden rounded-lg border bg-muted">
                {mainImagePreview ? (
                  <img src={mainImagePreview.startsWith("blob:") ? mainImagePreview : `/uploads/${mainImagePreview}`} alt={name || tCommon("noImage")} className="max-h-full max-w-full object-contain" />
                ) : (
                  <span className="px-4 text-center text-sm text-muted-foreground">{tCommon("noImage")}</span>
                )}
              </div>
              <div className="space-y-3">
                <Input type="file" name="imageFile" accept="image/*" onChange={handleMainImageChange} />
                <Button type="button" variant="outline" onClick={clearMainImage}>{t("form.removeImage")}</Button>
              </div>
            </div>
          </div>

          <div className="space-y-3 rounded-lg border p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">{t("form.data")}</h2>
                <p className="text-sm text-muted-foreground">{selectedTemplateId ? t("form.templateReady") : t("form.dataHelp")}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={applySelectedTemplate} disabled={!selectedTemplateId && !collectionDefaultTemplate}>
                  {t("form.applyTemplate")}
                </Button>
                <Button type="button" variant="outline" onClick={() => loadCollectionPresets("commonFields")} disabled={!selectedCollectionId}>
                  {t("form.loadCommonFields")}
                </Button>
                <Button type="button" variant="outline" onClick={() => loadCollectionPresets("collectionFields")} disabled={!selectedCollectionId}>
                  {t("form.loadCollectionFields")}
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {BASIC_FIELD_TYPES.map((type) => (
                <Button key={type} type="button" variant="outline" size="sm" onClick={() => addField(type)}>
                  {t("form.addFieldType", { type: tTemplates(`fieldTypes.${type}` as never) })}
                </Button>
              ))}
              {choiceLists.map((choiceList) => (
                <Button key={choiceList.id} type="button" variant="outline" size="sm" onClick={() => addField("choice-list", { label: choiceList.name, choiceListId: choiceList.id })}>
                  {t("form.addChoiceListField", { name: choiceList.name })}
                </Button>
              ))}
              {STRUCTURE_FIELD_TYPES.map((type) => (
                <Button key={type} type="button" variant="outline" size="sm" onClick={() => addField(type)}>
                  {t("form.addFieldType", { type: tTemplates(`fieldTypes.${type}` as never) })}
                </Button>
              ))}
            </div>

            <div className="space-y-4">
              {textFields.length > 0 ? textFields.map((field, index) => renderField(field, index)) : <p className="text-sm text-muted-foreground">{t("form.noDataFields")}</p>}
            </div>
          </div>

          <div className="space-y-3 rounded-lg border p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">{t("form.mediaFields")}</h2>
                <p className="text-sm text-muted-foreground">{t("form.mediaFieldsHelp")}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {MEDIA_FIELD_TYPES.map((type) => (
                  <Button key={type} type="button" variant="outline" size="sm" onClick={() => addField(type)}>
                    {t("form.addFieldType", { type: tTemplates(`fieldTypes.${type}` as never) })}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              {mediaFields.length > 0 ? mediaFields.map((field, index) => renderField(field, textFields.length + index)) : <p className="text-sm text-muted-foreground">{t("form.noMediaFields")}</p>}
            </div>
          </div>
        </div>

        <div className="space-y-6 xl:sticky xl:top-6 xl:self-start xl:max-h-[calc(100vh-9rem)] xl:overflow-y-auto xl:pr-1">
          <div className="space-y-3 rounded-lg border p-4">
            <div>
              <h2 className="text-lg font-semibold">{t("form.scrape")}</h2>
              <p className="text-sm text-muted-foreground">{t("form.scrapeHelp")}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="scraperId">{t("form.scraper")}</Label>
              <Select value={selectedScraperId || "__none__"} onValueChange={(value) => setSelectedScraperId(value === "__none__" ? "" : value)}>
                <SelectTrigger id="scraperId"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">{t("form.noScraper")}</SelectItem>
                  {scrapers.map((scraper) => (
                    <SelectItem key={scraper.id} value={scraper.id}>{scraper.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="scrapeUrl">{t("form.scrapeUrl")}</Label>
              <Input id="scrapeUrl" type="url" value={scrapeUrl} onChange={(event) => setScrapeUrl(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="scrape-html-file">{t("form.scrapeHtmlFile")}</Label>
              <Input id="scrape-html-file" type="file" accept="text/html,.html,.htm" />
            </div>
            <div className="space-y-2 rounded-md border px-3 py-2 text-sm">
              <label className="flex items-center gap-2"><input type="checkbox" checked={scrapeName} onChange={(event) => setScrapeName(event.target.checked)} /> {t("form.scrapeName")}</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={scrapeImage} onChange={(event) => setScrapeImage(event.target.checked)} /> {t("form.scrapeImage")}</label>
            </div>
            <Button type="button" variant="outline" onClick={previewScraper} disabled={!selectedScraperId}>
              {t("form.previewScrape")}
            </Button>
          </div>

          <div className="space-y-3 rounded-lg border p-4">
            <div>
              <h2 className="text-lg font-semibold">{t("form.tags")}</h2>
              <p className="text-sm text-muted-foreground">{t("form.tagsHelp")}</p>
            </div>
            <Input value={tagSearch} onChange={(event) => setTagSearch(event.target.value)} placeholder={tCommon("search")} />
            <div className="flex flex-wrap gap-2">
              {filteredTags.map((tag) => (
                <Badge key={tag.id} variant={selectedTags.includes(tag.id) ? "default" : "outline"} className="cursor-pointer select-none" onClick={() => toggleTag(tag.id)}>
                  {tag.label}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-3 rounded-lg border p-4">
            <div>
              <h2 className="text-lg font-semibold">{t("form.relatedItems")}</h2>
              <p className="text-sm text-muted-foreground">{t("form.relatedItemsHelp")}</p>
            </div>
            <Input value={relatedSearch} onChange={(event) => setRelatedSearch(event.target.value)} placeholder={tCommon("search")} />

            {relatedItemIds.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {relatedItemIds.map((relatedId) => {
                  const related = relatedOptions.find((entry) => entry.id === relatedId);
                  if (!related) return null;
                  return (
                    <Badge key={relatedId} variant="default" className="cursor-pointer" onClick={() => toggleRelatedItem(relatedId)}>
                      {related.name}
                    </Badge>
                  );
                })}
              </div>
            )}

            <div className="space-y-2">
              {filteredRelatedItems.map((related) => (
                <button key={related.id} type="button" className="flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm hover:bg-accent" onClick={() => toggleRelatedItem(related.id)}>
                  <span>{related.name}</span>
                  <span className="text-xs text-muted-foreground">{related.collection?.title ?? t("form.noCollection")}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <input type="hidden" name="removeImage" value={removeImage ? "1" : "0"} />
      <input type="hidden" name="remoteImageUrl" value={mainImageRemoteUrl} />
      <input type="hidden" name="saveAndAddAnother" value={!isEdit && saveAndAddAnother ? "1" : "0"} />

      <div className="flex flex-wrap gap-3 pt-2">
        <Button type="submit" disabled={loading} onClick={() => setSaveAndAddAnother(false)}>
          {loading ? tCommon("saving") : isEdit ? tCommon("edit") : tCommon("create")}
        </Button>
        {!isEdit && (
          <Button type="submit" variant="outline" disabled={loading} onClick={() => setSaveAndAddAnother(true)}>
            {t("form.saveAndAddAnother")}
          </Button>
        )}
        <Button type="button" variant="outline" onClick={() => router.back()}>
          {tCommon("cancel")}
        </Button>
      </div>
    </form>
  );
}
