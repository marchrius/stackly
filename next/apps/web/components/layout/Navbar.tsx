"use client";

import { signOut } from "next-auth/react";
import { type Session } from "next-auth";
import { Button } from "@stackly/ui";
import { Settings, LogOut } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

interface NavbarProps {
  user: Session["user"];
}

export function Navbar({ user }: NavbarProps) {
  const t = useTranslations("nav");

  return (
    <header className="flex h-14 items-center justify-between border-b bg-card px-6">
      <div className="flex items-center gap-2" />

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground hidden sm:block">{user.name}</span>
          <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border bg-muted text-xs font-semibold text-muted-foreground">
            {user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.image} alt={user.name ?? ""} className="h-full w-full object-cover" />
            ) : (
              <span>{getInitials(user.name)}</span>
            )}
          </div>
        </div>

        <Button variant="ghost" size="icon" asChild>
          <Link href="/settings" title={t("settings")}>
            <Settings className="h-4 w-4" />
          </Link>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => signOut({ callbackUrl: "/login" })}
          title={t("logout")}
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}

function getInitials(name?: string | null) {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
