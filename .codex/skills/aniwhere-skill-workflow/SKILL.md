---
name: aniwhere-skill-workflow
description: Create, update, and use Aniwhere project skills based on the Apps in Toss webinar workflow and Superpowers practices. Use when making new Codex skills, adapting Apps in Toss docs into skills, planning multi-step SDK work, or preparing reusable agent workflows for this repository.
---

# Aniwhere Skill Workflow

## Purpose

Use this skill to turn repeatable Aniwhere work into concise Codex skills. Keep repository rules and Apps in Toss official docs above generic methodology.

## When Creating A Skill

1. Start from a concrete repeated workflow, not a vague category.
2. Keep `SKILL.md` lean and procedural.
3. Put long docs, examples, or official links in `references/` only when needed.
4. Include `agents/openai.yaml` with a short display name, description, and default prompt.
5. Avoid copying entire external documents into the skill; summarize and link instead.
6. Validate that the skill does not conflict with `AGENTS.md`, `guard.md`, or `docs/product-decisions.md`.

## Good Aniwhere Skill Candidates

- Apps in Toss login implementation
- Apps in Toss promotion reward implementation
- Ads integration and mock replacement
- TDS/mobile UI migration
- Non-game launch checklist
- Admin/reward policy review

## Superpowers Mapping

- Use `writing-skills` when creating or revising skills.
- Use `brainstorming` before broad or ambiguous product work.
- Use `writing-plans` before multi-step SDK, TDS, admin, or reward changes.
- Use `executing-plans` or `subagent-driven-development` to run an approved plan.
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
6. Build with `npm run build`.
7. Verify with a mobile device through Apps in Toss sandbox/console.

Adapt this for Aniwhere by preserving existing product scope and adding only the skills that reduce repeated work.

## Launch Skill Source

The second webinar PDF about "미니앱 최종 검수 스킬" does not include the private skill contents, only installation and invocation guidance. For Aniwhere, use `aniwhere-launch-checklist` as the local adaptation based on official Apps in Toss non-game launch criteria.
