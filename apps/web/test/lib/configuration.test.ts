import { describe, expect, it } from "vitest";
import { buildCustomThemeCss, CONFIGURATION_LABELS, readAdminConfiguration } from "@/lib/configuration";

describe("configuration helpers", () => {
  it("parses persisted admin configuration with sane defaults", () => {
    const configuration = readAdminConfiguration([
      { label: CONFIGURATION_LABELS.enableMetrics, value: "1" },
      { label: CONFIGURATION_LABELS.customDarkThemeCss, value: "body { color: white; }" },
    ]);

    expect(configuration).toEqual({
      thumbnailsFormat: "keep-original",
      customLightThemeCss: "",
      customDarkThemeCss: "body { color: white; }",
      enableMetrics: true,
    });
  });

  it("wraps auto theme custom css with media queries", () => {
    const css = buildCustomThemeCss("auto", {
      customLightThemeCss: "body { color: black; }",
      customDarkThemeCss: "body { color: white; }",
    });

    expect(css).toContain("@media (prefers-color-scheme: light)");
    expect(css).toContain("@media (prefers-color-scheme: dark)");
  });

  it("returns only the matching concrete theme custom css", () => {
    expect(buildCustomThemeCss("d_neo", {
      customLightThemeCss: "body { color: black; }",
      customDarkThemeCss: "body { color: white; }",
    })).toBe("body { color: white; }");

    expect(buildCustomThemeCss("l_aqua", {
      customLightThemeCss: "body { color: black; }",
      customDarkThemeCss: "body { color: white; }",
    })).toBe("body { color: black; }");
  });
});
