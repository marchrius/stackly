# ARCHITECTURE.md — Stackly Next.js Architecture

> Technical architecture document for the `next/` monorepo.  
> Updated: **April 2026** — target version **2.0.0-alpha**

---

## Table of Contents

1. [Overview](#1-overview)
2. [Monorepo Structure](#2-monorepo-structure)
3. [Package `apps/web`](#3-package-appsweb)
4. [Package `packages/db`](#4-package-packagesdb)
5. [Package `packages/ui`](#5-package-packagesui)
6. [Package `packages/lib`](#6-package-packageslib)
7. [Toolchain and Build](#7-toolchain-and-build)
8. [Database and Data Model](#8-database-and-data-model)
9. [Typical Request Flows](#9-typical-request-flows)
10. [Deployment and Runtime](#10-deployment-and-runtime)
11. [Naming Conventions](#11-naming-conventions)
12. [Environment Variables](#12-environment-variables)
13. [Mandatory i18n Rule](#13-mandatory-i18n-rule)

---

## 1. Overview

Stackly's Next.js version is a self-hosted collection manager for physical collections of any kind. The application keeps the legacy directory/file-like model: users create collections and sub-collections, then add items with custom metadata, tags, media, files, and relationships.

The codebase is a **Turborepo + npm workspaces** monorepo.

```text
Turborepo
├── apps/web          ← Next.js 15 App Router app: frontend + API
├── packages/db       ← Prisma ORM + shared client
├── packages/ui       ← Shared shadcn/ui components
└── packages/lib      ← Shared types, constants, and utilities
```

**Main stack**

| Layer | Technology |
|---|---|
| Framework | Next.js 15 App Router, React 19 |
| Runtime | Node.js >= 20 |
| Language | TypeScript 5, strict mode |
| ORM | Prisma 6 |
| Database | PostgreSQL |
| Auth | NextAuth.js v5 / Auth.js, Credentials provider, JWT sessions |
| UI | shadcn/ui + Tailwind CSS 3 |
| Dev bundler | Turbopack (`next dev --turbopack`) |
| Monorepo runner | Turborepo 2 |
| Package manager | npm workspaces, npm >= 10 |

The Next.js v2 app is currently **PostgreSQL-only**. Legacy MySQL/MariaDB support is intentionally out of scope for this conversion cycle.

---

## 2. Monorepo Structure

```text
next/
├── package.json              ← root workspace scripts
├── turbo.json                ← Turbo pipeline
├── tsconfig.base.json        ← shared TypeScript config
├── prisma.config.ts          ← Prisma CLI config
├── .env                      ← local environment file, not committed
├── .env.example              ← environment template
├── Dockerfile                ← production standalone image
├── Dockerfile.scratch        ← minimal scratch-based runtime variant
├── docker-compose.yml        ← app + PostgreSQL runtime
├── entrypoint.sh             ← runtime DB bootstrap + migration + server start
├── scripts/                  ← migration and maintenance scripts
├── apps/
│   └── web/
│       ├── app/              ← Next.js App Router
│       ├── components/       ← React components by domain
│       ├── i18n/             ← locale source of truth and request config
│       ├── lib/              ← server helpers, actions, domain utilities
│       ├── messages/         ← next-intl catalogs
│       ├── public/           ← static assets, icons, uploads in dev
│       ├── test/             ← Vitest tests
│       ├── types/            ← NextAuth type augmentation
│       ├── auth.ts           ← NextAuth.js v5 configuration
│       ├── middleware.ts     ← auth and locale middleware
│       ├── next.config.ts    ← Next.js config, standalone output
│       └── package.json
└── packages/
    ├── db/
    │   ├── prisma/
    │   │   ├── schema.prisma ← Prisma schema, stk_* tables
    │   │   └── migrations/   ← PostgreSQL migrations
    │   └── src/index.ts      ← PrismaClient singleton + type re-exports
    ├── ui/
    │   └── src/
    │       ├── components/   ← shadcn/ui components
    │       ├── lib/utils.ts  ← cn() helper
    │       └── index.ts      ← barrel export
    └── lib/
        └── src/
            ├── constants/    ← datum, visibility, currency constants
            ├── types/        ← shared TypeScript domain types
            ├── utils/        ← shared utility functions
            └── index.ts      ← barrel export
```

---

## 3. Package `apps/web`

### 3.1 App Router Layout

The app uses the Next.js App Router with route groups for public auth pages and authenticated application pages.

```text
app/
├── layout.tsx                ← root layout, theme class, i18n provider, metadata
├── manifest.ts               ← PWA manifest route
├── not-found.tsx             ← localized not-found UI
├── global-error.tsx          ← localized global error UI
├── globals.css
├── (auth)/
│   ├── layout.tsx
│   ├── login/page.tsx
│   └── register/page.tsx
├── (dashboard)/
│   ├── layout.tsx            ← authenticated shell
│   ├── page.tsx              ← dashboard
│   ├── collections/…
│   ├── items/…
│   ├── albums/…
│   ├── photos/…
│   ├── wishlists/…
│   ├── wishes/…
│   ├── tags/…
│   ├── templates/…
│   ├── choice-lists/…
│   ├── inventories/…
│   ├── loans/…
│   ├── scrapers/…
│   ├── history/…
│   ├── statistics/…
│   ├── search/…
│   └── settings/…
├── public/
│   ├── collections/[id]/page.tsx
│   ├── items/[id]/page.tsx
│   ├── albums/[id]/page.tsx
│   └── wishlists/[id]/page.tsx
├── user/[username]/wishlists/… ← compatibility public wishlist routes
└── api/                       ← REST route handlers
```

The `(auth)` group is public. The `(dashboard)` group requires a valid session. Public sharing routes under `/public/*` are intentionally accessible without authentication, but every query filters on `finalVisibility = "public"`.

### 3.2 Dashboard Pages

Dashboard pages are mostly Server Components. They usually:

1. call `requireAuth()` to obtain the session,
2. query Prisma directly,
3. pass data to Client Components for interactive forms and local state.

| Path | Description |
|---|---|
| `/` | Dashboard with quick statistics |
| `/collections` | User collection index |
| `/collections/new` | Create collection |
| `/collections/[id]` | Collection detail: children, items, custom data, breadcrumb |
| `/collections/[id]/edit` | Edit collection |
| `/collections/[id]/items` | Full item list for a collection |
| `/items/new` | Create item, optionally with `?collectionId` |
| `/items/[id]` | Item detail: media, custom data, tags, loans, related items |
| `/items/[id]/edit` | Edit item |
| `/albums` | Album index |
| `/albums/new` | Create album |
| `/albums/[id]` | Album detail: children, photos, breadcrumb |
| `/albums/[id]/photos/new` | Create photo in album |
| `/photos/[id]` | Photo detail |
| `/wishlists` | Wishlist index |
| `/wishlists/[id]` | Wishlist detail: children and wishes |
| `/wishes/[id]` | Wish detail |
| `/tags` | Tags and tag categories |
| `/templates` | Item templates and fields |
| `/choice-lists` | Reusable choice lists |
| `/inventories` | Inventories |
| `/loans` | Active and returned loans |
| `/scrapers` | Manual scraper configuration |
| `/history` | Action log |
| `/statistics` | Charts and statistics |
| `/search` | Full-text search |
| `/settings` | User preferences and password |
| `/settings/admin` | Admin dashboard and instance configuration |

### 3.3 Public Sharing

Public sharing is implemented as explicit read-only routes:

```text
/public/collections/[id]
/public/items/[id]
/public/albums/[id]
/public/wishlists/[id]
```

The implementation lives in:

```text
components/public/
├── CopyPublicLinkButton.tsx
├── PublicCards.tsx
├── PublicDatumList.tsx
└── PublicShell.tsx

lib/public/
└── public-queries.ts
```

Public queries are centralized in `lib/public/public-queries.ts` and must enforce `finalVisibility = "public"` on the root resource and on nested children, items, data, photos, and wishes.

Authenticated detail pages for collections, items, albums, and wishlists expose a copy/open public link control only when the resource is public.

### 3.4 Route Handler API

Route handlers use `NextResponse.json(...)`, central auth helpers, Zod validation where needed, and owner-scoped Prisma queries.

```text
app/api/
├── auth/[...nextauth]/route.ts
├── upload/route.ts
├── collections/
│   ├── route.ts
│   ├── [id]/route.ts
│   └── [id]/item-form/route.ts
├── items/
│   ├── route.ts
│   └── [id]/route.ts
├── albums/
│   ├── route.ts
│   └── [id]/route.ts
├── photos/
│   ├── route.ts
│   └── [id]/route.ts
├── wishlists/
│   ├── route.ts
│   ├── [id]/route.ts
│   ├── [id]/children/route.ts
│   ├── [id]/parent/route.ts
│   └── [id]/wishes/route.ts
├── wishes/
│   ├── route.ts
│   ├── [id]/route.ts
│   └── [id]/wishlist/route.ts
├── tags/
├── tag-categories/
├── templates/
├── choice-lists/
├── inventories/
├── loans/
├── scrapers/
│   ├── route.ts
│   ├── [id]/route.ts
│   ├── collection-preview/route.ts
│   └── item-preview/route.ts
├── logs/route.ts
└── search/route.ts
```

Common pagination parameters: `?page=1&perPage=30`  
Common paginated response shape: `{ data, total, page, perPage, totalPages }`

### 3.5 Server Actions

Server Actions are used for form-driven mutations. They handle validation, Prisma writes, visibility propagation, logging, cache invalidation, and redirects.

```text
lib/actions/
├── collection.actions.ts
├── item.actions.ts
├── media.actions.ts
├── photo.actions.ts
├── wish.actions.ts
├── user.actions.ts
└── admin.actions.ts
```

Actions use `"use server"`, Zod schemas, `requireAuth()`, `revalidatePath`, and `redirect` where appropriate.

### 3.6 React Components

Components are organized by domain. Server Components own data access; Client Components own local interactivity.

```text
components/
├── layout/        ← Navbar, Sidebar
├── auth/          ← login/register forms
├── collections/   ← collection grids, lists, forms, details
├── items/         ← item form/detail
├── albums/        ← album grids, forms, details
├── photos/        ← photo form/detail
├── wishlists/     ← wishlist form/detail/grid
├── wishes/        ← wish form/detail
├── tags/          ← tag and category forms/lists
├── templates/     ← templates and fields
├── choice-lists/  ← reusable choice list UI
├── inventories/   ← inventory UI
├── loans/         ← loan UI
├── scrapers/      ← scraper configuration form
├── public/        ← public read-only UI
├── settings/      ← user/admin settings
├── shared/        ← reusable app components
└── statistics/    ← charts
```

Image cards use the established app pattern: `aspect-[10/13]`, `object-contain`, and `repeat(auto-fill, minmax(160px, 1fr))`.

### 3.7 Domain Utilities

Important utilities in `apps/web/lib/` include:

```text
auth-utils.ts              ← requireAuth()
api-helpers.ts             ← API auth/errors/pagination/logging helpers
collections-tree.ts        ← collection parent/cycle/ancestor/visibility logic
albums-tree.ts             ← album parent/cycle/ancestor/visibility logic
wishlists-tree.ts          ← wishlist ancestor helpers
wishlist-visibility.ts     ← shared wishlist visibility filters
collection-detail.ts       ← cached collection detail summaries
collection-display-config.ts
item-detail.ts             ← display data and media entry helpers
item-persistence.ts        ← item datum persistence logic
datum-format.ts            ← datum formatting helpers
choice-lists.ts            ← choice parsing and limiting
configuration.ts           ← admin configuration and custom theme CSS
theme/                     ← theme normalization and CSS variables
server/
  ├── scraper-preview.ts   ← collection scraper preview
  └── item-scraper.ts      ← item scraper preview
public/
  └── public-queries.ts    ← public resource queries
```

### 3.8 Authentication

**File:** `apps/web/auth.ts`

NextAuth.js v5 is configured with:

| Setting | Value |
|---|---|
| Main provider | Credentials: username/email + password |
| Optional provider | OIDC, controlled by environment variables |
| Session strategy | JWT, 30-day max age |
| Password hash compatibility | bcrypt `$2y$` normalized to `$2b$` for Symfony compatibility |
| Login page | `/login` |

Custom session fields include:

```typescript
{
  id: string;
  name: string;
  email: string;
  image: string | null;
  roles: string[];
  currency: string;
  locale: string;
  theme: string;
  dateFormat: string;
}
```

Type augmentation lives in `apps/web/types/next-auth.d.ts`.

### 3.9 Middleware

**File:** `apps/web/middleware.ts`

The middleware protects authenticated routes and keeps locale cookies initialized.

Excluded paths include:

```text
/login, /register
/api/auth/*
/public/*
/user/*/wishlists*
/_next/static, /_next/image
/uploads/*
/favicon.ico, /robots.txt
```

The middleware sets the `stk_locale` cookie when missing. `koillection_locale` is still read as a compatibility fallback in the i18n request config.

### 3.10 Uploads

**Route:** `POST /api/upload`

Upload flow:

1. receives `multipart/form-data` with `file` and `entity`,
2. validates MIME type and size,
3. writes the original file under `UPLOAD_DIR/{userId}/{entity}/`,
4. generates thumbnails with `sharp`,
5. returns `{ path, smallThumbnail, largeThumbnail }`.

`UPLOAD_DIR` defaults to `./public/uploads`. In Docker, `/var/lib/stackly/uploads` is mounted and linked to `/app/apps/web/public/uploads`.

All rendering should use `getUploadUrl()` from `@stackly/lib`, which normalizes new and legacy paths such as:

```text
<user>/<file>
uploads/<user>/<file>
/uploads/<user>/<file>
public/uploads/<user>/<file>
```

### 3.11 Internationalization

The app uses `next-intl` with cookie-based locale selection.

| Concern | Location |
|---|---|
| Supported locales | `apps/web/i18n/locales.ts` |
| Request config | `apps/web/i18n/request.ts` |
| Messages | `apps/web/messages/*.json` |
| Locale cookie | `stk_locale` |
| Legacy fallback cookie | `koillection_locale` |

Supported locales:

```text
da, de, en, es, fr, it, nl, pl, pt, pt_BR, ru, tr, uk, zh
```

Use `useTranslations("namespace")` in Client Components and `getTranslations("namespace")` in Server Components and `generateMetadata()`.

### 3.12 PWA

The app exposes an installable PWA manifest through `app/manifest.ts`, available as `/manifest.webmanifest`.

Icons live in:

```text
apps/web/public/icons/
├── apple-touch-icon.svg
├── icon-192.svg
├── icon-512.svg
└── maskable-icon.svg
```

The app intentionally does not register an aggressive service worker by default. Authenticated pages and private data are not cached offline automatically.

### 3.13 Manual Scrapers

Scrapers are user-defined extraction rules. They are manual by design:

- no automatic metadata download runs in the background,
- collection/item forms expose preview/import controls,
- remote fetches run only after explicit user action,
- preview endpoints require an authenticated user and owner-scoped scraper,
- remote source URLs are limited to `http` and `https`,
- custom request headers are stored as JSON and sent during preview.

Relevant files:

```text
components/scrapers/ScraperForm.tsx
components/collections/CollectionForm.tsx
components/items/ItemForm.tsx
app/api/scrapers/collection-preview/route.ts
app/api/scrapers/item-preview/route.ts
lib/server/scraper-preview.ts
lib/server/item-scraper.ts
```

---

## 4. Package `packages/db`

**npm name:** `@stackly/db`

Exports:

- `prisma`: a PrismaClient singleton using the `globalThis` pattern for Next.js hot reload,
- all generated Prisma types re-exported from `@prisma/client`.

The schema lives in `packages/db/prisma/schema.prisma` and maps to PostgreSQL `stk_*` tables.

Main models:

| Prisma Model | Table | Description |
|---|---|---|
| `User` | `stk_user` | User, roles, preferences, disk quota |
| `OAuthProvider` | `stk_oauth_provider` | OIDC account links |
| `Configuration` | `stk_configuration` | Instance configuration |
| `Collection` | `stk_collection` | Hierarchical collection |
| `Item` | `stk_item` | Item inside a collection |
| `Datum` | `stk_datum` | Custom data attached to item or collection |
| `Album` | `stk_album` | Hierarchical photo album |
| `Photo` | `stk_photo` | Photo inside an album |
| `Wishlist` | `stk_wishlist` | Hierarchical wishlist |
| `Wish` | `stk_wish` | Single wish |
| `Tag` | `stk_tag` | Item tag |
| `TagCategory` | `stk_tag_category` | Tag category |
| `Template` | `stk_template` | Item data template |
| `Field` | `stk_field` | Template field |
| `ChoiceList` | `stk_choice_list` | Reusable value list |
| `Inventory` | `stk_inventory` | Inventory |
| `Loan` | `stk_loan` | Item loan |
| `Log` | `stk_log` | Action log |
| `Scraper` | `stk_scraper` | Scraper configuration |
| `Path` | `stk_path` | Scraper extraction path |
| `DisplayConfiguration` | `stk_display_configuration` | Display preferences |
| `Search` | `stk_search` | Search history |

Database scripts:

```bash
npm run db:generate
npm run db:push
npm run db:migrate
npm run db:studio
```

---

## 5. Package `packages/ui`

**npm name:** `@stackly/ui`

Shared UI library based on shadcn/ui and Tailwind CSS.

Exported components include:

| Component | Description |
|---|---|
| `Button` | Button variants and sizes |
| `Card`, `CardContent`, `CardDescription`, `CardHeader`, `CardTitle` | Card primitives |
| `Input` | Text input |
| `Label` | Form label |
| `Badge` | Badge variants |
| `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogTrigger` | Modal dialog |
| `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue` | Select dropdown |
| `Textarea` | Multiline text input |
| `cn()` | `clsx` + `tailwind-merge` utility |

Most UI primitives are Client Components and can be safely imported by Client Components.

---

## 6. Package `packages/lib`

**npm name:** `@stackly/lib`

Shared TypeScript code used by apps and packages. It should remain lightweight and avoid heavy runtime dependencies.

### Types

```typescript
type Visibility = "public" | "internal" | "private";
type DisplayMode = "grid" | "list";
type LogType = "create" | "update" | "delete";
type DatumType =
  | "text" | "textarea" | "number" | "price" | "date" | "rating"
  | "country" | "link" | "list" | "choice-list" | "checkbox"
  | "image" | "file" | "video" | "sign" | "blank-line" | "section";

interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}
```

### Constants

- `DATUM_TYPES`
- `DATUM_TYPES_WITH_VALUE`
- `VISIBILITY_OPTIONS`
- `CURRENCIES`
- `DEFAULT_PAGE_SIZE`
- `ROLES`

### Utilities

- `computeFinalVisibility(own, parent)`
- `buildPaginatedResult(data, total, page, perPage)`
- `normalizeSymfonyPassword(hash)`
- `getUploadUrl(path)`

---

## 7. Toolchain and Build

### Turborepo

`turbo.json` defines the pipeline:

```text
build       → depends on ^build
dev         → persistent, uncached
lint        → depends on ^build
type-check  → depends on ^build
test        → depends on ^build
db:*        → uncached
```

### Root Scripts

```bash
npm run dev
npm run build
npm run type-check
npm run test
npm run lint
npm run i18n:validate
npm run db:generate
npm run db:push
npm run db:migrate
npm run db:studio
npm run maintenance:refresh-cached-values
npm run maintenance:regenerate-logs
npm run maintenance:regenerate-thumbnails
npm run legacy:migrate
npm run legacy:validate
npm run legacy:uploads:audit
npm run legacy:uploads:copy
```

All workspace scripts load `next/.env` through `dotenv-cli`. Build scripts force `NODE_ENV=production` after loading `.env` so a local `NODE_ENV=development` value cannot break `next build`.

### TypeScript

- `tsconfig.base.json` provides shared strict configuration.
- Every package extends the root config.
- `next.config.ts` currently allows production builds while TypeScript is verified separately with `npm run type-check`.

### Current Conversion Status

| # | Feature | Status | Notes |
|---|---|---|---|
| 1 | Auth | ✅ Complete | NextAuth.js v5, Credentials, optional OIDC, JWT, Symfony bcrypt compatibility |
| 2 | Collections | ✅ Complete | CRUD, hierarchy, items, upload, display config |
| 3 | Items | ✅ Complete | CRUD, metadata, media, tags, loans, related items |
| 4 | Albums | ✅ Complete | CRUD, hierarchy, photos, upload, visibility propagation |
| 5 | Wishlists | ✅ Complete | CRUD, hierarchy, wishes, public views |
| 6 | Tags | ✅ Complete | Tags and categories |
| 7 | Templates / Fields / Choice Lists | ✅ Complete | Custom item data structure |
| 8 | Loans | ✅ Complete | Active/returned item loans |
| 9 | Inventories | ✅ Complete | Inventory pages and API |
| 10 | Scrapers | ✅ Complete | Manual configurable preview/import flow |
| 11 | Public sharing | ✅ Complete | Public views for collections, items, albums, wishlists |
| 12 | i18n | ✅ Complete | 14 locales, cookie-based `next-intl` |
| 13 | PWA | ✅ Complete | Manifest and icons, no aggressive private-data caching |
| 14 | Admin / Statistics / Tools | ✅ Implemented | Admin settings, statistics, history, maintenance scripts |

---

## 8. Database and Data Model

**DBMS:** PostgreSQL  
**ORM:** Prisma 6

### Hierarchy and Visibility

`Collection`, `Album`, and `Wishlist` implement parent/child hierarchies with visibility propagation.

| Field | Description |
|---|---|
| `visibility` | User-selected visibility |
| `parentVisibility` | Final visibility snapshot of the parent |
| `finalVisibility` | Effective visibility used by filters and public access |

Visibility order:

```text
public < internal < private

finalVisibility = max(ownVisibility, parentVisibility)
```

When a node changes visibility, descendants are updated recursively. Album visibility also propagates to photos; wishlist visibility propagates to nested wishlists and wishes; collection visibility propagates to nested collections, items, and public datum filtering.

### Main Indexes

```sql
idx_collection_final_visibility  ON stk_collection(final_visibility)
idx_album_final_visibility       ON stk_album(final_visibility)
idx_item_final_visibility        ON stk_item(final_visibility)
idx_photo_final_visibility       ON stk_photo(final_visibility)
idx_wishlist_final_visibility    ON stk_wishlist(final_visibility)
idx_wish_final_visibility        ON stk_wish(final_visibility)
idx_datum_final_visibility       ON stk_datum(final_visibility)
```

### Legacy Migration

Legacy PostgreSQL `koi_*` databases are migrated to the Prisma `stk_*` target schema through scripts in `next/scripts/`.

Important scripts:

```bash
npm run legacy:migrate
npm run legacy:validate
npm run legacy:uploads:audit
npm run legacy:uploads:copy
```

Upload migration is intentionally separated from database migration and uses user-defined source/destination paths.

---

## 9. Typical Request Flows

### A. Authenticated Page Navigation

```text
Browser → middleware.ts
        ├── valid JWT/session? → continue
        └── no session → redirect /login

Next.js → Server Component, for example /albums/[id]/page.tsx
        ├── requireAuth()
        ├── prisma.album.findFirst(...)
        ├── getAlbumAncestors(...)
        └── <AlbumDetail album={...} /> → RSC stream
```

### B. Public Page Navigation

```text
Browser → /public/items/[id]
        ├── middleware allows public route
        ├── getPublicItem(id)
        ├── query requires finalVisibility = "public"
        ├── nested data also filtered by public visibility
        └── render read-only PublicShell
```

### C. Form Submit with Server Action

```text
Browser (Client Component)
  → optional POST /api/upload
  → Server Action, for example updateAlbum
      ├── requireAuth()
      ├── schema.safeParse(formData)
      ├── resolveAlbumParent()
      ├── prisma.album.update(...)
      ├── syncAlbumDescendantsVisibility(...)
      ├── logAction(...) → stk_log
      ├── revalidatePath(...)
      └── redirect(...)
```

### D. REST API Call

```text
Client → GET /api/items/[id]
       ├── requireApiSession()
       ├── 401 if unauthenticated
       ├── owner-scoped prisma.item.findFirst(...)
       └── NextResponse.json(...)
```

### E. Manual Scraper Preview

```text
Browser (CollectionForm or ItemForm)
  → user selects scraper and source URL/HTML file
  → POST /api/scrapers/*-preview
      ├── requireApiSession()
      ├── load owner-scoped scraper
      ├── validate remote URL as http/https
      ├── fetch remote HTML or read uploaded HTML
      ├── extract values with configured paths
      └── return preview payload
  → form applies previewed values only after explicit user action
```

---

## 10. Deployment and Runtime

### Docker Images

`next/Dockerfile` builds the production standalone app:

1. installs workspace dependencies,
2. generates Prisma client,
3. builds `apps/web`,
4. copies standalone output and Prisma CLI runtime dependencies,
5. runs `entrypoint.sh`.

`next/Dockerfile.scratch` creates a minimal runtime image from `scratch`. It reuses the same `entrypoint.sh` and includes only the runtime filesystem, Node binary/libraries, selected BusyBox applets, `psql`, app artifacts, and required Prisma runtime files.

### Runtime Entrypoint

`entrypoint.sh`:

1. waits for PostgreSQL,
2. creates the configured database if needed,
3. runs `prisma migrate deploy`,
4. prepares the upload symlink,
5. starts `node /app/apps/web/server.js`.

### Compose

`next/docker-compose.yml` starts:

- `postgres`, database `stackly_transfer`,
- `web`, image `ghcr.io/marchrius/koillection:next`,
- persistent volumes for PostgreSQL data and uploads.

---

## 11. Naming Conventions

| Type | Convention | Example |
|---|---|---|
| React components | `PascalCase.tsx` | `AlbumDetail.tsx` |
| Server Actions | `[resource].actions.ts` | `photo.actions.ts` |
| Route Handlers | `app/api/[resource]/route.ts` | `app/api/albums/route.ts` |
| Utilities | `kebab-case.ts` or local existing style | `albums-tree.ts` |
| Constants | `UPPER_SNAKE_CASE` | `VISIBILITY_OPTIONS` |
| Shared types | `PascalCase` | `Visibility`, `DatumType` |
| Prisma models | `PascalCase` mapped to table | `Album` → `stk_album` |
| Next path params | `[id]`, always named `id` unless domain requires otherwise | `/albums/[id]` |

---

## 12. Environment Variables

Defined in `next/.env`, with a template in `next/.env.example`.

| Variable | Required | Description | Default |
|---|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string | none |
| `NEXTAUTH_SECRET` | ✅ | NextAuth JWT secret, at least 32 chars | none |
| `NEXTAUTH_URL` | ✅ in production | Public app URL. Required to be non-local when OIDC is enabled in production. | none |
| `UPLOAD_DIR` | ❌ | Absolute or relative upload directory | `./public/uploads` |
| `NODE_ENV` | ❌ | Runtime mode | development locally; build scripts force production |
| `OIDC_ENABLED` | ❌ | Enables OIDC login | `false` |
| `OIDC_PROVIDER` | ❌ | OIDC provider label | `generic` |
| `OIDC_ISSUER_URL` | ❌ | OIDC issuer URL | empty |
| `OIDC_CLIENT_ID` | ❌ | OIDC client id | empty |
| `OIDC_CLIENT_SECRET` | ❌ | OIDC client secret | empty |
| `OIDC_SCOPES` | ❌ | OIDC scopes | `openid profile email` |

Use only `next/.env`; workspace scripts explicitly load it from app/package directories.

---

## 13. Mandatory i18n Rule

> Every user-visible string added or changed in `next/` must go through the `next-intl` message catalogs. Do not hardcode UI text in JSX/TSX.

### Checklist for Any Feature with UI Text

1. No hardcoded user-visible strings in JSX/TSX.
2. Add every new key to all files in `apps/web/messages/`.
3. Use a namespace that matches the feature domain.
4. Use interpolation for runtime values: `{name}`, `{count}`, etc.
5. Use `useTranslations()` in Client Components.
6. Use `getTranslations()` in Server Components and `generateMetadata()`.
7. Run `npm run i18n:validate`.

### Example

```typescript
// Correct: text through i18n
const t = useTranslations("tags");
<h1>{t("title")}</h1>
<p>{t("empty")}</p>

// Wrong: hardcoded UI strings
<h1>Tags</h1>
<p>No tags yet.</p>
```

### Supported Locales

| Code | Language | Message file |
|---|---|---|
| `da` | Danish | `messages/da.json` |
| `de` | German | `messages/de.json` |
| `en` | English | `messages/en.json` |
| `es` | Spanish | `messages/es.json` |
| `fr` | French | `messages/fr.json` |
| `it` | Italian | `messages/it.json` |
| `nl` | Dutch | `messages/nl.json` |
| `pl` | Polish | `messages/pl.json` |
| `pt` | Portuguese | `messages/pt.json` |
| `pt_BR` | Portuguese (Brazil) | `messages/pt_BR.json` |
| `ru` | Russian | `messages/ru.json` |
| `tr` | Turkish | `messages/tr.json` |
| `uk` | Ukrainian | `messages/uk.json` |
| `zh` | Chinese | `messages/zh.json` |

Any new locale must include a complete translation of all keys present in `messages/en.json` before it is considered production-ready.
