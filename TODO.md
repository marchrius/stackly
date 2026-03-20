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

1. Close the remaining item price/currency parity:
   - persist `Datum.currency`
   - add currency selection in `ItemForm`
2. Then move to scraper execution/testing from the UI.
3. Then continue with advanced search / saved searches.

### Recently completed and already reflected below

- full item/article parity batch in `next/` for form/detail/edit flows
- item scraper preview/import, related items, template/common/collection datum loading
- committed demo seed script for templates, collections, items, albums, and photos

## Current baseline

These areas already have real pages and/or APIs in `next/` and are **not** tracked here unless there is still a meaningful parity gap:

- auth
- collections and items
- albums and photos
- wishlists and wishes
- tags, tag categories, templates, choice lists, inventories, loans, and scrapers at basic CRUD/API level
- settings, admin configuration, history, statistics, search, and image uploads
- maintenance scripts for thumbnails, logs, and cached values
- Docker/runtime baseline for `next/` via `next/Dockerfile` and `docker-compose.next.dist.yml`

## Priority 1 - Feature gaps still visible from legacy comparison

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

### Item datum follow-up

- Fix price datum currency parity:
  - persist `Datum.currency` during item create/update
  - add a currency selector in `ItemForm` for `price` fields so legacy price behavior is fully matched

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

1. Scrapers UI and execution flow.
2. Advanced search and saved searches.
3. Public profile / public visibility pages.
4. Profile + admin management depth.
5. Price/currency datum parity.
6. Inventory/export/signature decisions.
7. Remaining deployment-retirement decisions.
8. Broader automated test coverage.
