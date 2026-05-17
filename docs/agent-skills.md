# Aniwhere Agent Skills

This repository carries project-local Codex skills under `.codex/skills`.

## Skills

- `aniwhere-toss-webview`: Apps in Toss WebView, SDK, `granite.config.ts`, permissions, login, ads, promotions, sandbox, and launch checks.
- `aniwhere-product-ux`: product decisions, mobile UX, screen scope, permission timing, Toss-style information exploration, and design-token usage.
- `aniwhere-skill-workflow`: creating and maintaining project skills using Apps in Toss webinar guidance and Superpowers practices.
- `aniwhere-launch-checklist`: final Apps in Toss non-game launch review for access/functions, navigation, login/auth/permissions, guide routing, UI/UX, brand text, payments, ads, external links, TDS, sharing rewards, and sandbox evidence.

For UI styling work, read `docs/design-tokens.md`, `docs/tds-compatible-ui-layer.md`, and `docs/tds-route-audit.md`. Apps in Toss launch is the product priority: use project TDS facades first when official components exist, treat `client/src/shared/ui/ait` as migration debt to remove, and route reusable values through `client/src/styles/tokens.css` before adding new raw CSS values.

Route-level TDS work must start by classifying the route and searching official TDS Mobile docs with the Apps in Toss MCP. Do not wait for the user to provide links for Button, Typography, Top, ListRow, BottomCTA, BottomSheet, SearchField, Toast, Dialog, or other touched primitives.

`@aniwhere/tds-mobile` is the page-code import boundary for TDS work. Apps in Toss builds must resolve it to official `@toss/tds-mobile`; public/domain builds may resolve it to local fallback only to avoid Toss-only runtime leakage. Do not treat the facade as permission to bypass official TDS when an official component fits.

New `Ait*` route/page imports are frozen by `client/scripts/assert-ait-usage-allowlist.mjs`. Do not expand that allowlist; reducing it is the normal direction.

## Codex Apps In Toss MCP

Aniwhere uses Codex rather than Claude Code for the primary agent workflow. Follow the Apps in Toss vibe-coding guide through the `ax` install step, then connect it to Codex instead of running `claude mcp add`.

Current Windows setup:

- `ax` is installed with Scoop at `C:\Users\jdhn2\scoop\shims\ax.exe`.
- Codex MCP config lives in `C:\Users\jdhn2\.codex\config.toml`.
- The primary agent is Codex Desktop. Do not require `claude mcp add`; also do not depend on a separate npm-installed `codex` CLI for Aniwhere work unless it is explicitly repaired and verified.
- The Apps in Toss server is registered as:

```toml
[mcp_servers.apps-in-toss]
command = "C:\\Users\\jdhn2\\scoop\\shims\\ax.exe"
args = ["mcp", "start"]
```

After changing this config, restart Codex or start a new Codex session before relying on the MCP tools. The CLI fallback is `ax search docs --query "<topic>"`, `ax search tds-web --query "<topic>"`, and `ax list examples`.

## PR-Level Launch/TDS Gate

Before opening or handing off any PR that touches client UI, WebView behavior, routing, native/app-owned navigation, maps, permissions, external links, modals/notices, draft persistence, or CSS:

1. Use `aniwhere-pr-preflight`.
2. Use `aniwhere-launch-checklist` for the touched scope.
3. Complete `docs/tds-route-audit.md` for touched routes and include the official docs checked.
4. Fill the Apps in Toss / TDS section in `.github/PULL_REQUEST_TEMPLATE.md`.
5. Classify findings as `Required`, `Recommended`, `Needs sandbox`, `Needs console value`, or `Follow-up PR`.
6. Keep official Apps in Toss/TDS requirements separate from Aniwhere local TDS-compatible decisions.

If a PR intentionally excludes a broader TDS audit, state the follow-up branch/PR scope in the PR body.

## Use On Another Machine

After pulling this branch, copy the project skills into the Codex skills directory if the app does not auto-discover repo-local skills:

```powershell
Copy-Item -Recurse -Force .codex\skills\* "$env:USERPROFILE\.codex\skills\"
```

Then restart Codex so the new skills are loaded.

## Recommended Superpowers Skills

Use the installed Superpowers skills as process helpers:

- `writing-skills` for new Apps in Toss implementation skills.
- `writing-plans` for multi-step login, TDS, admin, reward, or launch work.
- `executing-plans` or `subagent-driven-development` for approved implementation plans.
- `systematic-debugging` for login, callback, permission, ad, reward, or sandbox failures.
- `verification-before-completion` before claiming a build, fix, or launch check is complete.
- `requesting-code-review` before risky auth, reward, WebView, or launch changes.

## Source

The skill split is based on:

- `AGENTS.md`
- `guard.md`
- `docs/product-decisions.md`
- `docs/ux-mobile-research.md`
- Apps in Toss final review skill PDF: `앱인토스 웨비나 _ 미니앱 최종 검수 스킬 공유.pdf`
- Robin launch checklist skill folder: `C:/Users/jdhn2/Downloads/appsintoss-nongame-launch-checklist-by-robin`
- Apps in Toss webinar PDF: `[가이드] 앱인토스 웨비나 _ 바이브코딩으로 만든 앱, 앱인토스에 출시하기.pdf`
