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
        <span className="text-sm text-muted-foreground hidden sm:block">{user.name}</span>

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
