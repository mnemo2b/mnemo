# Research: Agent Memory

## Question

How do long-running AI agents maintain relevant state without hitting context limits? What architectures hold up?

## Dimensions

- **Scope** — session-only, cross-session, cross-user
- **Structure** — flat, hierarchical, graph
- **Retrieval** — exact, semantic, hybrid
- **Staleness** — how does memory get updated or invalidated?
- **Ownership** — who writes, who reads, consent model

## Patterns seen

- **Summarization** — compress past turns into a running summary. Simple; loses fidelity fast.
- **Vector memory** — embed and retrieve snippets. Good for semantic recall, bad for long reasoning.
- **Structured memory** — typed entries (user profile, facts, preferences). Requires schema discipline.
- **File-based memory** — markdown / JSON files the agent writes + reads. Human-inspectable.
- **Hybrid** — structured "core" (long-lived) + semantic "cache" (recent activity).

## Failure modes

- Memory drift — old notes contradict current reality
- Retrieval noise — irrelevant memories injected into context
- Over-personalization — memory encodes preferences that age badly
- Privacy accidents — memory persists data users wanted forgotten
- Loop amplification — bad memories reinforce bad behaviors

## Specific systems

- **MemGPT (Berkeley, 2023)** — tiered memory with promotion/demotion
- **LangGraph memory modules** — abstractions for short/long term
- **Letta** — MemGPT's commercial successor
- **Claude's file-based memory (mnemo-like)** — user-inspectable markdown

## Hypotheses

- File-based memory wins on durability and trust at the cost of retrieval sophistication
- Retrieval quality matters more than storage — "memory" that can't be found is noise
- Staleness management is the unsexy hard problem
- Users tolerate coarse memory if it's auditable and editable

## Followups

- How do humans maintain their own "knowledge bases"? Contrast with agent designs.
- What are the minimal ergonomics for user review of memory?
- When does memory help vs hurt on a specific eval?
