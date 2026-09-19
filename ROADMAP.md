# Stackly development roadmap

This is the source of truth for work that is still planned for the Next.js
application. The migration-era backlog in `legacy/TODO.md` is retained only as
historical context.

## Next slices

1. Add a scraper test/run workflow to the scraper UI.
2. Surface the existing `Search`, `SearchBlock`, and `SearchFilter` models in an
   advanced search builder with saved searches.
3. Add the public user profile at `/user/[username]` and audit public ownership
   and visibility rules across all shared resources.
4. Add profile avatar editing, admin user management, and admin diagnostics.

## Product decisions

- Decide whether collection batch tagging remains in scope.
- Decide whether legacy signatures should be migrated or explicitly retired.
- Decide whether inventory export/download remains supported.
- Decide whether cleanup tools remain CLI-only or are exposed in the admin UI.

## Operations

- Choose the final legacy-to-Next.js cutover strategy.
- Validate and document the production `UPLOAD_DIR` storage convention.
- Decide whether production needs dedicated health and metrics endpoints.
- Resolve or explicitly exclude 32-bit ARM container support.
- Resolve the legacy schema gaps documented in `LEGACY_DB_MIGRATION.md`.

## Quality

- Expand tests for tags, templates, choice lists, inventories, loans, scrapers,
  public visibility, settings, admin, and search.
- Add authorization regression tests for route handlers and admin-only surfaces.
- Add focused coverage for maintenance scripts and upload handling.

## Recently completed

- Collection index grid/list display configuration and configurable columns.
- Collection detail display configuration, custom data, counters, and uncapped
  items browsing through the dedicated items route.
- Public collection, item, album, and wishlist pages.
- Collection and item scraper preview/import flows.
- Client-side collection-name filtering on the collection index.
