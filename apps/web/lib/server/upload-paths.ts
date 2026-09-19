import path from "node:path";

const DEFAULT_UPLOAD_DIR = "./public/uploads";

export function getUploadBaseDir(): string {
  const configuredDir = process.env.UPLOAD_DIR?.trim() || DEFAULT_UPLOAD_DIR;
  return path.resolve(
    /* turbopackIgnore: true */ process.cwd(),
    configuredDir,
  );
}

export function resolvePathInsideUploadDir(
  baseDir: string,
  ...segments: string[]
): string {
  const normalizedBaseDir = path.resolve(baseDir);
  const resolvedPath = path.resolve(
    /* turbopackIgnore: true */ normalizedBaseDir,
    ...segments,
  );
  const relativePath = path.relative(normalizedBaseDir, resolvedPath);

  if (
    relativePath === ".." ||
    relativePath.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relativePath)
  ) {
    throw new Error("Upload path escapes the configured upload directory");
  }

  return resolvedPath;
}

export function resolveUploadPath(...segments: string[]): string {
  return resolvePathInsideUploadDir(getUploadBaseDir(), ...segments);
}
