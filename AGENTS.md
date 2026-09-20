# Repository workflow

These instructions apply to the whole repository. More specific `AGENTS.md`
files may add directory-level rules, but they do not replace the release
workflow below.

## Permanent branches

- `main` is the production and release-history branch.
- `develop` is the integration branch for completed work.
- Never publish a release tag from `develop`.
- Every release must be present in both `main` and `develop`.

## Development workflow

Use Git Flow for all changes:

1. Start feature, fix, and chore branches from `develop` with
   `git flow feature start <name>` (or the corresponding `feature/`, `fix/`, or
   `chore/` branch when Git Flow has no dedicated command).
2. Commit and validate the change on that branch.
3. Merge the completed branch into `develop` with an explicit non-fast-forward
   merge, then delete the local work branch when it is no longer needed.
4. Do not merge ordinary development branches directly into `main`.

## Exact release process

For a version such as `2.0.0-alpha-14`, use this sequence:

1. Confirm that `main` and `develop` are clean and synchronized with their
   remote tracking branches. Fetch remote state before selecting the version.
2. Check that the release tag does not already exist locally or remotely.
3. From `develop`, run:

   ```sh
   git flow release start 2.0.0-alpha-14
   ```

4. Update the version in all three authoritative locations:

   - `package.json` → `version`
   - `package-lock.json` → top-level `version`
   - `package-lock.json` → `packages[""].version`

5. Validate that the three values are identical, run `git diff --check`, and
   run the tests/builds appropriate to the changes included in the release.
6. Commit only the version change on the release branch:

   ```sh
   git add package.json package-lock.json
   git commit -m "chore: bump version"
   ```

7. Finish the release with Git Flow:

   ```sh
   git flow release finish -m "Release 2.0.0-alpha-14" 2.0.0-alpha-14
   ```

   This operation must:

   - merge `release/2.0.0-alpha-14` into `main`;
   - create the annotated tag `2.0.0-alpha-14` on the release commit in
     `main`;
   - merge the release back into `develop`;
   - remove the completed local release branch.

8. Verify before publication:

   ```sh
   git show --no-patch 2.0.0-alpha-14
   git merge-base --is-ancestor 2.0.0-alpha-14 main
   git merge-base --is-ancestor 2.0.0-alpha-14 develop
   ```

9. Push only when the user explicitly requests publication. Push both permanent
   branches and the tag:

   ```sh
   git push origin main develop
   git push origin 2.0.0-alpha-14
   ```

The tag push triggers `.github/workflows/release-image.yml`. That workflow
builds and publishes container images; it does not merge branches. A release is
therefore incomplete if the tag exists but its commit is not reachable from
both `main` and `develop`.

## Hotfixes

Start production hotfixes from `main` with `git flow hotfix start <version>`.
After validation, finish them with `git flow hotfix finish`; verify that Git
Flow merged the result into both `main` and `develop` and created the annotated
version tag on `main`.
