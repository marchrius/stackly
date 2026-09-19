import path from "node:path";
import { describe, expect, it } from "vitest";
import { resolvePathInsideUploadDir } from "@/lib/server/upload-paths";

describe("upload paths", () => {
  const baseDir = path.resolve("/var/lib/stackly/uploads");

  it("resolves nested paths inside the configured directory", () => {
    expect(resolvePathInsideUploadDir(baseDir, "user-id", "items", "image.webp"))
      .toBe(path.join(baseDir, "user-id", "items", "image.webp"));
  });

  it("rejects paths that escape the configured directory", () => {
    expect(() => resolvePathInsideUploadDir(baseDir, "..", "secrets.txt"))
      .toThrow("Upload path escapes the configured upload directory");
    expect(() => resolvePathInsideUploadDir(baseDir, "/etc/passwd"))
      .toThrow("Upload path escapes the configured upload directory");
  });

  it("does not confuse directories that share the same prefix", () => {
    expect(() => resolvePathInsideUploadDir(baseDir, "..", "uploads-copy", "file"))
      .toThrow("Upload path escapes the configured upload directory");
  });
});
