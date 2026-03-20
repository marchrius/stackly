"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";

interface DeleteResourceButtonProps {
  endpoint: string;
  redirectTo: string;
  description: string;
  triggerLabel?: string;
  size?: "sm" | "default" | "lg" | "icon";
}

export function DeleteResourceButton({ endpoint, redirectTo, description, triggerLabel, size = "sm" }: DeleteResourceButtonProps) {
  const router = useRouter();
  const [error, setError] = useState("");

  async function handleDelete() {
    setError("");
    const response = await fetch(endpoint, { method: "DELETE" });
    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new Error(data?.error ?? "Delete failed");
    }
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <div className="space-y-2">
      {error && <p className="text-sm text-destructive">{error}</p>}
      <DeleteConfirmDialog
        description={description}
        triggerLabel={triggerLabel}
        size={size}
        onConfirm={async () => {
          try {
            await handleDelete();
          } catch (err) {
            setError(err instanceof Error ? err.message : "Delete failed");
          }
        }}
      />
    </div>
  );
}
