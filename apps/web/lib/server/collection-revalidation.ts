import { prisma } from "@stackly/db";
import { revalidatePath } from "next/cache";
import { getCollectionHierarchyIds } from "@/lib/collection-detail";

export async function revalidateCollectionHierarchy(
  ownerId: string,
  collectionIds: Array<string | null | undefined>,
) {
  const collections = await prisma.collection.findMany({
    where: { ownerId },
    select: { id: true, parentId: true },
  });
  const hierarchyIds = getCollectionHierarchyIds(collections, collectionIds);

  revalidatePath("/collections");
  for (const collectionId of hierarchyIds) {
    revalidatePath(`/collections/${collectionId}`);
  }
}
