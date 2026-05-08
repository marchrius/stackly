import { describe, expect, it, vi } from "vitest";

import { getDefaultDisplayConfig, RESERVED_SORTING_VALUES, upsertDisplayConfiguration } from "@/lib/collection-display-config";

describe("collection display configuration helpers", () => {
  it("builds defaults for item configs from persisted data", () => {
    const config = getDefaultDisplayConfig("items", {
      label: "Items",
      displayMode: "list",
      sortingProperty: RESERVED_SORTING_VALUES.quantity,
      sortingDirection: "DESC",
      showVisibility: false,
      showActions: true,
      showNumberOfChildren: true,
      showNumberOfItems: true,
      showItemQuantities: true,
      columns: ["Author", "Year"],
    } as never);

    expect(config).toEqual({
      label: "Items",
      displayMode: "list",
      sortingProperty: RESERVED_SORTING_VALUES.quantity,
      sortingDirection: "DESC",
      showVisibility: false,
      showActions: true,
      showNumberOfChildren: false,
      showNumberOfItems: false,
      showItemQuantities: true,
      columns: ["Author", "Year"],
    });
  });

  it("persists sortingType only for dynamic datum-backed options", async () => {
    const tx = {
      displayConfiguration: {
        create: vi.fn().mockResolvedValue({ id: "cfg-1" }),
        update: vi.fn(),
      },
    };

    await upsertDisplayConfiguration(
      tx as never,
      "user-1",
      null,
      {
        label: "Items",
        displayMode: "list",
        sortingProperty: "Author",
        sortingDirection: "ASC",
        showVisibility: true,
        showActions: true,
        showNumberOfChildren: false,
        showNumberOfItems: false,
        showItemQuantities: true,
        columns: ["Author"],
      },
      [{ label: "Author", value: "Author", type: "text" }],
    );

    expect(tx.displayConfiguration.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        sortingProperty: "Author",
        sortingType: "text",
      }),
    });
  });
});
