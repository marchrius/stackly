"use client";

import { useMemo, useState } from "react";
import type { DisplayConfiguration } from "@koillection/db";
import { Badge, Button, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@koillection/ui";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { updateCollectionIndexDisplayConfiguration } from "@/lib/actions/user.actions";
import { type DisplayConfigOption, type DisplayConfigPayload, getDefaultDisplayConfig, RESERVED_SORTING_VALUES } from "@/lib/collection-display-config";

interface CollectionIndexDisplaySettingsFormProps {
  displayConfiguration: DisplayConfiguration | null;
  sortingOptions: DisplayConfigOption[];
  columnOptions: DisplayConfigOption[];
}

export function CollectionIndexDisplaySettingsForm({
  displayConfiguration,
  sortingOptions,
  columnOptions,
}: CollectionIndexDisplaySettingsFormProps) {
  const t = useTranslations("collections");
  const tCommon = useTranslations("common");
  const [config, setConfig] = useState<DisplayConfigPayload>(() => getDefaultDisplayConfig("children", displayConfiguration));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const payload = useMemo(() => JSON.stringify(config), [config]);

  function updateConfig(updater: (current: DisplayConfigPayload) => DisplayConfigPayload) {
    setConfig((current) => updater(current));
  }

  function toggleColumn(value: string) {
    updateConfig((current) => ({
      ...current,
      columns: current.columns.includes(value)
        ? current.columns.filter((column) => column !== value)
        : [...current.columns, value],
    }));
  }

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError("");
    const result = await updateCollectionIndexDisplayConfiguration(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  const isListMode = config.displayMode === "list";

  return (
    <form action={handleSubmit} className="space-y-6">
      <input type="hidden" name="payload" value={payload} />

      <div className="space-y-4 rounded-lg border p-4">
        <div>
          <h2 className="text-lg font-semibold">{t("indexDisplayTitle")}</h2>
          <p className="text-sm text-muted-foreground">{t("indexDisplayDescription")}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="index-label">{t("form.displayTitle")}</Label>
            <Input
              id="index-label"
              value={config.label}
              onChange={(event) => updateConfig((current) => ({ ...current, label: event.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="index-display-mode">{t("form.displayMode")}</Label>
            <Select
              value={config.displayMode}
              onValueChange={(value) => updateConfig((current) => ({ ...current, displayMode: value as DisplayConfigPayload["displayMode"] }))}
            >
              <SelectTrigger id="index-display-mode">
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
            <Label htmlFor="index-sorting-property">{t("form.sortingProperty")}</Label>
            <Select
              value={config.sortingProperty ?? "__default__"}
              onValueChange={(value) => updateConfig((current) => ({ ...current, sortingProperty: value == "__default__" ? null : value }))}
            >
              <SelectTrigger id="index-sorting-property">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sortingOptions.map((option) => (
                  <SelectItem key={option.value || "default"} value={option.value || "__default__"}>
                    {option.value === ""
                      ? t("form.defaultSorting")
                      : option.value === RESERVED_SORTING_VALUES.numberOfChildren
                        ? t("form.numberOfChildren")
                        : option.value === RESERVED_SORTING_VALUES.numberOfItems
                          ? t("form.numberOfItems")
                          : option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="index-sorting-direction">{t("form.sortingDirection")}</Label>
            <Select
              value={config.sortingDirection}
              onValueChange={(value) => updateConfig((current) => ({ ...current, sortingDirection: value as DisplayConfigPayload["sortingDirection"] }))}
            >
              <SelectTrigger id="index-sorting-direction">
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
                        key={option.value}
                        variant={selected ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleColumn(option.value)}
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
                  onChange={(event) => updateConfig((current) => ({ ...current, showVisibility: event.target.checked }))}
                />
                <span>{t("form.showVisibility")}</span>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={config.showActions}
                  onChange={(event) => updateConfig((current) => ({ ...current, showActions: event.target.checked }))}
                />
                <span>{t("form.showActions")}</span>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={config.showNumberOfChildren}
                  onChange={(event) => updateConfig((current) => ({ ...current, showNumberOfChildren: event.target.checked }))}
                />
                <span>{t("form.showNumberOfChildren")}</span>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={config.showNumberOfItems}
                  onChange={(event) => updateConfig((current) => ({ ...current, showNumberOfItems: event.target.checked }))}
                />
                <span>{t("form.showNumberOfItems")}</span>
              </label>
            </div>
          </>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? tCommon("loading") : tCommon("save")}
        </Button>
        <Button asChild type="button" variant="outline">
          <Link href="/collections">{tCommon("cancel")}</Link>
        </Button>
      </div>
    </form>
  );
}
