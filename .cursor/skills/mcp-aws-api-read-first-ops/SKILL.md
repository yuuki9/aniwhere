---
name: mcp-aws-api-read-first-ops
description: Use when querying AWS account resources through AWS API MCP and read-only verification should come before any mutation.
---

# AWS API Read-First Ops

## Policy

- Default to read-only operations.
- Confirm region/profile before execution.
- For mutation requests, present a dry-run style plan first and wait for explicit approval.

## Execution Flow

1. Clarify target account, region, and scope.
2. Run read-only checks to gather current state.
3. Summarize findings and risk.
4. If mutation is required:
   - propose exact command list
   - request explicit approval
   - execute only approved commands
