---
name: release
description: Cut a prismantis release - version bump, changelog, verify, tag and push. Use when asked to "release", "bump the version", "ship 0.x" or "publish".
---

# Release

1. **Pick the version.** Breaking option or token renames are minor while below 1.0 (and major after). New features are minor. Fixes are patch.
2. **Set it in both manifests**: `version` in `.claude-plugin/plugin.json` and `plugins[0].version` in `.claude-plugin/marketplace.json`.
3. **Changelog:** add a dated `## [x.y.z]` at the top of docs/CHANGELOG.md, with Added, Changed and Fixed written for users. PRs do not touch the file, so write it from the "What changes for the user" section of every PR merged since the last tag (`git log vPREV..HEAD --oneline`), one entry per user-visible change, linking the PR. Fold in anything still under `## [Unreleased]` and drop that heading.
4. **Generated files:** run `npm --prefix scripts run build:codex`, since PRs leave `codex/` stale. If `scripts/package.json` changed, also run `npm --prefix scripts run build:vendor`, and confirm the bundle has no `import` statements and no non-MIT code (`grep -c -i elk hooks/vendor/*.js` must print 0).
5. **Verify:** run every step in AGENTS.md Verify, plus `live-check` of `/prismantis demo` and `/prismantis demo-rtl`, reading every Hebrew line right to left.
6. **Fresh install test** against a throwaway config:
   ```
   CLAUDE_CONFIG_DIR=<scratch>/fresh claude plugin marketplace add NahumLitvin/prismantis
   CLAUDE_CONFIG_DIR=<scratch>/fresh claude plugin install prismantis@prismantis
   CLAUDE_CONFIG_DIR=<scratch>/fresh claude plugin list
   ```
   Run it after pushing; the marketplace clones from GitHub.
7. **Release PR:** `main` only takes merges through a PR with green checks, so open the release commit as a PR and merge it.
8. **Tag main:** `git tag vX.Y.Z <merge commit> && git push origin vX.Y.Z`. The `release` workflow checks the tag against `plugin.json`, checks the tag is on `main`, and publishes the GitHub release from the CHANGELOG section.
9. **Pin the release:** a second PR sets `ref` to `vX.Y.Z` and `sha` to the tagged commit in the `source` of `.claude-plugin/marketplace.json`, then runs `npm --prefix scripts run build:codex` so `.agents/plugins/marketplace.json`, the Codex copy with a git `url` source, follows. Until it merges, installs keep getting the previous release.
10. **Confirm** CI and the release workflow are green, then run the fresh install test and check `claude plugin list` shows the new version.
11. **Blog:** in `~/git/nahum-writing`, update the "What it draws today" section of `posts/2026-10-02-prismantis/article.md` (version, date, features, counts, limits) and any number in the opening paragraph, then release the blog per its AGENTS.md. Skip when the clone is missing and say so.
