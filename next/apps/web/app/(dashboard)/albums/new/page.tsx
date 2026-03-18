import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth-utils";
import { AlbumForm } from "@/components/albums/AlbumForm";

export const metadata: Metadata = { title: "Nuovo Album" };

export default async function NewAlbumPage() {
  const session = await requireAuth();
  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Nuovo Album</h1>
      <AlbumForm />
    </div>
  );
}

