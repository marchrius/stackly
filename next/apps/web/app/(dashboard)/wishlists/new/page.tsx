import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth-utils";
import { WishlistForm } from "@/components/wishlists/WishlistForm";

export const metadata: Metadata = { title: "Nuova Wishlist" };

export default async function NewWishlistPage() {
  const session = await requireAuth();
  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Nuova Wishlist</h1>
      <WishlistForm />
    </div>
  );
}

