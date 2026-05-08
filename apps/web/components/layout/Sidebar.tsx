"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Library, Image, Heart, Tag, FileText, List,
  BarChart2, Clock, Package, Wrench, Search, Shield,
} from "lucide-react";
import { cn } from "@stackly/ui";

export function Sidebar({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname();
  const t = useTranslations("nav");

  const nav = [
    { href: "/collections", label: t("collections"), icon: Library },
    { href: "/albums", label: t("albums"), icon: Image },
    { href: "/wishlists", label: t("wishlists"), icon: Heart },
    { href: "/tags", label: t("tags"), icon: Tag },
    { href: "/templates", label: t("templates"), icon: FileText },
    { href: "/choice-lists", label: t("choiceLists"), icon: List },
    { href: "/inventories", label: t("inventories"), icon: Package },
    { href: "/loans", label: t("loans"), icon: Wrench },
    { href: "/history", label: t("history"), icon: Clock },
    { href: "/statistics", label: t("statistics"), icon: BarChart2 },
    { href: "/search", label: t("search"), icon: Search },
    ...(isAdmin ? [{ href: "/settings/admin", label: t("admin"), icon: Shield }] : []),
  ];

  return (
    <aside className="hidden w-60 flex-col border-r bg-card md:flex">
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <Library className="h-5 w-5 text-primary" />
          Stackly
        </Link>
      </div>
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-0.5 px-2">
          {nav.map(({ href, label, icon: Icon }) => (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                  pathname.startsWith(href)
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
