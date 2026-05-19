# Hook Governance

## Scope

This document defines team-wide rules for Cursor hooks used in `.cursor/hooks.json`.

## Naming Rules

- Hook script file names use `kebab-case`.
- Prefix hook scripts by domain when possible.
  - Example: `tag-session-marker.js`, `aws-mutation-guard.js`
- Keep one hook script focused on one responsibility.

## Event Rules

- Use the narrowest event first.
  - Prompt boundary checks: `beforeSubmitPrompt`
  - Shell command checks: `beforeShellExecution`
- Avoid broad hooks unless there is a clear cross-cutting need.

## Matcher Rules

- Prefer simple, explicit matchers.
- If matcher complexity grows, move filtering logic into script code.
- Validate matcher behavior with at least one positive and one negative test.

## Failure Policy

- Default policy is fail-open for user productivity.
- Use fail-closed only for high-risk operations with explicit team agreement.
- If fail-closed is enabled, document:
  - why blocking is required
  - what fallback users should follow

## Cross-Platform Rules

- Prefer Node.js (`.js`) scripts for cross-platform execution.
- Keep shell-specific scripts (`.ps1`, `.sh`) only as optional fallback.
- Hook commands in `hooks.json` should call cross-platform scripts first.

## Verification Checklist

- Hook command path resolves from repository root.
- Positive trigger test passes.
- Negative trigger test passes.
- Hook output is valid JSON for the event contract.
- User-facing message is concise and action-oriented.
