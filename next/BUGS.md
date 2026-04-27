# BUGS.md

Known bug register for the `next/` project.

## Operating Rule

- Whenever a functional, UX, build, or integration bug is found in the `next/` project, add it here immediately.
- Each entry must include at least: status, affected area, problem description, expected behavior, and useful reproduction or diagnostic notes.
- When a bug is fixed, update the related entry with the fix or final status.

---

## Open Bugs

### 4. Next Docker images cannot currently target 32-bit ARM platforms

- Status: open
- Area: `Dockerfile` / `Dockerfile.scratch` · Docker multi-platform build
- Severity: medium

**Description**

The requested Docker image matrix includes all ARM variants, but the current `node:24-alpine` base image used by both Next Dockerfiles only publishes `linux/amd64`, `linux/arm64/v8`, and `linux/s390x` manifests. It does not provide `linux/arm/v6` or `linux/arm/v7`.

**Expected Behavior**

The Docker release workflow should build every requested platform, including 32-bit ARM variants, if the runtime stack supports them.

**Observed Behavior**

The new GitHub workflow can safely target `linux/amd64` and `linux/arm64`. Adding `linux/arm/v6` or `linux/arm/v7` would fail during base image resolution unless the Dockerfiles switch to a compatible base/build strategy.

**Technical Notes**

- Verified with `docker buildx imagetools inspect node:24-alpine`.
- `alpine:latest` publishes ARMv6/ARMv7 manifests, but `node:24-alpine` does not.
- To support 32-bit ARM, evaluate a different Node base image or a custom runtime build before extending the workflow platform list.

## Fixed Bugs

### 0. Next build failed while prerendering 404/500 pages

- Status: completed (fixed)
- Area: `apps/web` · App Router · production build
- Severity: high

**Description**

During `npm run build`, Next.js tried to prerender error pages and failed with `Error: <Html> should not be imported outside of pages/_document`.

**Expected Behavior**

The production build must complete successfully, including App Router error and not-found routes.

**Observed Behavior**

The build stopped on `/_error` while prerendering `/404` or `/500`.

**Technical Notes**

- Root cause: `dotenv` loaded `NODE_ENV="development"` from `next/.env` during `next build`.
- Fixed by forcing `NODE_ENV=production` in the root/web `build` scripts after loading the environment.
- Added dedicated App Router pages for `not-found` and `global-error`, keeping the error UI controlled and localized.

### 0. Item scraper preview ignored custom HTTP headers

- Status: completed (fixed)
- Area: `apps/web` · item scraper preview · HTTP headers
- Severity: medium

**Description**

The item scraper preview read saved headers by looking for `name/value` keys, while the form and collection preview save and read `header/value`.

**Expected Behavior**

The item preview must send the same custom headers configured by the user in the scraper, consistently with the collection preview.

**Observed Behavior**

Custom headers were discarded while fetching the remote source for items, causing different or failed previews for sites that require specific headers.

**Technical Notes**

- Fixed in `apps/web/app/api/scrapers/item-preview/route.ts`.
- The scraping flow remains manual: the remote fetch starts only after the user's explicit preview/import action.

### 0. Standalone Docker image was missing Prisma CLI runtime dependencies

- Status: completed (fixed)
- Area: `Dockerfile` · container runtime · Prisma migrations
- Severity: high

**Description**

After optimizing the Docker image with standalone output, the runtime copied the Prisma CLI and `@prisma/*`, but not all transitive dependencies required by `prisma migrate deploy`.

**Expected Behavior**

The container must be able to apply Prisma migrations at startup without copying the entire build `node_modules`.

**Observed Behavior**

The entrypoint failed with `Cannot find module 'effect'`, imported by `@prisma/config`.

**Technical Notes**

- Fixed in `Dockerfile`.
- The standalone runtime now copies the Prisma CLI transitive dependencies required by `@prisma/config` and the loaders used by `prisma migrate deploy`.

### 0. Legacy upload URLs could duplicate the upload prefix in image paths

- Status: completed (fixed)
- Area: `apps/web` · upload image rendering · legacy migration
- Severity: high

**Description**

Images migrated from the legacy app could fail to load in the UI because paths saved in the database already included the `uploads/` prefix, while many components always prepended `/uploads/` during rendering.

**Expected Behavior**

Upload paths must be normalized consistently, accepting both new values like `<user>/<file>` and legacy values like `uploads/<user>/<file>` or `/uploads/<user>/<file>`.

**Observed Behavior**

The UI generated URLs like `/uploads/uploads/...`, causing broken cover images, thumbnails, item media, and user avatars.

**Technical Notes**

- Fixed in `packages/lib/src/utils/index.ts` by centralizing normalization in `getUploadUrl`.
- Updated web components and helpers that manually built upload URLs.
- Added regression coverage in `apps/web/test/lib/item-detail.test.ts` for legacy paths prefixed with `uploads/`.

### 0. Docker build did not generate the Prisma client before `next build`

- Status: completed (fixed)
- Area: `Dockerfile` · Next.js production build
- Severity: high

**Description**

The Docker image build failed during `npx next build` because `@prisma/client` had not been generated in the builder stage.

**Expected Behavior**

The Docker image must generate the Prisma client before the Next.js build, so server pages can import `@stackly/db` without errors.

**Observed Behavior**

The build failed with `@prisma/client did not initialize yet. Please run "prisma generate"`.

**Technical Notes**

- Fixed in `Dockerfile`: added `RUN cd packages/db && npx prisma generate` before `RUN cd apps/web && npx next build`.

### 0. Legacy migration did not convert PostgreSQL/Doctrine arrays to valid JSON

- Status: completed (fixed)
- Area: `scripts` · PostgreSQL legacy migration
- Severity: high

**Description**

During the real import from `koi_*` to `stk_*`, legacy fields stored as PostgreSQL/Doctrine arrays, for example `{"ROLE_USER"}`, were sent to target JSONB fields without conversion.

**Expected Behavior**

The migration script must convert legacy arrays to valid JSON arrays before inserting into the Prisma target database.

**Observed Behavior**

PostgreSQL rejected the JSONB insert with `invalid input syntax for type json`.

**Technical Notes**

- Fixed in `scripts/legacy-migrate-db.mjs`.
- Added parsing for PostgreSQL array literals `{...}` in addition to the already supported JSON and PHP serialized array formats.
- Also fixed `null` mapping for source columns, now interpreted as "use the same target column", and forced valid JSON serialization for JSONB fields.
- Added fallback usage even when the legacy column exists but contains `NULL`, which is required for `NOT NULL` target columns like `parent_visibility`.
- The error happened inside a transaction: the partial import was rolled back.

### 1. User theme was not applied after saving preferences

- Status: completed (fixed)
- Area: `apps/web` · user settings · theming
- Severity: high

**Description**

The theme selection in settings was saved, but the selected theme was not applied correctly to the interface after saving preferences.

**Expected Behavior**

After selecting a theme and saving preferences, the UI must update using the user's selected theme.

**Observed Behavior**

Theme switching was unreliable: local synchronization was fragmented inside the settings page only, theme class updates were not always consistent, and the persistence flow was fragile.

**Technical Notes**

- Fixes applied in `apps/web/components/settings/SettingsForm.tsx`, `apps/web/app/layout.tsx`, `apps/web/lib/actions/user.actions.ts`, `apps/web/lib/theme/themes.ts`, `apps/web/app/globals.css`, `packages/ui/src/components/{badge,dialog}.tsx`, `apps/web/components/settings/ThemePicker.tsx`, `apps/web/app/(dashboard)/{page.tsx,history/page.tsx}`, `apps/web/components/{shared/SearchResults.tsx,statistics/StatisticsCharts.tsx,wishlists/WishlistDetail.tsx}`.
- The flow no longer uses cookies for the theme: the server decides the theme by reading the user's persisted preference, and the client then forces a full layout reload after saving.
- Last intervention: simplified theme application on the root document (`html.theme-*`), added `color-scheme`, verified Tailwind CSS variable support, and replaced several hardcoded colors that bypassed theme tokens.
- Final verification: added regression test `apps/web/test/lib/actions/user.actions.test.ts` for `theme` persistence, cache invalidation, and input validation. Both `npm run test` and `npm run type-check` in `next/apps/web` passed.
- Last rewrite: fully removed client-side providers/boundaries (`AppThemeProvider`, `AppThemeBoundary`) and all live theme management in the client.
- Current flow is simpler and stable: theme selection in `ThemePicker` (radio), persistence through `updateSettings`, server-driven theme application in `app/layout.tsx` through the `html.theme-*` class, then full page reload after saving.
- Confirmed removal of the old local sync (`ThemeBodySync`) to avoid drift between client state and the effective document class.
- Post-rewrite technical verification: `npm run test`, `npm run type-check`, and `npm run build` in `next/apps/web` all passed.

### 2. The Prisma user schema did not expose the collection index display configuration

- Status: fixed
- Area: `packages/db` · Prisma schema · collections index
- Severity: medium

**Description**

The legacy app stores the collection index through `User.collectionsDisplayConfiguration`, but the Prisma model in the `next/` project did not yet expose the related user relation.

**Expected Behavior**

The `next/` project must be able to read and persist the user's display configuration for `/collections`, so the collection list can restore grid/list mode, sorting, and columns.

**Observed Behavior**

`schema.prisma` exposed `DisplayConfiguration` for collection children/items and search, but not the `User.collectionsDisplayConfiguration` relation. As a result, the collection index screen could neither offer nor consume legacy display options.

**Technical Notes**

- Fixed in `packages/db/prisma/schema.prisma`, `apps/web/lib/actions/user.actions.ts`, `apps/web/app/(dashboard)/collections/page.tsx`, `apps/web/app/(dashboard)/collections/edit/page.tsx`, `apps/web/components/collections/CollectionGrid.tsx`, `apps/web/components/collections/CollectionList.tsx`.
- Added regression coverage in `apps/web/test/lib/collection-index-display.test.ts`.

### 3. `EmptyState` broke Server -> Client rendering

- Status: completed (fixed)
- Area: `apps/web` · shared components · empty states
- Severity: high

**Description**

`EmptyState` received an icon component as a prop from several server components (`TagList`, various empty-state pages). At runtime, Next.js serialized that icon as an unsupported function and generated Server -> Client boundary errors.

**Expected Behavior**

Pages and lists with empty states must be able to render the icon without serialization errors between Server Components and Client Components.

**Observed Behavior**

Rendering failed with errors like "Functions cannot be passed directly to Client Components" and "Only plain objects can be passed to Client Components", blocking the tags page and potentially other server-side empty states.

**Technical Notes**

- Fixed in `apps/web/components/shared/EmptyState.tsx` by removing the unnecessary client boundary.
- This fix removes the icon component passing as a serialized prop; empty states remain renderable from server components without errors.

## Fixed Bug History

### 4. The Prisma collection schema did not expose `scrapedFromUrl`

- Status: fixed
- Area: `packages/db` · Prisma schema · collection form scraping
- Severity: medium

**Description**

The legacy app exposes `Collection.scrapedFromUrl`, and the collection form uses that value in the scraping/import workflow, but the Prisma model in the `next/` project did not yet include the column.

**Expected Behavior**

The `Collection` model in the `next/` project must read and persist `scrapedFromUrl` as well, so the form can save the scrape source URL and keep parity with the legacy app.

**Observed Behavior**

`schema.prisma` included `scrapedFromUrl` for `Item` but not for `Collection`, so the new collection form could not complete the scraping/import flow correctly.

**Technical Notes**

- Fixed in `packages/db/prisma/schema.prisma`, `apps/web/lib/actions/collection.actions.ts`, `apps/web/app/api/collections/route.ts`, `apps/web/app/api/collections/[id]/route.ts`, `apps/web/components/collections/CollectionForm.tsx`.
- Added `apps/web/app/api/scrapers/collection-preview/route.ts`, `apps/web/lib/server/scraper-preview.ts`, and regression coverage in `apps/web/test/lib/scraper-preview.test.ts`.

---

### 5. Item `price` datum currency was not persisted

- Status: fixed
- Area: `apps/web` · item form · datum persistence · item API
- Severity: medium

**Description**

Custom `price` fields in items saved the numeric value but not the associated currency, leaving parity with the legacy behavior incomplete.

**Expected Behavior**

When a user fills in or edits a `price` datum, the selected currency must travel from the form to persistence and return correctly in detail pages and item APIs.

**Observed Behavior**

`Datum.currency` remained `null` because the item payload did not serialize/persist it, and the item detail showed `USD` as an implicit fallback even when no real currency existed.

**Technical Notes**

- Fixed in `apps/web/components/items/ItemForm.tsx`, `apps/web/lib/actions/item.actions.ts`, `apps/web/lib/item-persistence.ts`, `apps/web/app/api/items/route.ts`, `apps/web/app/api/items/[id]/route.ts`, `apps/web/components/items/ItemDetail.tsx`.
- Added regression coverage in `apps/web/test/lib/item-persistence.test.ts` and updated `apps/web/test/app/api/items.route.test.ts`.
