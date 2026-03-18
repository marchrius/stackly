import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@koillection/db";
import { notFound } from "next/navigation";
import { SettingsForm } from "@/components/settings/SettingsForm";

export const metadata: Metadata = { title: "Impostazioni" };

export default async function SettingsPage() {
  const session = await requireAuth();

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) notFound();

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Impostazioni Profilo</h1>
      <SettingsForm user={user} />
    </div>
  );
}

