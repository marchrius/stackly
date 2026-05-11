"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@stackly/ui";
import { FileCode, KeyRound, Link2, Settings, Users } from "lucide-react";

const items = [
  { href: "/settings/admin", label: "overview", icon: Settings, exact: true },
  { href: "/settings/admin/users", label: "users", icon: Users },
  { href: "/settings/admin/scrapers", label: "scrapers", icon: FileCode },
  { href: "/settings/admin/sso", label: "sso", icon: KeyRound },
  { href: "/settings/admin/public-links", label: "publicLinks", icon: Link2 },
] as const;

export function AdminNav() {
  const pathname = usePathname();
  const t = useTranslations("admin.nav");

  return (
    <nav className="flex gap-2 overflow-x-auto border-b pb-3">
      {items.map((item) => {
        const { href, label, icon: Icon } = item;
        const active = "exact" in item ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "inline-flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
              active ? "bg-accent text-accent-foreground" : "text-muted-foreground",
            )}
          >
            <Icon className="h-4 w-4" />
            {t(label)}
          </Link>
        );
      })}
    </nav>
  );
}
