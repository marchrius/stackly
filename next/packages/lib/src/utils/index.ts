import type { PaginatedResult } from "../types/index";
import { DEFAULT_PAGE_SIZE } from "../constants/index";

// ─── Visibilità ───────────────────────────────────────────────────────────────

export function computeFinalVisibility(
  ownVisibility: string,
  parentVisibility: string,
): string {
  const order = ["public", "internal", "private"];
  const ownIdx = order.indexOf(ownVisibility);
  const parentIdx = order.indexOf(parentVisibility);
  return order[Math.max(ownIdx, parentIdx)] ?? "private";
}

// ─── Paginazione ─────────────────────────────────────────────────────────────

export function buildPaginatedResult<T>(
  data: T[],
  total: number,
  page: number,
  perPage: number = DEFAULT_PAGE_SIZE,
): PaginatedResult<T> {
  return {
    data,
    total,
    page,
    perPage,
    totalPages: Math.ceil(total / perPage),
  };
}

export function getPaginationOffset(
  page: number,
  perPage: number = DEFAULT_PAGE_SIZE,
): number {
  return (Math.max(1, page) - 1) * perPage;
}

// ─── Formattazione ────────────────────────────────────────────────────────────

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ─── Password Symfony (bcrypt $2y$ → $2b$) ────────────────────────────────────

export function normalizeSymfonyPassword(hash: string): string {
  // Symfony usa il prefisso $2y$ mentre bcryptjs usa $2b$
  // Sono equivalenti algoritmicamente
  if (hash.startsWith("$2y$")) {
    return "$2b$" + hash.slice(4);
  }
  return hash;
}

// ─── URL uploads ─────────────────────────────────────────────────────────────

export function getUploadUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  const normalized = path.trim().replace(/\\/g, "/");
  if (!normalized) return null;
  if (/^(https?:|blob:|data:)/i.test(normalized)) return normalized;
  const withoutLeadingSlash = normalized.replace(/^\/+/, "");
  const withoutPublic = withoutLeadingSlash.replace(/^public\/+/i, "");
  const withoutUploads = withoutPublic.replace(/^uploads\/+/i, "");
  return `/uploads/${withoutUploads}`;
}
