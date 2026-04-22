import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@stackly/ui";

interface PaginationProps {
  page: number;
  totalPages: number;
  getHref: (page: number) => string;
}

export function Pagination({ page, totalPages, getHref }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2">
      <Button asChild variant="outline" size="sm" disabled={page <= 1}>
        <Link href={page <= 1 ? getHref(1) : getHref(page - 1)}>
          <ChevronLeft className="h-4 w-4" />
        </Link>
      </Button>

      <div className="min-w-20 rounded-md border px-3 py-1.5 text-center text-sm text-muted-foreground">
        {page} / {totalPages}
      </div>

      <Button asChild variant="outline" size="sm" disabled={page >= totalPages}>
        <Link href={page >= totalPages ? getHref(totalPages) : getHref(page + 1)}>
          <ChevronRight className="h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
}
