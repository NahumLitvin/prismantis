---
name: release
description: Cut a prismantis release - version bump, changelog, verify, tag and push. Use when asked to "release", "bump the version", "ship 0.x" or "publish".
---

# Release

1. **Pick the version.** Breaking option or token renames are minor while below 1.0 (and major after). New features are minor. Fixes are patch.
2. **Set it in both manifests**: `version` in `plugin/.claude-plugin/plugin.json` and `plugins[0].version` in `.claude-plugin/marketplace.json`.
3. **Changelog:** add a dated `## [x.y.z]` at the top of docs/CHANGELOG.md, with Added, Changed and Fixed written for users. PRs do not touch the file, so write it from the "What changes for the user" section of every PR merged since the last tag (`git log vPREV..HEAD --oneline`), one entry per user-visible change, linking the PR. Fold in anything still under `## [Unreleased]` and drop that heading.
4. **Generated files:** run `npm --prefix scripts run build:codex`, since PRs leave `codex/` stale. If `scripts/package.json` changed, also run `npm --prefix scripts run build:vendor`, and confirm the bundle has no `import` statements and no non-MIT code (`grep -c -i elk plugin/hooks/vendor/*.js` must print 0).
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
9. **Pin the release:** once the `release` workflow is green, including its `install from the zip` jobs on Claude Code 2.1.287 and latest, a second PR sets the `source` in `.claude-plugin/marketplace.json` to `{"source": "archive", "url": "https://github.com/NahumLitvin/prismantis/releases/download/vX.Y.Z/prismantis-plugin.zip", "sha256": "<sha256 of that download>"}`. Installs then fetch a zip of `plugin/` with no git, which every supported Claude Code accepts; `git-subdir` broke Claude Code 2.1.287 on git older than 2.39. In `.agents/plugins/marketplace.json`, the Codex copy, set `ref` to `vX.Y.Z` and `sha` to the tagged commit by hand, then run `npm --prefix scripts run build:codex`, which keeps that git source. Hash the zip through a query URL (`…/prismantis-plugin.zip?pin=1`), never the bare URL, and before merging fetch the bare URL 20 times and install from it with Claude Code 2.1.287 and latest: GitHub's download edge cached a 504 from the first requests on v0.43.0 and failed installs for about 20 minutes. Until the PR merges, installs keep getting the previous release.
10. **Claude directory:** the `release` workflow fast-forwards the `release` branch to the tag, which the Claude plugin directory follows (claude.ai/directory/manage, plugin path `plugin`). Check the plugin page there picks up the new version; a reviewer may need to approve it.
11. **Confirm** CI and the release workflow are green, then run the fresh install test and check `claude plugin list` shows the new version.
12. **Blog:** in `~/git/nahum-writing`, update the "What it draws today" section of `posts/2026-10-02-prismantis/article.md` (version, date, features, counts, limits) and any number in the opening paragraph, then release the blog per its AGENTS.md. Skip when the clone is missing and say so.
