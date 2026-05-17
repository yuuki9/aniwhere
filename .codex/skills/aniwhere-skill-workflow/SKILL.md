---
name: aniwhere-skill-workflow
description: Use when making or updating Aniwhere project skills, adapting Apps in Toss docs into skills, planning multi-step SDK work, or preparing reusable agent workflows for this repository.
---

# Aniwhere Skill Workflow

Use this skill to turn repeatable Aniwhere work into concise Codex skills. Repository rules and official Apps in Toss docs take precedence over generic methodology.

## When Creating Or Updating A Skill

1. Start from a concrete repeated workflow, not a vague category.
2. Check `references/session-operating-guard.md` before adding cross-cutting rules; prefer extending that shared guard over creating another broad skill.
3. Keep `SKILL.md` lean and procedural.
4. Put long docs, examples, official links, or source-derived summaries in `references/`.
5. Include `agents/openai.yaml` with a short display name, description, and default prompt.
6. Avoid copying entire external documents into the skill; summarize and link where possible.
7. Validate that the skill does not conflict with `AGENTS.md`, `guard.md`, or `docs/product-decisions.md`.

## Good Aniwhere Skill Candidates

- Apps in Toss login implementation.
- Apps in Toss promotion reward implementation.
- Ads integration and mock replacement.
- TDS/mobile UI migration, especially route-level official-doc audits.
- Non-game launch checklist.
- Admin/reward policy review.

## Superpowers Mapping

- Use `writing-skills` when creating or revising skills.
- Use `writing-plans` for multi-step login, TDS, admin, reward, or launch work.
- Use `executing-plans` or `subagent-driven-development` to run an approved implementation plan.
- Use `systematic-debugging` for login, callback, permission, ad, reward, or sandbox failures.
- Use `verification-before-completion` before claiming work is complete.
- Use `requesting-code-review` for launch, reward, auth, and WebView risk review.

## Webinar-Derived Workflow

The Apps in Toss webinar suggests this sequence:

1. Install `@apps-in-toss/web-framework`.
2. Run `ait init`.
3. Configure `granite.config.ts` as the miniapp identity file.
4. Create task-specific skills for login, ads, TDS, promotion, and launch checks.
5. Use official Apps in Toss docs as references.
6. Build with `npm.cmd run build`.
7. Verify with a mobile device through Apps in Toss sandbox/console.

Adapt this for Aniwhere by preserving existing product scope and adding only the skills that reduce repeated work.

For TDS route migration work, keep `docs/tds-route-audit.md` as the reusable workflow. Future skills or guard updates should require official TDS doc discovery through the Apps in Toss MCP before editing route UI, instead of relying on the user to supply component/foundation links.

Aniwhere uses Codex as the primary AI agent, not Claude Code. When following Apps in Toss vibe-coding setup docs, replace the Claude MCP step with Codex MCP configuration in `C:\Users\jdhn2\.codex\config.toml`:

```toml
[mcp_servers.apps-in-toss]
command = "C:\\Users\\jdhn2\\scoop\\shims\\ax.exe"
args = ["mcp", "start"]
```

Restart Codex or start a new session after changing MCP configuration. If the MCP tools are not loaded in the current session, use `ax search docs --query "<topic>"`, `ax search tds-web --query "<topic>"`, or `ax list examples` as the CLI fallback.

## Launch Skill Source

The second webinar PDF about the miniapp final-review skill only included installation and invocation guidance. The actual Robin checklist folder was later supplied under `C:/Users/jdhn2/Downloads/appsintoss-nongame-launch-checklist-by-robin`; Aniwhere adapts its 11-step structure as `aniwhere-launch-checklist`, with official Apps in Toss docs and repository product rules taking precedence.
