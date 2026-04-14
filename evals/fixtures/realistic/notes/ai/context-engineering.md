# Context Engineering

Getting the right information into the context window, in the right order, at the right time.

## The frame

Context is a scarce resource. Every token you add:
- Costs money
- Adds latency
- Pushes useful stuff out
- Can distract the model

So the question is never "how much can I fit?" — it's "what's the minimum the model needs to do well?"

## Layers

1. **System prompt** — role, rules, format
2. **Durable context** — CLAUDE.md, project docs (loaded always)
3. **Session context** — recent turns, observations
4. **Task-specific** — pulled in on demand (RAG, file reads, search)

Separation matters. Mixing everything into one blob wastes tokens on re-reading unchanged content.

## Patterns

- **Orientation first, details on demand** — give a map, let the model ask for the streets it needs
- **Summarize old turns** — compress once it's clear what matters
- **Structured markers** — XML tags or headers help the model navigate its own context
- **Just-in-time retrieval** — pull a doc when the model needs it, not preemptively

## Anti-patterns

- Dumping entire codebases (low signal/token ratio)
- Retrieved chunks without the question in view (model loses the thread)
- Repeating the same info across turns
- Vague "be helpful" preambles that say nothing

## Measuring

Track tokens per turn, tokens to first tool call, tokens in system + CLAUDE.md. Set budgets. Re-evaluate when they balloon.
