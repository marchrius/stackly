// Tipi condivisi per Stackly

export type Visibility = "public" | "internal" | "private";
export type DisplayMode = "grid" | "list";
export type SortingDirection = "ASC" | "DESC";
export type LogType = "create" | "update" | "delete";

export type DatumType =
  | "text"
  | "textarea"
  | "country"
  | "date"
  | "rating"
  | "number"
  | "price"
  | "link"
  | "list"
  | "choice-list"
  | "checkbox"
  | "image"
  | "file"
  | "sign"
  | "video"
  | "blank-line"
  | "section";

export type ScraperType = "html" | "json" | "isbn" | "barcode";

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface BreadcrumbItem {
  id: string;
  label: string;
  href: string;
}

export interface UserSession {
  id: string;
  username: string;
  email: string;
  roles: string[];
  currency: string;
  locale: string;
  theme: string;
  dateFormat: string;
}

export interface UploadResult {
  path: string;
  smallThumbnail?: string;
  largeThumbnail?: string;
  originalFilename?: string;
  size: number;
}
