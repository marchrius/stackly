"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  Button,
} from "@koillection/ui";
import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

interface DeleteConfirmDialogProps {
  /** Testo descrittivo del modale. Default: "Questa azione è irreversibile." */
  description?: string;
  /** Azione da eseguire al click su Elimina. Può essere una Server Action. */
  onConfirm: () => void | Promise<void>;
  /** Etichetta del pulsante trigger. Default: solo icona Trash2 */
  triggerLabel?: string;
  /** Dimensione del pulsante trigger */
  size?: "sm" | "default" | "lg" | "icon";
}

export function DeleteConfirmDialog({
  description,
  onConfirm,
  triggerLabel,
  size = "sm",
}: DeleteConfirmDialogProps) {
  const t = useTranslations("deleteDialog");
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);

  async function handleConfirm() {
    setPending(true);
    try {
      await onConfirm();
    } finally {
      setPending(false);
      setOpen(false);
    }
  }

  return (
    <>
      <Button
        variant="destructive"
        size={size}
        type="button"
        onClick={() => setOpen(true)}
      >
        <Trash2 className={triggerLabel ? "mr-1 h-4 w-4" : "h-4 w-4"} />
        {triggerLabel}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("title")}</DialogTitle>
            <DialogDescription>
              {description ?? t("defaultDescription")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              {t("cancel")}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              type="button"
              onClick={handleConfirm}
              disabled={pending}
            >
              {pending ? t("deleting") : t("confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
