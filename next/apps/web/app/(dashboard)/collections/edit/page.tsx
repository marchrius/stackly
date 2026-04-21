import type { Metadata } from "next";
import { prisma } from "@stackly/db";
import { getTranslations } from "next-intl/server";
import { requireAuth } from "@/lib/auth-utils";
import { getCollectionDisplayConfigOptions } from "@/lib/collection-display-config";
import { CollectionIndexDisplaySettingsForm } from "@/components/collections/CollectionIndexDisplaySettingsForm";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("collections");
  return { title: t("editIndex") };
}

export default async function EditCollectionsIndexPage() {
  const session = await requireAuth();
  const t = await getTranslations("collections");

  const [user, options] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      include: { collectionsDisplayConfiguration: true },
    }),
    getCollectionDisplayConfigOptions(prisma, session.user.id, null),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("editIndex")}</h1>
        <p className="text-muted-foreground">{t("indexDisplayDescription")}</p>
      </div>

      <CollectionIndexDisplaySettingsForm
        displayConfiguration={user?.collectionsDisplayConfiguration ?? null}
        sortingOptions={options.childrenSortingOptions}
        columnOptions={options.childrenColumnOptions}
      />
    </div>
  );
}
