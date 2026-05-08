import { getUploadUrl } from "@stackly/lib";

export interface ItemMediaDatumLike {
  id: string;
  type: string;
  label: string | null;
  image: string | null;
  imageSmallThumbnail: string | null;
  video: string | null;
}

export interface ItemDetailLike {
  id: string;
  name: string;
  image: string | null;
  imageSmallThumbnail: string | null;
  imageLargeThumbnail?: string | null;
  data: ItemMediaDatumLike[];
}

export interface RelatedItemLike {
  id: string;
  name: string;
  imageSmallThumbnail: string | null;
}

export interface ItemMediaEntry {
  id: string;
  label: string;
  kind: "image" | "video";
  src: string;
  thumbnailSrc: string | null;
}

export function buildItemMediaEntries(item: ItemDetailLike): ItemMediaEntry[] {
  const entries: ItemMediaEntry[] = [];

  const mainImageSrc = getUploadUrl(item.imageLargeThumbnail ?? item.image);
  if (mainImageSrc) {
    entries.push({
      id: `item-${item.id}`,
      label: "main",
      kind: "image",
      src: mainImageSrc,
      thumbnailSrc: getUploadUrl(item.imageSmallThumbnail ?? item.image),
    });
  }

  for (const datum of item.data) {
    if ((datum.type === "image" || datum.type === "sign") && datum.image) {
      entries.push({
        id: datum.id,
        label: datum.label ?? "",
        kind: "image",
        src: getUploadUrl(datum.image) ?? "",
        thumbnailSrc: getUploadUrl(datum.imageSmallThumbnail ?? datum.image),
      });
    } else if (datum.type === "video" && datum.video) {
      entries.push({
        id: datum.id,
        label: datum.label ?? "",
        kind: "video",
        src: getUploadUrl(datum.video) ?? "",
        thumbnailSrc: null,
      });
    }
  }

  return entries.filter((entry) => entry.src);
}

export function getDisplayData<T extends { type: string }>(data: T[]) {
  return data.filter((datum) => !["image", "sign", "video"].includes(datum.type));
}

export function mergeRelatedItems(primary: RelatedItemLike[], secondary: RelatedItemLike[]) {
  const merged = new Map<string, RelatedItemLike>();

  for (const item of [...primary, ...secondary]) {
    if (!merged.has(item.id)) {
      merged.set(item.id, item);
    }
  }

  return [...merged.values()].sort((left, right) => left.name.localeCompare(right.name));
}
