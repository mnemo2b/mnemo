# Agent Design

Principles for building LLM agents that do work rather than hallucinate work.

## The loop

1. Receive goal
2. Observe state (tool calls: search, read)
3. Plan next action
4. Take action (tool call: edit, run, send)
5. Observe result
6. Loop until done or stuck

The quality of each step determines overall quality. Weak observation → weak plans.

## Scope

- **Narrow is easier than general** — a bug-fixer beats an "AI developer"
- **Tools are the API** — every tool you add expands the capability surface and the failure surface
- **Deterministic where possible** — don't ask the LLM to format dates

## Context

- Prime with the minimum viable context to route well, not the maximum
- Lazy-load details when needed
- Compress old turns, preserve anchors (the original goal)

## Failure modes

- **Happy-path coverage** — the demo works, real use doesn't
- **Runaway tool calls** — no budget, hits limits
- **Confident wrong actions** — destructive tools without confirmation
- **Forgetting the goal** — long sessions drift

## Mitigations

- Token/cost/step budgets as hard limits
- Confirmation for destructive actions (delete, push, send)
- Self-evaluation pass before "done"
- Re-inject the goal at intervals
