# Evals

Testing for probabilistic systems. Not a replacement for unit tests — a complement.

## What they are

Curated sets of inputs + expected behavior, run against your system, scored. LLM evals grade outputs that aren't exact-match comparable (summaries, explanations, decisions).

## Why you need them

- Regressions sneak in with prompt changes, model upgrades, dependency swaps
- Unit tests catch logic; evals catch quality
- Without evals, "better" is vibes

## Grading strategies

- **String match** — when output has a canonical form
- **Structural** — JSON schema validation, tool call sequences
- **Regex/contains** — softer version of string match
- **LLM-as-judge** — another model grades. Reliable for most production use cases; agreement rates with humans sit in the 80s. Cheaper than human grading and scales easily.
- **Human grading** — expensive, the gold standard for subjective work

## Dimensions

- **Correctness** — did it do the right thing?
- **Cost** — how many tokens, dollars?
- **Latency** — how long did it take?
- **Failure mode analysis** — when it fails, why?

## Tools

- **Promptfoo** — YAML configs, many graders, CI-friendly
- **Braintrust** — hosted, UI for reviewing runs
- **LangSmith** — LangChain's offering
- Custom scripts — always an option

## What I wish I did sooner

Start with 10 good cases, not 100 mediocre ones. Grow coverage as real failures accumulate — that's what discriminates good evals from busywork.
