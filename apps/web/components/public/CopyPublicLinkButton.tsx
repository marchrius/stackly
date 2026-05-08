"use client";

import { useMemo, useState } from "react";
import { Button } from "@stackly/ui";
import { Check, Copy, ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";

interface CopyPublicLinkButtonProps {
  path: string;
}

export function CopyPublicLinkButton({ path }: CopyPublicLinkButtonProps) {
  const t = useTranslations("public");
  const [copied, setCopied] = useState(false);
  const publicUrl = useMemo(() => {
    if (typeof window === "undefined") return path;
    return new URL(path, window.location.origin).toString();
  }, [path]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button type="button" variant="outline" size="sm" onClick={copyLink}>
        {copied ? <Check className="mr-1 h-4 w-4" /> : <Copy className="mr-1 h-4 w-4" />}
        {copied ? t("copiedLink") : t("copyLink")}
      </Button>
      <Button asChild variant="ghost" size="icon">
        <a href={path} target="_blank" rel="noreferrer" aria-label={t("openPublicView")}>
          <ExternalLink className="h-4 w-4" />
        </a>
      </Button>
    </div>
  );
}
