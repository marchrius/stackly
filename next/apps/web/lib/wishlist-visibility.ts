export function getAllowedFinalVisibilities(
  viewerId: string | null | undefined,
  ownerId: string,
): Array<"public" | "internal"> | null {
  if (viewerId && viewerId === ownerId) {
    return null;
  }

  if (viewerId) {
    return ["public", "internal"];
  }

  return ["public"];
}

export function buildFinalVisibilityWhere(
  allowed: Array<"public" | "internal"> | null,
): { finalVisibility?: { in: Array<"public" | "internal"> } } {
  if (!allowed) {
    return {};
  }

  return {
    finalVisibility: { in: allowed },
  };
}

