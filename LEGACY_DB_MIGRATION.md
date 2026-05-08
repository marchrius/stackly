# Legacy PostgreSQL DB Migration

This document describes the supported migration path from a legacy Koillection PostgreSQL database using `koi_*` tables to the Stackly Next.js/Prisma PostgreSQL schema using `stk_*` tables.

The migration is intentionally copy-based: keep the legacy database read-only, create a fresh target database, apply Prisma migrations, then copy data from source to target.

## Requirements

- PostgreSQL source database with legacy `koi_*` tables
- Empty PostgreSQL target database
- `.env` configured with `DATABASE_URL` pointing at the target database
- Optional `LEGACY_DATABASE_URL` in `.env`, or pass `--source` explicitly

## Workflow

1. Put the legacy app in maintenance/read-only mode.
2. Dump the production database.
3. Restore the dump into a source snapshot database.
4. Create a fresh target database.
5. Apply the Prisma schema to the target database.
6. Run a dry-run migration.
7. Run the real migration.
8. Validate the migrated database.
9. Copy legacy uploads to the target `UPLOAD_DIR`.
10. Run maintenance tasks for derived data.
11. Start the Next.js app against the target database and smoke test.

Example:

```bash
pg_dump --format=custom --file=koillection_legacy.dump koillection
createdb koillection_legacy_snapshot
pg_restore --dbname=koillection_legacy_snapshot koillection_legacy.dump

createdb stackly

DATABASE_URL="postgresql://user:pass@localhost:5432/stackly" npm run db:migrate

npm run legacy:migrate -- \
  --source "postgresql://user:pass@localhost:5432/koillection_legacy_snapshot" \
  --target "postgresql://user:pass@localhost:5432/stackly" \
  --dry-run

npm run legacy:migrate -- \
  --source "postgresql://user:pass@localhost:5432/koillection_legacy_snapshot" \
  --target "postgresql://user:pass@localhost:5432/stackly" \
  --execute

npm run legacy:validate -- \
  --source "postgresql://user:pass@localhost:5432/koillection_legacy_snapshot" \
  --target "postgresql://user:pass@localhost:5432/stackly"

npm run maintenance:refresh-cached-values
npm run maintenance:regenerate-logs -- --dry-run
```

## Environment Variables

The scripts accept CLI arguments or environment variables:

| Option | Environment | Description |
|---|---|---|
| `--source` | `LEGACY_DATABASE_URL` | Legacy PostgreSQL database with `koi_*` tables |
| `--target` | `DATABASE_URL` | New PostgreSQL database with Prisma-created `stk_*` tables |

`legacy:migrate` defaults to `--dry-run`. It writes only when `--execute` is passed.

## Mapping

Core table mapping:

| Legacy | Target |
|---|---|
| `koi_user` | `stk_user` |
| `koi_configuration` | `stk_configuration` |
| `koi_display_configuration` | `stk_display_configuration` |
| `koi_collection` | `stk_collection` |
| `koi_item` | `stk_item` |
| `koi_datum` | `stk_datum` |
| `koi_album` | `stk_album` |
| `koi_photo` | `stk_photo` |
| `koi_wishlist` | `stk_wishlist` |
| `koi_wish` | `stk_wish` |
| `koi_tag` | `stk_tag` |
| `koi_tag_category` | `stk_tag_category` |
| `koi_template` | `stk_template` |
| `koi_field` | `stk_field` |
| `koi_choice_list` | `stk_choice_list` |
| `koi_inventory` | `stk_inventory` |
| `koi_loan` | `stk_loan` |
| `koi_log` | `stk_log` |
| `koi_scraper` | `stk_scraper` |
| `koi_path` | `stk_path` |
| `koi_search` | `stk_search` |
| `koi_search_block` | `stk_search_block` |
| `koi_search_filter` | `stk_search_filter` |
| `koi_item_tag` | `_ItemTags` |
| `koi_item_related_item` | `_RelatedItems` |

The executable mapping lives in `scripts/_lib/legacy-db-mapping.mjs`.

## Normalization

The migration keeps legacy UUIDs and password hashes unchanged. NextAuth handles Symfony bcrypt `$2y$` hashes by normalizing them at login.

The migration normalizes:

- locales to the supported Next.js locale list
- legacy `authenticated-users-only` visibility to `internal`
- legacy `browser` theme to `auto`
- missing choice list display mode to `pill`
- missing choice list selection mode to `multiple`
- missing datum/field display mode to `list`

Self-referencing parent columns and the user collection index display configuration are updated after the first copy pass to avoid circular foreign key problems.

## Uploads

Database rows keep their existing file path values. Copy the legacy uploaded files into the directory used by `UPLOAD_DIR`.

Upload source and target paths are intentionally user-defined. The scripts expect directories that represent the root `uploads` folder. If the database contains `uploads/<user-id>/<file>`, pass the directory that contains `<user-id>/`.

Audit first:

```bash
npm run legacy:uploads:audit -- \
  --database "postgresql://stackly:stackly@localhost:5432/stackly_transfer" \
  --source "/path/to/legacy/uploads" \
  --target "/path/to/stackly/uploads"
```

Copy with dry-run first:

```bash
npm run legacy:uploads:copy -- \
  --database "postgresql://stackly:stackly@localhost:5432/stackly_transfer" \
  --source "/path/to/legacy/uploads" \
  --target "/path/to/stackly/uploads" \
  --dry-run
```

Copy for real:

```bash
npm run legacy:uploads:copy -- \
  --database "postgresql://stackly:stackly@localhost:5432/stackly_transfer" \
  --source "/path/to/legacy/uploads" \
  --target "/path/to/stackly/uploads" \
  --execute
```

Existing target files are skipped. If paths differ between legacy and target deployments, adjust files or path values before opening the app to users.

## Validation

`npm run legacy:validate` checks:

- row counts for mapped tables
- core foreign key integrity in the target database
- cached direct counters for collections, albums, and wishlists

Counter mismatches are not necessarily data loss; run:

```bash
npm run maintenance:refresh-cached-values
```

Then run validation again.

## Known Schema Gaps

The target Prisma schema does not currently model every legacy user preference and display configuration relation. In particular, several legacy feature flags and some album/wishlist/tag display configuration references are not persisted by the current target schema.

Before a production migration, decide whether these preferences should be:

- added to `packages/db/prisma/schema.prisma`,
- converted into newer target preferences,
- or intentionally dropped.

If a gap becomes a functional regression during testing, record it in `BUGS.md` before fixing it.
