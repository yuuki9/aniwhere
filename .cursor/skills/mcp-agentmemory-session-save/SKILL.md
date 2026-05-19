---
name: mcp-agentmemory-session-save
description: Use when #task-done or #new-session appears and a durable memory handoff should be saved with agentmemory MCP.
---

# AgentMemory Session Save

## Trigger

Run this when boundary tags are detected:

- `#task-done`
- `#new-session`

## Policy

- Do not auto-save without confirmation.
- Save only durable outcomes: decision, reusable pattern, fact, clear handoff.
- Never save secrets, tokens, credentials, or personal data.
- For session-switch tags, create a logical session marker first.

## Save Steps

1. Confirm save scope with the user.
2. If tag is `#new-session`:
   - Create `session_id` as `session-YYYYMMDD-HHmmss`.
   - Save marker first using `agentmemory-memory_save` with:
     - `type: workflow`
     - `concepts: session,session-open,<session_id>`
     - `content: [Session Open] session_id=<session_id>`
3. Summarize in 4 lines:
   - Goal
   - Key changes
   - Decision rationale
   - Next step
4. Choose memory type: `workflow`, `pattern`, `architecture`, `fact`, or `bug`.
5. Add concepts including `session`, `pr`, and domain keywords.
6. Add the same `<session_id>` concept when available.
7. Add related file paths if relevant.
8. Execute `agentmemory-memory_save`.
