"use client";

import type { Loan } from "@stackly/db";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge, Button } from "@stackly/ui";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { useTranslations } from "next-intl";

type LoanWithItem = Loan & { item: { id: string; name: string } | null };

export function LoansList({ active, returned }: { active: LoanWithItem[]; returned: LoanWithItem[] }) {
  const router = useRouter();
  const t = useTranslations("loans");
  const tCommon = useTranslations("common");
  const [error, setError] = useState("");

  async function patchLoan(id: string, payload: Record<string, unknown>) {
    const response = await fetch(`/api/loans/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new Error(data?.error ?? t("updateFailed"));
    }
    router.refresh();
  }

  async function deleteLoan(id: string) {
    const response = await fetch(`/api/loans/${id}`, { method: "DELETE" });
    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new Error(data?.error ?? t("deleteFailed"));
    }
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {error && <p className="text-sm text-destructive">{error}</p>}

      <section>
        <h2 className="text-lg font-semibold mb-3">{t("active", { count: active.length })}</h2>
        <div className="space-y-2">
          {active.map((loan) => (
            <div key={loan.id} className="flex flex-col gap-3 rounded-lg border p-3 text-sm lg:flex-row lg:items-center">
              <div className="min-w-0 flex-1">
                <Link href={`/loans/${loan.id}`} className="font-medium hover:text-primary">
                  {loan.item?.name ?? tCommon("none")}
                </Link>
                <p className="text-muted-foreground">
                  {t("lentToLabel", { name: loan.lentTo })} · {new Date(loan.lentAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 lg:justify-end">
                <Badge variant="outline">{t("open")}</Badge>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/loans/${loan.id}/edit`}>{tCommon("edit")}</Link>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    void patchLoan(loan.id, {
                      itemId: loan.item?.id,
                      lentTo: loan.lentTo,
                      lentAt: loan.lentAt,
                      returnedAt: new Date().toISOString(),
                    }).catch((err) => setError(err instanceof Error ? err.message : t("updateFailed")));
                  }}
                >
                  {t("returnNow")}
                </Button>
                <DeleteConfirmDialog
                  description={t("delete.confirm", { name: loan.item?.name ?? loan.lentTo })}
                  onConfirm={async () => {
                    try {
                      await deleteLoan(loan.id);
                    } catch (err) {
                        setError(err instanceof Error ? err.message : t("deleteFailed"));
                    }
                  }}
                />
              </div>
            </div>
          ))}
          {active.length === 0 && <p className="text-muted-foreground">{t("noActive")}</p>}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">{t("returned", { count: returned.length })}</h2>
        <div className="space-y-2">
          {returned.slice(0, 50).map((loan) => (
            <div key={loan.id} className="flex flex-col gap-2 rounded-lg border p-3 text-sm opacity-75 lg:flex-row lg:items-center">
              <div className="min-w-0 flex-1">
                <Link href={`/loans/${loan.id}`} className="font-medium hover:text-primary">
                  {loan.item?.name ?? tCommon("none")}
                </Link>
                <p className="text-muted-foreground">
                  {t("lentToLabel", { name: loan.lentTo })}
                  {loan.returnedAt ? ` · ${new Date(loan.returnedAt).toLocaleDateString()}` : ""}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 lg:justify-end">
                <Badge variant="secondary">{t("closed")}</Badge>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/loans/${loan.id}/edit`}>{tCommon("edit")}</Link>
                </Button>
              </div>
            </div>
          ))}
          {returned.length === 0 && <p className="text-muted-foreground">{t("noReturned")}</p>}
        </div>
      </section>
    </div>
  );
}
