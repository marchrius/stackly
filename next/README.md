# Stackly — Next.js (v2.x)

Stackly's full-stack Next.js version: a self-hosted collection manager for cataloging physical collections of any kind, including books, DVDs, comics, games, stamps, photo albums, and wishlists.

The new app keeps the directory/file-like hierarchy model: you can create collections and sub-collections, then add items with custom metadata, tags, images, files, links, and user-defined fields. Scrapers are user-configurable and run only through explicit preview/import actions: Stackly does not download metadata automatically.

Technical stack: Turborepo monorepo with Next.js App Router, Prisma, shadcn/ui, Tailwind CSS, NextAuth.js v5, and PostgreSQL.

## Product Features

| Feature | Status |
|---|---|
| Collections, sub-collections, and items management | ✅ Implemented |
| Free-form metadata on items and collections (`Datum`, templates, choice lists) | ✅ Implemented |
| Tags and tag categories to group items across collections | ✅ Implemented |
| Basic public sharing for collections, items, albums, and public wishlists | ✅ Implemented |
| Wishlists and wishes | ✅ Implemented |
| Item loans | ✅ Implemented |
| Multi-user support with user/admin roles | ✅ Implemented |
| Dark mode and customizable themes | ✅ Implemented |
| Multi-language i18n | ✅ Implemented |
| Installable PWA through manifest and icons | ✅ Implemented |
| REST API | ✅ Implemented |
| Manual/configurable scrapers | ✅ Implemented |

## Database Compatibility

The Next.js v2 version uses **PostgreSQL** through Prisma. Legacy MySQL/MariaDB support is not part of this conversion cycle and is intentionally excluded from the current configuration.

## Structure

```text
next/
├── apps/
│   └── web/                  ← Next.js 15 app (frontend + API)
│       ├── app/
│       │   ├── (auth)/       ← /login, /register
│       │   ├── (dashboard)/  ← Authenticated pages
│       │   └── api/          ← REST route handlers
│       ├── components/       ← React components by module
│       ├── lib/
│       │   ├── actions/      ← Server Actions (CRUD)
│       │   └── auth-utils.ts ← requireAuth() helpers
│       ├── auth.ts           ← NextAuth.js v5 configuration
│       └── middleware.ts     ← Route protection
└── packages/
    ├── db/                   ← Prisma schema + client (stk_* tables)
    ├── lib/                  ← Shared types, utilities, constants
    └── ui/                   ← Shared shadcn/ui components
```

## Requirements

- Node.js >= 20
- npm >= 10
- PostgreSQL, either the migrated legacy database or a new one

## Setup

```bash
# 1. From the next/ directory
cd next
npm install

# 2. Configure environment variables
cp .env.example .env
# Edit DATABASE_URL and NEXTAUTH_SECRET in .env

# 3. Generate the Prisma client
npm run db:generate

# 4. Optional: apply schema changes to a new database
npm run db:push

# 5. Start development
npm run dev
```

## Environment Variables (`next/.env`)

Use one central file: `next/.env`.
Do not create `apps/web/.env` or `packages/db/.env`: all workspace scripts read `../../.env`.

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | PostgreSQL DSN | `postgresql://user:pass@localhost:5432/stackly` |
| `NEXTAUTH_SECRET` | JWT session secret, random 32 bytes | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | App base URL | `http://localhost:3000` |
| `UPLOAD_DIR` | File upload directory | `./public/uploads` |

## Legacy Database Compatibility

The Prisma schema uses the target table names (`stk_*`) and PostgreSQL. Legacy passwords are compatible: Symfony uses `bcrypt $2y$`, which is normalized to `$2b$` for `bcryptjs` in Node.js.

To import a legacy `koi_*` database into the new `stk_*` schema, use the `legacy:migrate`, `legacy:validate`, and `legacy:uploads:*` scripts.

## Commands

```bash
npm run dev           # Start development (Turbopack)
npm run build         # Production build
npm run start         # Start the production Next.js server
npm run i18n:validate # Validate messages/*.json schema/placeholders
npm run db:generate   # Regenerate Prisma client
npm run db:push       # Sync schema to the database (development)
npm run db:migrate    # Create a migration (production)
npm run db:studio     # Open Prisma Studio
npm run maintenance:refresh-cached-values # Reconcile counters/cachedValues
npm run maintenance:regenerate-logs       # Regenerate missing create logs and mark delete logs
npm run maintenance:regenerate-thumbnails # Regenerate thumbnails from original files
npm run legacy:migrate                    # Migrate a PostgreSQL legacy koi_* DB to stk_* (dry-run by default)
npm run legacy:validate                   # Validate counts and integrity after migration
npm run legacy:uploads:audit              # Check upload files referenced by the migrated DB
npm run legacy:uploads:copy               # Copy upload files using user-defined source/destination paths
```

All `maintenance:*` commands support `--help` and `--dry-run`.

For the PostgreSQL legacy-to-Prisma migration, see `LEGACY_DB_MIGRATION.md`.

## Deployment and Runtime

The legacy project exposes only the Symfony/PHP runtime through the Docker files at the repository root. For the new Next.js stack, use:

- `next/Dockerfile` for the monorepo build/runtime container
- `next/Dockerfile.scratch` for a minimal `scratch`-based runtime variant
- `next/docker-compose.yml` to start the Next.js app and PostgreSQL using the image published on GHCR

### Local Container Runtime

```bash
# From the next/ directory
docker compose up -d
```

### Production Notes

- Mount the persistent volume at `/var/lib/stackly/uploads`; the container links it to `/app/apps/web/public/uploads`
- Database operations run at startup through `entrypoint.sh`: it creates the database if it does not exist, then runs `prisma migrate deploy`
- The production build uses Next.js standalone output; the entrypoint starts `apps/web/server.js`
- `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, and `UPLOAD_DIR` must be set at runtime
- `maintenance:*` commands can be run inside the same application container

## PWA

Stackly includes an installable manifest (`/manifest.webmanifest`) and application icons in `apps/web/public/icons/`.

The project does not register an aggressive service worker by default: authenticated pages and private data are not cached offline automatically.

## Internationalization (i18n)

The app uses `next-intl` with a cookie-based strategy (`stk_locale`).

**Locale source of truth:** `apps/web/i18n/locales.ts`

Supported locales in `next/apps/web/messages/`:

| Code | Language |
|---|---|
| `da` | Danish |
| `de` | German |
| `en` | English (default) |
| `es` | Spanish |
| `fr` | French |
| `it` | Italian |
| `nl` | Dutch |
| `pl` | Polish |
| `pt` | Portuguese |
| `pt_BR` | Portuguese (Brazil) |
| `ru` | Russian |
| `tr` | Turkish |
| `uk` | Ukrainian |
| `zh` | Chinese |

Before opening a PR that changes UI text, run:

```bash
npm run i18n:validate
```

## Available Routes

### Authentication

| Route | Description | Status |
|---|---|---|
| `/login` | Sign in with the Credentials provider | ✅ Implemented |
| `/register` | Register a new user | ✅ Implemented |

### Dashboard

| Route | Description | Status |
|---|---|---|
| `/` | Dashboard with quick statistics | ✅ Implemented |

### Collections and Items

| Route | Description | Status |
|---|---|---|
| `/collections` | Collection management: list, create, hierarchy | ✅ Implemented |
| `/collections/[id]` | Collection detail with nested items | ✅ Implemented |
| `/collections/[id]/edit` | Edit collection | ✅ Implemented |
| `/items/[id]` | Item detail with custom data (`Datum`) | ✅ Implemented |
| `/items/[id]/edit` | Edit item | ✅ Implemented |

### Albums and Photos

| Route | Description | Status |
|---|---|---|
| `/albums` | Photo album management: list, create, hierarchy | ✅ Implemented |
| `/albums/[id]` | Album detail with photos | ✅ Implemented |
| `/albums/[id]/edit` | Edit album | ✅ Implemented |
| `/photos/[id]` | Photo detail | ✅ Implemented |

### Wishlists and Wishes

| Route | Description | Status |
|---|---|---|
| `/wishlists` | Wishlist management: list, create, hierarchy | ✅ Implemented |
| `/wishlists/[id]` | Wishlist detail with wishes | ✅ Implemented |
| `/wishlists/[id]/edit` | Edit wishlist | ✅ Implemented |
| `/wishes/[id]` | Wish detail | ✅ Implemented |

### Public Sharing

| Route | Description | Status |
|---|---|---|
| `/public/collections/[id]` | Public collection/sub-collection view | ✅ Implemented |
| `/public/items/[id]` | Public item view | ✅ Implemented |
| `/public/albums/[id]` | Public album/sub-album view | ✅ Implemented |
| `/public/wishlists/[id]` | Public wishlist/sub-wishlist view | ✅ Implemented |
| `/user/[username]/wishlists` | Compatibility view for public user wishlists | ✅ Implemented |

### Secondary Features

| Route | Description | Status |
|---|---|---|
| `/tags` | Tags and tag categories management | ✅ Implemented |
| `/templates` | Item structure templates + fields | ✅ Implemented |
| `/choice-lists` | Reusable value lists for custom fields | ✅ Implemented |
| `/loans` | Active and returned loans | ✅ Implemented |
| `/inventories` | Inventories | ✅ Implemented |
| `/scrapers` | Manual scraper configuration | ✅ Implemented |
| `/history` | Change history (`Log`) | ✅ Implemented |
| `/statistics` | Statistics and charts | ✅ Implemented |
| `/search` | Full-text search across Collections, Items, Albums, Photos, Wishlists, and Wishes | ✅ Implemented |
| `/settings` | User profile settings | ✅ Implemented |

## REST API

### Authentication

| Endpoint | Methods | Description | Status |
|---|---|---|---|
| `/api/auth/[...nextauth]` | GET, POST | NextAuth.js handler: login, logout, session | ✅ |

### Collections

| Endpoint | Methods | Description | Status |
|---|---|---|---|
| `/api/collections` | GET, POST | List and create collections | ✅ |
| `/api/collections/[id]` | GET, PATCH, DELETE | Collection CRUD | ✅ |

### Items

| Endpoint | Methods | Description | Status |
|---|---|---|---|
| `/api/items` | GET, POST | List and create items | ✅ |
| `/api/items/[id]` | GET, PATCH, DELETE | Item CRUD | ✅ |

### Albums

| Endpoint | Methods | Description | Status |
|---|---|---|---|
| `/api/albums` | GET, POST | List and create albums | ✅ |
| `/api/albums/[id]` | GET, PATCH, DELETE | Album CRUD | ✅ |

### Photos

| Endpoint | Methods | Description | Status |
|---|---|---|---|
| `/api/photos` | GET, POST | List and create photos | ✅ |
| `/api/photos/[id]` | GET, PATCH, DELETE | Photo CRUD | ✅ |

### Wishlists

| Endpoint | Methods | Description | Status |
|---|---|---|---|
| `/api/wishlists` | GET, POST | List and create wishlists | ✅ |
| `/api/wishlists/[id]` | GET, PATCH, DELETE | Wishlist CRUD | ✅ |

### Wishes

| Endpoint | Methods | Description | Status |
|---|---|---|---|
| `/api/wishes` | GET, POST | List and create wishes | ✅ |
| `/api/wishes/[id]` | GET, PATCH, DELETE | Wish CRUD | ✅ |

### Secondary Features

| Endpoint | Methods | Description | Status |
|---|---|---|---|
| `/api/tags` | GET, POST | List and create tags | ✅ |
| `/api/tags/[id]` | GET, PATCH, DELETE | Tag CRUD | ✅ |
| `/api/tag-categories` | GET, POST | List and create tag categories | ✅ |
| `/api/templates` | GET, POST | List and create templates | ✅ |
| `/api/templates/[id]` | GET, PATCH, DELETE | Template CRUD | ✅ |
| `/api/choice-lists` | GET, POST | List and create choice lists | ✅ |
| `/api/inventories` | GET, POST | List and create inventories | ✅ |
| `/api/loans` | GET, POST | List and create loans | ✅ |
| `/api/scrapers` | GET, POST | List and create manual scrapers | ✅ |
| `/api/scrapers/collection-preview` | POST | Manual collection metadata preview/import | ✅ |
| `/api/scrapers/item-preview` | POST | Manual item metadata preview/import | ✅ |

### Utilities

| Endpoint | Methods | Description | Status |
|---|---|---|---|
| `/api/search` | GET | Full-text search across all entities | ✅ |
| `/api/upload` | POST | Image upload with automatic thumbnail resize | ✅ |
| `/api/logs` | GET | Change history | ✅ |

## Server Actions

All CRUD operations are also implemented as **Server Actions** in `lib/actions/*.actions.ts` for direct integration with React components:

| File | Description | Status |
|---|---|---|
| `lib/actions/collection.actions.ts` | Collection CRUD | ✅ |
| `lib/actions/item.actions.ts` | Item CRUD | ✅ |
| `lib/actions/media.actions.ts` | Media CRUD and upload helpers | ✅ |
| `lib/actions/photo.actions.ts` | Photo CRUD | ✅ |
| `lib/actions/wish.actions.ts` | Wish CRUD | ✅ |
| `lib/actions/user.actions.ts` | User actions: profile and settings | ✅ |

## React Components (shadcn/ui)

Components are organized by functional module in `apps/web/components/`:

| Module | Components | Description |
|---|---|---|
| `auth/` | `LoginForm`, `RegisterForm` | Authentication forms |
| `collections/` | `CollectionList`, `CollectionForm`, `CollectionBreadcrumb`, `ItemTree`, `ItemForm`, `ItemDetail` | Collections and items components |
| `albums/` | `AlbumList`, `AlbumForm`, `AlbumBreadcrumb`, `PhotoGrid`, `PhotoUpload` | Albums and photos components |
| `wishlists/` | `WishlistList`, `WishlistForm`, `WishlistBreadcrumb`, `WishGrid`, `WishForm` | Wishlists and wishes components |
| `tags/` | `TagList`, `TagForm` | Tag management |
| `templates/` | `TemplateList`, `TemplateForm`, `FieldEditor` | Templates and fields |
| `scrapers/` | `ScraperForm` | Manual scraper configuration |
| `public/` | `PublicShell`, `PublicCards`, `CopyPublicLinkButton` | Public views and sharing |
| `statistics/` | `StatsCard`, `CollectionsChart`, `ItemsChart` | Statistics visualization |
| `history/` | `LogTable`, `LogFilter` | Change history |
| `search/` | `SearchBox`, `SearchResults` | Full-text search |
| `settings/` | `ProfileForm`, `ChangePasswordForm` | User settings |
| `shared/` | `Sidebar`, `Navbar`, `Breadcrumb`, `LoadingSpinner`, `Dialog`, `Table` | Shared UI components |
| `layout/` | `ProtectedLayout`, `AuthLayout`, `DashboardLayout` | Shared layouts |
