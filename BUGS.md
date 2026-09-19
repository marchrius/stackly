# BUGS.md

Known bug register for the `next/` project.

## Operating Rule

- Whenever a functional, UX, build, or integration bug is found in the `next/` project, add it here immediately.
- Each entry must include at least: status, affected area, problem description, expected behavior, and useful reproduction or diagnostic notes.
- When a bug is fixed, update the related entry with the fix or final status.

---

## Open Bugs

### 5. The web lint script is incompatible with the current Next.js CLI

- Status: open
- Area: `apps/web` · npm scripts · linting
- Severity: low

**Description**

Running `npm run lint` fails before ESLint checks any source files because the
web workspace still invokes the removed `next lint` command.

**Expected Behavior**

The lint script should run ESLint against the web application and report source
issues normally.

**Observed Behavior**

The current Next.js CLI treats `lint` as a project directory and exits with
`Invalid project directory provided .../apps/web/lint`.

**Technical Notes**

- Reproduced while validating the quick-edit feature.
- Replace the workspace script with a direct ESLint command and migrate any
  remaining Next-specific lint configuration.

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

### 11. Item detail previous/next navigation used lexicographic ordering

- Status: completed (fixed)
- Area: `apps/web` · `/items/[id]` · previous/next navigation
- Severity: medium

**Description**

The previous and next links on an item detail page did not follow natural
numeric ordering for volume-like names.

**Expected Behavior**

For an item named `Vol. 20`, the previous item should be `Vol. 19` and the next
item should be `Vol. 21` when those items exist.

**Observed Behavior**

For `Vol. 20`, the detail page identified `Vol. 2` as previous and `Vol. 3` as
next because the sibling query used PostgreSQL string ordering.

**Technical Notes**

- Fixed by applying the shared natural-text comparator before selecting the
  adjacent siblings.
- Creation time and ID provide a deterministic source order for equal names.
- Added regression coverage for both `Vol. 19 → Vol. 20 → Vol. 21` and the
  absence of a next item after `Vol. 20`.
- Reported with item `52771769-89b7-44a0-9a4f-4c9fe171ba83`.

### 10. Navbar account controls shifted to the left on desktop

- Status: completed (fixed)
- Area: `apps/web` · dashboard navbar · responsive layout
- Severity: medium

**Description**

The username, avatar, settings, and logout controls moved from the right side
of the top navbar to the left on desktop.

**Expected Behavior**

Account information and actions should remain right-aligned at every viewport
size, regardless of whether the mobile application version is visible.

**Observed Behavior**

The mobile version label replaced the navbar's empty left spacer and is hidden
at the `md` breakpoint. On desktop this left only one visible flex child, so
`justify-between` placed the account controls at the start of the navbar.

**Technical Notes**

- Fixed by applying `ml-auto` directly to the account-controls group.
- Alignment no longer depends on a visible spacer or on the responsive state of
  the version label.

### 9. Logout button did not end the authenticated session

- Status: completed (fixed)
- Area: `apps/web` · dashboard navbar · Auth.js sign-out
- Severity: high

**Description**

Clicking the logout icon in the authenticated navbar produced no visible
result. The user remained on the current page and appeared to stay signed in.

**Expected Behavior**

The logout action should invalidate the Auth.js session and redirect the user
to `/login`.

**Observed Behavior**

The navbar depended on the client-side `next-auth/react` `signOut` helper and
its deprecated `callbackUrl` option. A failed client request had no UI feedback,
leaving the logout icon apparently inactive.

**Technical Notes**

- Fixed by exposing Auth.js server-side `signOut` and invoking it through a
  dedicated Server Action.
- The navbar now submits a form that invalidates the session on the server and
  redirects with `redirectTo: "/login"`.
- `/api/auth/*` remains excluded from the proxy matcher.

### 8. Sub-collection item totals were not refreshed on collection detail pages

- Status: completed (fixed)
- Area: `apps/web` · `/collections/[id]` · sub-collection counters
- Severity: medium

**Description**

On a collection detail page, the item total shown for each sub-collection did
not update to reflect the items currently contained in that sub-collection.

**Expected Behavior**

Each sub-collection displayed on `/collections/{collection-uuid}` should show an
up-to-date recursive item total, including items in its descendants.

**Observed Behavior**

The cards preferred aggregated counters from `cachedValues` over Prisma's live
direct `_count`. Those cached values are generated by a maintenance command and
were not refreshed by item mutations, so a positive stale value kept winning
after route revalidation.

**Technical Notes**

- Fixed by computing recursive item and descendant totals from the current
  collection tree when rendering authenticated collection detail and index
  pages.
- `CollectionGrid` accepts explicit live counter overrides for this view, while
  retaining cached aggregate behavior elsewhere.
- Added regression coverage for a three-level collection tree in
  `apps/web/test/lib/collection-detail.test.ts`.

### 7. Volume-like names were ordered lexicographically instead of naturally

- Status: completed (fixed)
- Area: `apps/web` · list/grid ordering · collections, items, albums, photos, wishlists, wishes
- Severity: medium

**Description**

Lists containing numeric volume names such as `1`, `2`, `3`, and `12` could be shown in lexicographic order, producing sequences like `1`, `10`, `11`, `12`, `2`, `3`.

**Expected Behavior**

User-facing collection, item, album, photo, wishlist, and wish lists should compare embedded numbers as integers, so volume-like names are ordered `1`, `2`, `3`, `4`, ..., `12`.

**Observed Behavior**

Several views relied on database string ordering or unsorted arrays for `name`/`title` fields.

**Technical Notes**

- Fixed by adding `apps/web/lib/natural-sort.ts` and using it in the main private/public grids, detail sections, search results, and collection display sorting fallback.
- Added regression coverage in `apps/web/test/lib/natural-sort.test.ts` and `apps/web/test/lib/collection-index-display.test.ts`.

### 6. OIDC account linking from settings could be rejected as an invalid linking request

- Status: completed (fixed)
- Area: `apps/web` · Auth.js / OIDC · account linking · settings
- Severity: high

**Description**

After signing in with username/password, starting OIDC connection from settings could redirect back to login with `oidc_link_forbidden`, shown to the user as "This linking request is no longer valid. Start the connection from settings again."

**Expected Behavior**

An authenticated user should be able to connect an OIDC provider from settings. The temporary link request must survive the OIDC round trip and be accepted only for the same signed-in user.

**Observed Behavior**

The OIDC callback used the OIDC profile email as the linking target even during an explicit settings link request. If the OIDC email differed from the signed-in credentials account email and was not already a local user, the request was treated as invalid.

**Technical Notes**

- Fixed in `apps/web/lib/auth/oidc-signin.ts`.
- During a valid link request, the signed `stackly_oidc_link` cookie now chooses the target user; OIDC email is stored on the provider record but no longer has to match the local account email.
- The flow still rejects linking if the OIDC subject is already linked to another user or if the OIDC email belongs to a different local user.
- Added regression coverage in `apps/web/test/lib/auth/oidc-signin.test.ts`.

### 5. OIDC redirect URI could use localhost in production when the auth base URL was misconfigured

- Status: completed (fixed)
- Area: `apps/web` · Auth.js / OIDC · environment configuration
- Severity: high

**Description**

OIDC login could build the provider `redirect_uri` from a local base URL such as `http://localhost:3000` when the auth base URL was copied from development configuration into a deployed environment.

**Expected Behavior**

When OIDC is enabled in production, the callback URL sent to the identity provider must use the public site domain, for example `https://example.com/api/auth/callback/oidc`, never `localhost:3000`.

**Observed Behavior**

The environment examples documented `NEXTAUTH_URL="http://localhost:3000"`, and there was no guard preventing that local URL from being used with OIDC in production.

**Technical Notes**

- Fixed in `apps/web/lib/auth-url.ts` and `apps/web/auth.ts`.
- Auth.js base URL is now normalized into both `AUTH_URL` and `NEXTAUTH_URL` before initializing NextAuth.
- In production, if a public app URL is available through `AUTH_URL`, `NEXTAUTH_URL`, `NEXT_PUBLIC_APP_URL`, `PUBLIC_APP_URL`, or `APP_URL`, localhost candidates are skipped.
- If OIDC is enabled in production and the resolved auth URL is still local, startup fails with an explicit configuration error.
- Added regression coverage in `apps/web/test/lib/auth-url.test.ts`.

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
