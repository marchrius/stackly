import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@koillection/db";
import { requireApiSession, jsonError } from "@/lib/api-helpers";

interface Params {
  params: Promise<{ id: string }>;
}

type PresetField = {
  label: string;
  type: string;
  visibility: "public" | "internal" | "private";
  choiceListId: string | null;
  value: string;
};

const TEXT_AND_STRUCTURE_TYPES = new Set([
  "text",
  "textarea",
  "number",
  "price",
  "date",
  "rating",
  "country",
  "link",
  "list",
  "choice-list",
  "checkbox",
  "blank-line",
  "section",
]);

export async function GET(_req: NextRequest, { params }: Params) {
  const result = await requireApiSession();
  if ("response" in result) return result.response;

  const { id } = await params;
  const collection = await prisma.collection.findFirst({
    where: { id, ownerId: result.session.user.id },
    include: {
      data: { orderBy: { position: "asc" } },
      itemsDefaultTemplate: {
        include: {
          fields: {
            orderBy: { position: "asc" },
            include: { choiceList: { select: { id: true, name: true, choices: true } } },
          },
        },
      },
      items: {
        orderBy: { createdAt: "asc" },
        include: {
          data: { orderBy: { position: "asc" } },
          tags: { select: { id: true } },
        },
      },
    },
  });

  if (!collection) return jsonError("Collection not found", 404);

  const template = collection.itemsDefaultTemplate
    ? {
        id: collection.itemsDefaultTemplate.id,
        name: collection.itemsDefaultTemplate.name,
        fields: collection.itemsDefaultTemplate.fields.map((field) => ({
          id: field.id,
          name: field.name,
          type: field.type,
          visibility: field.visibility,
          position: field.position,
          choiceListId: field.choiceListId,
          choiceList: field.choiceList,
        })),
      }
    : null;

  const collectionFields = collection.data
    .filter((datum) => TEXT_AND_STRUCTURE_TYPES.has(datum.type))
    .map<PresetField>((datum) => ({
      label: datum.label ?? "",
      type: datum.type,
      visibility: datum.visibility as PresetField["visibility"],
      choiceListId: datum.choiceListId ?? null,
      value: datum.value ?? "",
    }));

  const commonFields = buildCommonFields(collection.items);
  const suggestedNames = buildSuggestedNames(collection.items.map((item) => item.name));
  const sharedTagIds = buildSharedTagIds(collection.items.map((item) => item.tags.map((tag) => tag.id)));

  return NextResponse.json({
    template,
    collectionFields,
    commonFields,
    suggestedNames,
    sharedTagIds,
  });
}

function buildCommonFields(items: Array<{ data: Array<{ label: string | null; type: string; value: string | null; choiceListId: string | null; visibility: string }> }>) {
  const first = items[0];
  if (!first) return [];

  const initial = new Map<string, PresetField>();
  for (const datum of first.data) {
    if (!TEXT_AND_STRUCTURE_TYPES.has(datum.type)) continue;
    const label = datum.label ?? "";
    initial.set(`${label}::${datum.type}`, {
      label,
      type: datum.type,
      visibility: datum.visibility as PresetField["visibility"],
      choiceListId: datum.choiceListId ?? null,
      value: datum.value ?? "",
    });
  }

  for (const item of items.slice(1)) {
    const current = new Map(item.data.map((datum) => [`${datum.label ?? ""}::${datum.type}`, datum]));
    for (const [key, preset] of [...initial.entries()]) {
      const matching = current.get(key);
      if (!matching) {
        initial.delete(key);
        continue;
      }

      if ((matching.value ?? "") !== preset.value) {
        preset.value = "";
      }
    }
  }

  return [...initial.values()];
}

function buildSuggestedNames(names: string[]) {
  const first = names[0];
  if (!first) return [];

  const patternParts = first.split(/\d+/);
  if (patternParts.length === 0 || patternParts.length > 2) return [];

  const pattern = patternParts.join("");
  let highestValue = 0;

  for (const name of names) {
    const value = name.slice(pattern.length);
    if (!/^\d+$/.test(value)) return [];
    highestValue = Math.max(highestValue, Number(value));
  }

  return [patternParts.join(String(highestValue + 1))];
}

function buildSharedTagIds(items: string[][]) {
  const first = items[0];
  if (!first) return [];

  return first.filter((tagId) => items.every((itemTagIds) => itemTagIds.includes(tagId)));
}
