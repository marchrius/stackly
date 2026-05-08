import { Badge } from "@stackly/ui";
import { FileDown } from "lucide-react";
import { getUploadUrl } from "@stackly/lib";
import { getChoiceListDisplayMode, limitChoiceValues, parseChoiceListValues } from "@/lib/choice-lists";
import { formatCountryValue, formatDateValue, formatPriceValue, parseListValues, renderRatingValue } from "@/lib/datum-format";

type PublicDatum = {
  id: string;
  type: string;
  label: string | null;
  value: string | null;
  displayMode: string | null;
  currency: string | null;
  file: string | null;
  originalFilename: string | null;
  choiceList: { id: string; name: string; displayMode: string | null; selectionMode: string | null } | null;
};

interface PublicDatumListProps {
  data: PublicDatum[];
  labels: {
    none: string;
    yes: string;
    no: string;
    unknownFile: string;
  };
}

export function PublicDatumList({ data, labels }: PublicDatumListProps) {
  const visibleData = data.filter((datum) => !["image", "video", "section", "blank-line"].includes(datum.type));
  if (visibleData.length === 0) return null;

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {visibleData.map((datum) => (
        <div key={datum.id} className="rounded-lg border bg-card p-3">
          {datum.label ? <p className="mb-1 text-xs font-medium text-muted-foreground">{datum.label}</p> : null}
          <PublicDatumValue datum={datum} labels={labels} />
        </div>
      ))}
    </div>
  );
}

function PublicDatumValue({ datum, labels }: { datum: PublicDatum; labels: PublicDatumListProps["labels"] }) {
  if (datum.type === "checkbox") {
    return <span className="text-sm">{datum.value === "1" ? `✓ ${labels.yes}` : `✗ ${labels.no}`}</span>;
  }

  if (datum.type === "link" && datum.value) {
    return (
      <a href={datum.value} target="_blank" rel="noreferrer" className="break-all text-sm text-primary hover:underline">
        {datum.value}
      </a>
    );
  }

  if (datum.type === "date" && datum.value) {
    return <p className="break-words text-sm">{formatDateValue(datum.value)}</p>;
  }

  if (datum.type === "list") {
    const values = parseListValues(datum.value);
    if (values.length === 0) return <p className="text-sm text-muted-foreground">{labels.none}</p>;

    if (datum.displayMode === "pill") {
      return (
        <div className="flex flex-wrap gap-2">
          {values.map((value) => (
            <Badge key={value} variant="secondary" className="rounded-full px-3 py-1">
              {value}
            </Badge>
          ))}
        </div>
      );
    }

    return (
      <ul className="list-disc space-y-1 pl-5 text-sm">
        {values.map((value) => (
          <li key={value}>{value}</li>
        ))}
      </ul>
    );
  }

  if (datum.type === "textarea") {
    return <p className="whitespace-pre-line break-words text-sm">{datum.value ?? labels.none}</p>;
  }

  if (datum.type === "file" && datum.file) {
    return (
      <a
        href={getUploadUrl(datum.file) ?? ""}
        target="_blank"
        rel="noreferrer"
        download={datum.originalFilename ?? undefined}
        className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
      >
        <FileDown className="h-4 w-4" />
        {datum.originalFilename ?? labels.unknownFile}
      </a>
    );
  }

  if (datum.type === "price") {
    return <p className="break-words text-sm">{formatPriceValue(datum.value, datum.currency) ?? labels.none}</p>;
  }

  if (datum.type === "rating") {
    return <p className="break-words text-sm">{renderRatingValue(datum.value) ?? labels.none}</p>;
  }

  if (datum.type === "country") {
    return <p className="break-words text-sm">{formatCountryValue(datum.value) ?? labels.none}</p>;
  }

  if (datum.type === "choice-list") {
    const values = limitChoiceValues(parseChoiceListValues(datum.value), datum.choiceList);
    if (values.length === 0) return <p className="text-sm text-muted-foreground">{labels.none}</p>;

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

  return <p className="break-words text-sm">{datum.value ?? labels.none}</p>;
}
