import { cn } from "@stackly/ui";
import { version } from "../../../../package.json";

interface AppVersionProps {
  variant?: "sidebar" | "footer" | "compact";
  className?: string;
}

export function AppVersion({
  variant = "footer",
  className,
}: AppVersionProps) {
  return (
    <span
      aria-label={`Stackly ${version}`}
      className={cn(
        "text-xs text-muted-foreground",
        variant === "sidebar" && "block border-t px-4 py-3 text-center",
        variant === "footer" && "block py-4 text-center",
        variant === "compact" && "whitespace-nowrap",
        className,
      )}
    >
      v{version}
    </span>
  );
}
