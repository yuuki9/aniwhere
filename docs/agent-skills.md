# Aniwhere Agent Skills

This repository carries project-local Codex skills under `.codex/skills`.

## Skills

- `aniwhere-toss-webview`: Apps in Toss WebView, SDK, `granite.config.ts`, permissions, login, ads, promotions, sandbox, and launch checks.
- `aniwhere-product-ux`: product decisions, mobile UX, screen scope, permission timing, Toss-style information exploration, and design-token usage.
- `aniwhere-skill-workflow`: creating and maintaining project skills using Apps in Toss webinar guidance and Superpowers practices.
- `aniwhere-launch-checklist`: final Apps in Toss non-game launch review for access/functions, navigation, login/auth/permissions, guide routing, UI/UX, brand text, payments, ads, external links, TDS, sharing rewards, and sandbox evidence.

For UI styling work, read `docs/design-tokens.md` and use `client/src/styles/tokens.css` before adding new raw CSS values.

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
