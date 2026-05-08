# Stackly — Next.js v2

Stackly is a self-hosted collection manager for keeping track of physical collections of any kind: books, DVDs, comics, vinyl records, stamps, games, photo albums, wishlists, and more.

This repository now contains the full-stack Next.js version of Stackly. It keeps the product scope of the legacy Koillection application while replacing the Symfony/Twig runtime with a Turborepo monorepo based on Next.js App Router, React, Prisma, shadcn/ui, Tailwind CSS, NextAuth.js v5, and PostgreSQL.

Stackly does not ship with automatic metadata download for a specific collection type. Users can define their own custom fields, templates, choice lists, tags, and manual HTML scrapers, then import metadata only through explicit preview/import actions.

## Product Features

| Feature | Status |
|---|---|
| Collections, sub-collections, and item management | Implemented |
| Album, sub-album, and photo management | Implemented |
| Wishlist, sub-wishlist, and wish management | Implemented |
| Custom item metadata (`Datum`) | Implemented |
| Templates, fields, and choice lists | Implemented |
| Tags and tag categories | Implemented |
| Image and file uploads with thumbnail generation | Implemented |
| Public sharing for collections, items, albums, wishlists, and public user wishlists | Implemented |
| Full-text search across the main resources | Implemented |
| History/log view | Implemented |
| Statistics dashboard | Implemented |
| Inventories and loans | Implemented |
| Manual/configurable HTML scrapers | Implemented |
| Multi-user support with user/admin roles | Implemented |
| User settings, themes, and dark mode | Implemented |
| Multi-language i18n | Implemented |
| REST API route handlers | Implemented |
| Installable PWA manifest and icons | Implemented |

## Screenshots

The interface has been rebuilt for v2, but the functional coverage matches the same workflows shown by the legacy Koillection project.

<p align="center">
    <img width="400px" src="https://user-images.githubusercontent.com/20560781/168048241-cfcb71ce-c296-4f1b-bbb8-ecfea1e31048.png">
    <img width="400px" src="https://user-images.githubusercontent.com/20560781/168048246-53e991d1-77e9-4397-80c4-f1aa82504068.png">
</p>

<p align="center">
    <img height="215px" src="https://user-images.githubusercontent.com/20560781/168049067-dbac37b1-1150-4be5-ab95-f784d606f300.png">
    <img height="215px" src="https://user-images.githubusercontent.com/20560781/168049077-efac8291-4f5c-48d9-b2fa-d65a51842d25.png">
    <img height="215px" src="https://user-images.githubusercontent.com/20560781/177819056-8f110583-08ae-42b6-9e32-3e3db4a3923a.png">
    <img height="215px" src="https://user-images.githubusercontent.com/20560781/177818960-6e988a73-67e0-47bc-a377-0c92c530d423.png">
    <img height="215px" src="https://user-images.githubusercontent.com/20560781/168049088-2cda1da5-6e55-4800-918f-001fad6559a6.png">
    <img height="215px" src="https://user-images.githubusercontent.com/20560781/168049095-5f26e2c6-7218-42ae-bde1-4b32abae7e35.png">
    <img height="215px" src="https://user-images.githubusercontent.com/20560781/177819233-f3aa62c4-ce48-4184-9864-d40708367dbf.png">
    <img height="215px" src="https://user-images.githubusercontent.com/20560781/177819299-048ea3ad-fa0a-463d-b5b7-1607773553e4.png">
</p>

## Database Compatibility

Stackly v2 uses PostgreSQL through Prisma. MySQL and MariaDB support from the legacy Symfony application is not part of the current conversion cycle.

The Prisma schema uses the new target table names (`stk_*`). Legacy PostgreSQL databases using `koi_*` tables can be migrated with the `legacy:migrate`, `legacy:validate`, and `legacy:uploads:*` scripts.

Legacy Symfony bcrypt hashes using `$2y$` are supported by normalizing them to `$2b$` for `bcryptjs`.

## Repository Structure

```text
.
├── apps/
│   └── web/                  # Next.js app: frontend + API route handlers
│       ├── app/
│       │   ├── (auth)/       # Login and registration
│       │   ├── (dashboard)/  # Authenticated application pages
│       │   └── api/          # REST API route handlers
│       ├── components/       # React components by domain
│       ├── i18n/             # next-intl configuration and locale source of truth
│       ├── messages/         # Translations
│       ├── lib/              # Server actions, auth helpers, app utilities
│       ├── auth.ts           # NextAuth.js v5 configuration
│       └── middleware.ts     # Route protection and locale handling
├── packages/
│   ├── db/                   # Prisma schema and shared client
│   ├── lib/                  # Shared types and utilities
│   └── ui/                   # Shared shadcn/ui components
└── legacy/                   # Archived Symfony/PHP application
```

## Requirements

- Node.js >= 20
- npm >= 10
- PostgreSQL

## Setup

```bash
npm install
cp .env.example .env
# Edit DATABASE_URL and NEXTAUTH_SECRET in .env
npm run db:generate
npm run db:push
npm run dev
```

## Environment Variables

Use one central environment file: `.env`.

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | PostgreSQL DSN | `postgresql://user:pass@localhost:5432/stackly` |
| `NEXTAUTH_SECRET` | JWT session secret, random 32 bytes | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Public app base URL in production | `https://stackly.example.com` |
| `UPLOAD_DIR` | File upload directory | `./public/uploads` |

Do not create `apps/web/.env` or `packages/db/.env`: workspace scripts read the root `.env`.

## Commands

Run commands from this directory.

```bash
npm run dev           # Start development with Turbopack
npm run build         # Production build
npm run start         # Start the production Next.js server
npm run lint          # Lint
npm run type-check    # TypeScript check
npm run test          # Test suite
npm run i18n:validate # Validate messages/*.json schema/placeholders
npm run db:generate   # Regenerate Prisma client
npm run db:push       # Sync schema to the database in development
npm run db:migrate    # Create/apply Prisma migrations
npm run db:studio     # Open Prisma Studio
npm run db:seed       # Seed base data
npm run db:seed:demo  # Seed demo data
npm run maintenance:refresh-cached-values
npm run maintenance:regenerate-logs
npm run maintenance:regenerate-thumbnails
npm run legacy:migrate
npm run legacy:validate
npm run legacy:uploads:audit
npm run legacy:uploads:copy
```

All `maintenance:*` commands support `--help` and `--dry-run`.

For the PostgreSQL legacy-to-Prisma migration path, see `LEGACY_DB_MIGRATION.md`.

## Deployment

The new stack includes its own container configuration:

- `Dockerfile` for the standard monorepo build/runtime container
- `Dockerfile.scratch` for the minimal runtime variant
- `docker-compose.yml` for the app and PostgreSQL
- `entrypoint.sh` for startup database preparation and Prisma migration deployment

```bash
docker compose up -d
```

Runtime notes:

- Mount persistent uploads at `/var/lib/stackly/uploads`; the container links that path to `apps/web/public/uploads`.
- Set `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, and `UPLOAD_DIR` in production.
- With OIDC enabled, the provider callback URL must match `<NEXTAUTH_URL>/api/auth/callback/oidc`.
- The production build uses Next.js standalone output and starts `apps/web/server.js`.

## Internationalization

Stackly v2 uses `next-intl` with a cookie-based locale strategy.

Locale source of truth: `apps/web/i18n/locales.ts`.

Supported locale files:

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

Before changing user-visible text, update every `messages/*.json` file and run:

```bash
npm run i18n:validate
```

## Available Routes

### Authentication and Dashboard

| Route | Description |
|---|---|
| `/login` | Sign in |
| `/register` | Register a user |
| `/` | Dashboard with quick statistics |
| `/settings` | User profile, preferences, locale, and theme |
| `/settings/admin` | Admin configuration |

### Collections and Items

| Route | Description |
|---|---|
| `/collections` | Collections index |
| `/collections/new` | Create a collection |
| `/collections/[id]` | Collection detail with nested collections and items |
| `/collections/edit?id=...` | Edit a collection |
| `/items/new` | Create an item |
| `/items/[id]` | Item detail with custom data |

### Albums and Photos

| Route | Description |
|---|---|
| `/albums` | Albums index |
| `/albums/new` | Create an album |
| `/albums/[id]` | Album detail with nested albums and photos |
| `/photos/[id]` | Photo detail |

### Wishlists and Wishes

| Route | Description |
|---|---|
| `/wishlists` | Wishlists index |
| `/wishlists/new` | Create a wishlist |
| `/wishlists/[id]` | Wishlist detail with nested wishlists and wishes |
| `/wishes/[id]` | Wish detail |

### Public Sharing

| Route | Description |
|---|---|
| `/public/collections/[id]` | Public collection/sub-collection view |
| `/public/items/[id]` | Public item view |
| `/public/albums/[id]` | Public album/sub-album view |
| `/public/wishlists/[id]` | Public wishlist/sub-wishlist view |
| `/user/[username]/wishlists` | Public user wishlists compatibility route |

### Secondary Features

| Route | Description |
|---|---|
| `/tags` | Tags |
| `/tags/categories` | Tag categories |
| `/templates` | Item templates and fields |
| `/choice-lists` | Reusable value lists |
| `/inventories` | Inventories |
| `/loans` | Loans |
| `/scrapers` | Manual scraper configuration |
| `/history` | Change history |
| `/statistics` | Statistics |
| `/search` | Search |

## REST API

| Endpoint | Methods | Description |
|---|---|---|
| `/api/auth/[...nextauth]` | GET, POST | Auth.js session/login/logout handlers |
| `/api/collections` | GET, POST | List and create collections |
| `/api/collections/[id]` | GET, PATCH, DELETE | Collection CRUD |
| `/api/collections/[id]/item-form` | GET | Collection item form metadata |
| `/api/items` | GET, POST | List and create items |
| `/api/items/[id]` | GET, PATCH, DELETE | Item CRUD |
| `/api/albums` | GET, POST | List and create albums |
| `/api/albums/[id]` | GET, PATCH, DELETE | Album CRUD |
| `/api/photos` | GET, POST | List and create photos |
| `/api/photos/[id]` | GET, PATCH, DELETE | Photo CRUD |
| `/api/wishlists` | GET, POST | List and create wishlists |
| `/api/wishlists/[id]` | GET, PATCH, DELETE | Wishlist CRUD |
| `/api/wishlists/[id]/children` | GET | Wishlist children |
| `/api/wishlists/[id]/parent` | PATCH | Change wishlist parent |
| `/api/wishlists/[id]/wishes` | GET | Wishlist wishes |
| `/api/wishes` | GET, POST | List and create wishes |
| `/api/wishes/[id]` | GET, PATCH, DELETE | Wish CRUD |
| `/api/wishes/[id]/wishlist` | PATCH | Move a wish to another wishlist |
| `/api/tags` | GET, POST | List and create tags |
| `/api/tags/[id]` | GET, PATCH, DELETE | Tag CRUD |
| `/api/tag-categories` | GET, POST | List and create tag categories |
| `/api/tag-categories/[id]` | GET, PATCH, DELETE | Tag category CRUD |
| `/api/templates` | GET, POST | List and create templates |
| `/api/templates/[id]` | GET, PATCH, DELETE | Template CRUD |
| `/api/choice-lists` | GET, POST | List and create choice lists |
| `/api/choice-lists/[id]` | GET, PATCH, DELETE | Choice list CRUD |
| `/api/inventories` | GET, POST | List and create inventories |
| `/api/inventories/[id]` | GET, PATCH, DELETE | Inventory CRUD |
| `/api/loans` | GET, POST | List and create loans |
| `/api/loans/[id]` | GET, PATCH, DELETE | Loan CRUD |
| `/api/scrapers` | GET, POST | List and create scrapers |
| `/api/scrapers/[id]` | GET, PATCH, DELETE | Scraper CRUD |
| `/api/scrapers/collection-preview` | POST | Preview/import collection metadata |
| `/api/scrapers/item-preview` | POST | Preview/import item metadata |
| `/api/search` | GET | Search |
| `/api/upload` | POST | Upload with thumbnail generation |
| `/api/logs` | GET | Change history |

## PWA

The app includes an installable manifest (`/manifest.webmanifest`) and application icons in `apps/web/public/icons/`.

Authenticated pages and private data are not cached offline by an aggressive service worker by default.

## Updating and Backups

Back up the database and uploaded files before applying application updates, especially when Prisma migrations or legacy migration scripts are involved.

## Contributing and Translations

Stackly is MIT licensed. Contributions, bug reports, and translation fixes are welcome.

The legacy translation project is available at <https://crowdin.com/project/koillection>. The Next.js stack stores its translations in `apps/web/messages/*.json`.

## Licensing

Stackly is open source software released under the MIT License.
