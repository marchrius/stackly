"use client";

import type { Path, Scraper } from "@koillection/db";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@koillection/ui";
import { Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

type ScraperHeader = {
  header: string;
  value: string;
};

type EditableScraper = Pick<Scraper, "id" | "name" | "type" | "urlPattern" | "namePath" | "imagePath" | "pricePath" | "headers"> & {
  dataPaths: Pick<Path, "id" | "name" | "type" | "path" | "position">[];
};

type HeaderState = {
  header: string;
  value: string;
};

type PathState = {
  id?: string;
  name: string;
  type: string;
  path: string;
};

const SCRAPER_TYPES = ["collection", "item", "wish"] as const;
const DATA_PATH_TYPES = ["text", "textarea", "number", "date", "rating", "price", "country", "link", "image", "list"] as const;

function parseHeaders(headers: unknown): HeaderState[] {
  if (!Array.isArray(headers)) return [];

  return headers.flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const header = "header" in entry && typeof entry.header === "string" ? entry.header : "";
    const value = "value" in entry && typeof entry.value === "string" ? entry.value : "";
    return header || value ? [{ header, value }] : [];
  });
}

function mapPathState(path?: EditableScraper["dataPaths"][number]): PathState {
  return {
    id: path?.id,
    name: path?.name ?? "",
    type: path?.type ?? "text",
    path: path?.path ?? "",
  };
}

export function ScraperForm({ scraper }: { scraper?: EditableScraper }) {
  const router = useRouter();
  const t = useTranslations("scrapers");
  const tCommon = useTranslations("common");
  const isEdit = Boolean(scraper);

  const [name, setName] = useState(scraper?.name ?? "");
  const [type, setType] = useState<string>(scraper?.type ?? "item");
  const [urlPattern, setUrlPattern] = useState(scraper?.urlPattern ?? "");
  const [namePath, setNamePath] = useState(scraper?.namePath ?? "");
  const [imagePath, setImagePath] = useState(scraper?.imagePath ?? "");
  const [pricePath, setPricePath] = useState(scraper?.pricePath ?? "");
  const [headers, setHeaders] = useState<HeaderState[]>(() => {
    const parsed = parseHeaders(scraper?.headers);
    return parsed.length > 0 ? parsed : [{ header: "", value: "" }];
  });
  const [dataPaths, setDataPaths] = useState<PathState[]>(() => {
    if (scraper?.dataPaths?.length) {
      return [...scraper.dataPaths]
        .sort((a, b) => a.position - b.position)
        .map((path) => mapPathState(path));
    }

    return [mapPathState()];
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const normalizedHeaders = useMemo(
    () => headers.map((entry) => ({ header: entry.header.trim(), value: entry.value.trim() })).filter((entry) => entry.header || entry.value),
    [headers],
  );
  const normalizedPaths = useMemo(
    () =>
      dataPaths
        .map((entry, index) => ({
          id: entry.id,
          name: entry.name.trim(),
          type: entry.type,
          path: entry.path.trim(),
          position: index + 1,
        }))
        .filter((entry) => entry.name && entry.path),
    [dataPaths],
  );

  function updateHeader(index: number, patch: Partial<HeaderState>) {
    setHeaders((current) => current.map((entry, entryIndex) => (entryIndex === index ? { ...entry, ...patch } : entry)));
  }

  function addHeader() {
    setHeaders((current) => [...current, { header: "", value: "" }]);
  }

  function removeHeader(index: number) {
    setHeaders((current) => (current.length === 1 ? current : current.filter((_, entryIndex) => entryIndex !== index)));
  }

  function updatePath(index: number, patch: Partial<PathState>) {
    setDataPaths((current) => current.map((entry, entryIndex) => (entryIndex === index ? { ...entry, ...patch } : entry)));
  }

  function addPath() {
    setDataPaths((current) => [...current, mapPathState()]);
  }

  function removePath(index: number) {
    setDataPaths((current) => (current.length === 1 ? current : current.filter((_, entryIndex) => entryIndex !== index)));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      name: name.trim(),
      type,
      urlPattern: urlPattern.trim() || null,
      namePath: namePath.trim() || null,
      imagePath: imagePath.trim() || null,
      pricePath: type === "wish" ? pricePath.trim() || null : null,
      headers: normalizedHeaders,
      dataPaths: type === "wish" ? [] : normalizedPaths,
    };

    const response = await fetch(isEdit ? `/api/scrapers/${scraper!.id}` : "/api/scrapers", {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error ?? t("form.saveFailed"));
      setSaving(false);
      return;
    }

    const saved = (await response.json()) as { id: string };
    router.push(`/scrapers/${saved.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">{t("form.name")}</Label>
          <Input id="name" value={name} onChange={(event) => setName(event.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="type">{t("form.type")}</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger id="type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SCRAPER_TYPES.map((value) => (
                <SelectItem key={value} value={value}>
                  {t(`types.${value}` as never)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="urlPattern">{t("form.urlPattern")}</Label>
          <Input id="urlPattern" value={urlPattern} onChange={(event) => setUrlPattern(event.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="namePath">{t("form.namePath")}</Label>
          <Input id="namePath" value={namePath} onChange={(event) => setNamePath(event.target.value)} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="imagePath">{t("form.imagePath")}</Label>
          <Input id="imagePath" value={imagePath} onChange={(event) => setImagePath(event.target.value)} />
        </div>
        {type === "wish" ? (
          <div className="space-y-2">
            <Label htmlFor="pricePath">{t("form.pricePath")}</Label>
            <Input id="pricePath" value={pricePath} onChange={(event) => setPricePath(event.target.value)} />
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="preview">{t("form.typeHint")}</Label>
            <Textarea id="preview" value={t("form.dataPathsHelp")} readOnly rows={3} className="resize-none" />
          </div>
        )}
      </div>

      {type !== "wish" && (
        <div className="space-y-4 rounded-lg border p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">{t("form.dataPaths")}</h2>
              <p className="text-sm text-muted-foreground">{t("form.dataPathsHelp")}</p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addPath}>
              <Plus className="mr-2 h-4 w-4" />
              {t("form.addPath")}
            </Button>
          </div>

          <div className="space-y-3">
            {dataPaths.map((path, index) => (
              <div key={path.id ?? `path-${index}`} className="rounded-lg border p-4">
                <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr_1.4fr_auto]">
                  <div className="space-y-2">
                    <Label htmlFor={`path-name-${index}`}>{t("form.pathName")}</Label>
                    <Input
                      id={`path-name-${index}`}
                      value={path.name}
                      onChange={(event) => updatePath(index, { name: event.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`path-type-${index}`}>{t("form.pathType")}</Label>
                    <Select value={path.type} onValueChange={(value) => updatePath(index, { type: value })}>
                      <SelectTrigger id={`path-type-${index}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DATA_PATH_TYPES.map((value) => (
                          <SelectItem key={value} value={value}>
                            {t(`pathTypes.${value}` as never)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`path-value-${index}`}>{t("form.pathValue")}</Label>
                    <Input
                      id={`path-value-${index}`}
                      value={path.path}
                      onChange={(event) => updatePath(index, { path: event.target.value })}
                      required
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removePath(index)}
                      disabled={dataPaths.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">{t("form.removePath")}</span>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4 rounded-lg border p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">{t("form.headers")}</h2>
            <p className="text-sm text-muted-foreground">{t("form.headersHelp")}</p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addHeader}>
            <Plus className="mr-2 h-4 w-4" />
            {t("form.addHeader")}
          </Button>
        </div>

        <div className="space-y-3">
          {headers.map((header, index) => (
            <div key={`header-${index}`} className="grid gap-4 lg:grid-cols-[1fr_1fr_auto] rounded-lg border p-4">
              <div className="space-y-2">
                <Label htmlFor={`header-name-${index}`}>{t("form.headerName")}</Label>
                <Input
                  id={`header-name-${index}`}
                  value={header.header}
                  onChange={(event) => updateHeader(index, { header: event.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`header-value-${index}`}>{t("form.headerValue")}</Label>
                <Input
                  id={`header-value-${index}`}
                  value={header.value}
                  onChange={(event) => updateHeader(index, { value: event.target.value })}
                />
              </div>
              <div className="flex items-end">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => removeHeader(index)}
                  disabled={headers.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">{t("form.removeHeader")}</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={saving}>
          {saving ? tCommon("saving") : isEdit ? tCommon("edit") : tCommon("create")}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          {tCommon("cancel")}
        </Button>
      </div>
    </form>
  );
}
