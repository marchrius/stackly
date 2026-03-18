"use client";

import { signOut } from "next-auth/react";
import { type Session } from "next-auth";
import { Button } from "@koillection/ui";
import { Settings, LogOut, User } from "lucide-react";
import Link from "next/link";

interface NavbarProps {
  user: Session["user"];
}

export function Navbar({ user }: NavbarProps) {
  return (
    <header className="flex h-14 items-center justify-between border-b bg-card px-6">
      <div className="flex items-center gap-2">
        {/* Breadcrumb dinamico può essere aggiunto qui */}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground hidden sm:block">{user.name}</span>

        <Button variant="ghost" size="icon" asChild>
          <Link href="/settings" title="Impostazioni">
            <Settings className="h-4 w-4" />
          </Link>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => signOut({ callbackUrl: "/login" })}
          title="Esci"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}

