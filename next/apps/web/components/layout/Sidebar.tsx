"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Library, Image, Heart, Tag, FileText, List,
  BarChart2, Clock, Package, Wrench, Search,
} from "lucide-react";
import { cn } from "@koillection/ui";

const nav = [
  { href: "/collections", label: "Collezioni", icon: Library },
  { href: "/albums", label: "Album", icon: Image },
  { href: "/wishlists", label: "Wishlist", icon: Heart },
  { href: "/tags", label: "Tag", icon: Tag },
  { href: "/templates", label: "Template", icon: FileText },
  { href: "/choice-lists", label: "Choice List", icon: List },
  { href: "/inventories", label: "Inventari", icon: Package },
  { href: "/loans", label: "Prestiti", icon: Wrench },
  { href: "/history", label: "Storico", icon: Clock },
  { href: "/statistics", label: "Statistiche", icon: BarChart2 },
  { href: "/search", label: "Cerca", icon: Search },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 flex-col border-r bg-card md:flex">
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <Library className="h-5 w-5 text-primary" />
          Koillection
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

