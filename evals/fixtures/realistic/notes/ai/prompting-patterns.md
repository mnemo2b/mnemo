# Prompting Patterns

Techniques that move the needle for me. Not dogma — test against your task.

## Structure

- **Role + task + constraints + format** — set the frame explicitly
- **Delimiters** — XML tags (`<context>`, `<task>`) keep sections distinct
- **Examples** — 2-3 good ones beat 10 mediocre

## Reasoning

- **Chain of thought** — "think step by step" for arithmetic, logic, planning
- **Scratchpad before answer** — let the model work in a `<scratch>` block, then answer
- **Self-critique** — ask the model to review and fix its own output

## Decomposition

- **Break into subtasks** — outline → draft sections → revise
- **One job per prompt** — multi-step prompts get sloppy
- **Aggregate** — run parallel calls, merge results

## Failure modes

- **Hallucinated facts** — ground in retrieved context, cite sources
- **Confident wrong answers** — ask for confidence, alternatives, disagreements
- **Anchoring on your framing** — present the question neutrally

## What doesn't work

- Jailbreak prefixes like "ignore previous instructions" — modern models ignore
- "Step by step" for tasks that don't need reasoning (direct Q&A)
- Long lists of rules — models satisfy 3-4 and drop the rest
