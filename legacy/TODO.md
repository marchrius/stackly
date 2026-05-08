# TODO - Remaining `next/` migration backlog

This file intentionally lists **only the work still behind** after the P0-P7 batches already completed in `next/`.

Completed slices have been removed on purpose so this backlog stays actionable and reflects the current repository state instead of historical scaffolding.

## Committed execution plan

This section is the **repo-persisted handoff plan** to continue work from another computer.

### How to resume safely

1. Start from the first still-open item in `Priority 1`.
2. Keep `TODO.md` as the committed source of truth for active backlog and next execution steps.
3. After any Prisma change, run:
   - `cd next/packages/db && npm run db:generate`
4. After any app change, run:
   - `cd next/apps/web && npm run type-check`
   - `cd next/apps/web && npm run test`
   - `cd next/apps/web && npm run build`
   - `cd next && npm run i18n:validate`

### Current recommended next slice

1. Apply the saved **collection display configurations** in collection detail:
   - use children/items display mode settings in `/collections/[id]`
   - render list columns/toggles from the saved configuration
2. Then finish the remaining collection index/list parity:
   - add filter/search by collection name
3. Then move to scraper execution/testing from the UI.

### Recently completed and already reflected below

- full item/article parity batch in `next/` for form/detail/edit flows
- item scraper preview/import, related items, template/common/collection datum loading
- committed demo seed script for templates, collections, items, albums, and photos
- first collection detail parity batch:
  - collection custom data rendered again in detail view
  - owner-visible cached collection prices/counters surfaced from `cachedValues`
  - dedicated `/collections/[id]/items` page added for uncapped collection item browsing
- collection add/edit parity batch:
  - collection custom datum editor added to the Next form
  - collection datum persistence wired through server actions and REST API
  - collection file datum uploads handled during save
  - choice lists loaded into collection create/edit pages
- collection scraping/import parity batch:
  - `Collection.scrapedFromUrl` restored in the Prisma model
  - collection scraper preview API added at `/api/scrapers/collection-preview`
  - collection form can preview/import title, image, and scraped datum values
  - remote scraper images are downloaded and persisted on collection save
- collection display-configuration editor parity batch:
  - collection form can edit children/items display configuration blocks
  - display configuration persistence wired through server actions and REST API
  - dynamic sorting/column options are loaded from the collection's child/item datum labels
- collection index display-options parity batch:
  - `User.collectionsDisplayConfiguration` restored in the Prisma schema
  - `/collections/edit` added again for collection-index display settings
  - `/collections` now honors saved grid/list mode, sorting, list columns, counters, visibility, and actions

## Current baseline

These areas already have real pages and/or APIs in `next/` and are **not** tracked here unless there is still a meaningful parity gap:

- auth
- items
- albums and photos
- wishlists and wishes
- tags, tag categories, templates, choice lists, inventories, loans, and scrapers at basic CRUD/API level
- settings, admin configuration, history, statistics, search, and image uploads
- maintenance scripts for thumbnails, logs, and cached values
- Docker/runtime baseline for `next/` via `next/Dockerfile` and `docker-compose.next.dist.yml`

## Collections parity audit (legacy Symfony/Twig vs `next/`)

This audit is focused specifically on the **collection screens** and their adjacent collection-only routes. The current `next/` implementation covers the basic CRUD skeleton, but it is still missing a meaningful set of legacy behaviors and configuration surfaces.

### Collections index / root listing

- Legacy supports **two display modes** for collections index (`grid` and `list`) via the user collection display configuration; `next/collections` is currently **grid-only**.
- Legacy supports **editable index display settings** at `/collections/edit`:
  - sorting property
  - sorting direction
  - display mode
  - visible columns in list mode
  - show/hide visibility
  - show/hide actions
  - show/hide number of children
  - show/hide number of items
- `next/` has **no equivalent screen** for collection-index display configuration.
- Legacy index shows a **filter-by-name** input on the page; `next/collections` has **no client-side filter/search box**.
- Legacy index header shows **global counters** for total visible collections and items (including descendant counts); `next/collections` currently shows only the count of **root collections**.
- Legacy list mode exposes **inline quick actions** (edit/delete) and optional visibility/counters columns; `next/` has no list mode and therefore no equivalent inline action surface.
- Legacy index exposes **share/public entry points** from the header; `next/collections` has no public/share entry point from the collections list screen.

### Collection detail screen

- Legacy collection detail supports **filtering child collections and items by name** on-page; `next/collections/[id]` has no filter input.
- Legacy detail renders **collection custom data** (`collection.data`) and cached **aggregated price blocks**; `next/collections/[id]` currently does not render collection custom data at all.
- Legacy detail lets each collection configure and use separate display settings for:
  - child collections section
  - items section
  including section label, sorting, display mode, list columns, visibility/actions counters toggles.
- `next/collections/[id]` currently renders:
  - child collections in a fixed grid
  - items in a fixed grid
  with **no per-collection display configuration support**.
- Legacy detail exposes a dedicated **items-only route** at `/collections/{id}/items`; `next/` has no equivalent page.
- Legacy detail exposes **share/public route affordances** and a shared detail route; `next/` does not provide public/shared collection detail parity.
- Legacy detail exposes **batch tagging** from the collection page when tags are enabled; `next/` has no batch-tagging flow from collections.
- `next/collections/[id]` currently loads only the first **50 items** for the collection detail page; the legacy detail/items views are not capped that way.

### Collection add / edit screens

- Legacy collection add/edit supports **scraping/import from scraper UI** directly in the form (`ScrapingCollectionType` modal flow); `next/collections/new` and `/collections/[id]/edit` do not expose collection scraping/import.
- Legacy collection form supports editing **custom collection data fields** (`collection.data`), including:
  - text
  - number
  - country
  - date
  - file
  - checkbox
  - choice lists
- `next` `CollectionForm` has **no custom datum editor** for collections.
- Legacy form can **apply a template to collection data**; `next` only exposes `itemsDefaultTemplate` and not template-driven collection datum injection.
- Legacy form exposes full **items display configuration** for the collection:
  - title/label
  - sorting property/direction
  - display mode
  - list columns
  - show visibility
  - show actions
  - show item quantities
- Legacy form exposes full **children display configuration** for the collection:
  - title/label
  - sorting property/direction
  - display mode
  - list columns
  - show visibility
  - show actions
  - show number of children
  - show number of items
- `next` `CollectionForm` currently supports only:
  - title
  - parent
  - color
  - image
  - visibility
  - default item template
  so the configuration depth is still far from legacy parity.
- Legacy add-from-parent flow preloads more context from the parent (for example inherited item display mode settings); `next` currently only preselects the parent via query param.
- Legacy add/edit cancel behavior returns contextually either to parent/index or the collection detail; `next` currently uses `history.back()`, which is less deterministic.

### Collection-specific routes/actions present in legacy but missing in `next/`

- `/collections/edit` — edit collection index display configuration
- `/collections/{id}/items` — dedicated collection items view
- `/collections/{id}/batch-tagging` — recursive batch tag assignment from a collection
- `/user/{username}` and `/user/{username}/collections` — public/shared collection index
- `/user/{username}/collections/{id}` and `/user/{username}/collections/{id}/items` — public/shared collection detail and items view

### Recommended implementation order for collections parity

1. Restore **collection detail parity** first:
   - render collection custom data
   - remove/replace the 50-item cap with proper browsing behavior
   - add missing collection-level actions/entry points that still matter
2. Apply **display-configuration consumption**:
   - collection detail should honor saved child/item display modes
   - list columns and visibility/action counters should follow saved settings
3. Add **index/list parity**:
   - list mode
   - filter box
   - collection index configuration screen
4. Add **missing dedicated/public routes**:
   - collection items-only page
   - public/shared collection pages
   - batch tagging if still part of supported product

## Priority 1 - Feature gaps still visible from legacy comparison

### Collections screens parity

- Restore collection index parity:
  - add filter/search by collection name on the collections page
- Restore collection detail parity:
  - render collection custom data and cached/aggregated price information
  - support collection-configured child/item display modes instead of fixed grids
  - add proper browsing for large collections instead of the current `take: 50` cap
  - restore collection share/public affordances where legacy exposed them
- Restore collection add/edit parity:
  - template-driven collection data injection
- Reintroduce missing collection routes/workflows if they remain in scope:
  - `/collections/{id}/items`
  - `/collections/{id}/batch-tagging`
  - shared/public collection pages under `/user/[username]`

### Scrapers and tools

- Add a scraper test/run workflow from the UI.
- Decide whether legacy cleanup-style tools should stay CLI-only or also be exposed in admin UI.

### Advanced search and saved searches

- Surface the saved-search models already present in Prisma:
  - `Search`
  - `SearchBlock`
  - `SearchFilter`
- Build an advanced search builder with reusable filters and saved searches.
- Expand `next/apps/web/app/api/search/route.ts` beyond the current simple keyword search on items, collections, tags, wishlists, and wishes.
- Add search by datum values and by tag category when parity with legacy search matters.
- Add pagination / larger result browsing in the search UI.

### Public sharing and profile parity

- Add the missing public user profile page at `/user/[username]`.
- Add visibility-aware public/shared pages beyond wishlists:
  - collections
  - albums
  - items
  - photos
- Re-evaluate legacy `signatures` parity (`src/Controller/SignController.php`), which is still absent from `next/`.
- Audit all public/shared routes so ownership and visibility rules are consistent.

### Profile and admin depth

- Expose `timezone` in `next/apps/web/components/settings/SettingsForm.tsx` to match the already-validated field in `next/apps/web/lib/actions/user.actions.ts`.
- Add avatar/profile editing flow for users.
- Add admin user-management screens.
- Add admin error/diagnostics screens.

### Inventory / loan / signature parity

- Add inventory export/download workflows if they are still part of the supported product.
- Add quicker loan flows from item pages where legacy UX depended on them.
- Decide whether legacy signature/sign flows should be migrated or retired explicitly.

### History and statistics polish

- Extend history UI controls if legacy-level filtering/grouping is still expected.
- Extend statistics breakdowns/charts if the current top-level dashboard is not enough for parity.

## Priority 2 - Operational follow-ups

### Runtime and deployment decisions

- Decide the final cutover strategy between legacy and `next/`:
  - keep `docker-compose.next.dist.yml` as a parallel migration runtime, or
  - merge the Next service into the main project compose flow when the cutover is ready
- Decide whether a health/metrics endpoint is required for production monitoring.
- Validate the final production upload-storage strategy and make sure the chosen `UPLOAD_DIR` convention is documented for deployment environments.

### Legacy-only pieces to retire or replace explicitly

- Decide whether `src/Command/CleanUpCommand.php` becomes a Node script, an admin tool, or is retired.
- Retire `src/Command/DumpJavascriptTranslationsCommand.php` explicitly in project docs, since `next-intl` already reads JSON catalogs directly.
- Decide whether legacy API Platform / OpenAPI decorators need any replacement in `next/` or can be dropped with the Symfony API layer.

## Priority 3 - Tests and QA

- Expand Vitest coverage beyond the current initial suite.
- Add tests for:
  - tags and tag categories
  - templates and choice lists
  - inventories and loans
  - scrapers
  - advanced/public visibility flows
  - settings/admin flows
  - search expansion
- Add regression coverage for template-driven datum payloads and unsupported field handling.
- Add coverage for ownership / authorization checks in route handlers and admin-only surfaces.
- Add focused checks around maintenance scripts and upload-related behavior where practical.

## Suggested implementation order

1. Collections screen parity.
2. Scrapers UI and execution flow.
3. Advanced search and saved searches.
4. Public profile / public visibility pages.
5. Profile + admin management depth.
6. Inventory/export/signature decisions.
7. Remaining deployment-retirement decisions.
8. Broader automated test coverage.
