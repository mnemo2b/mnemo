# Research: Model Families

## Question

What's the practical shape of the major model families circa 2026? Where does each strength apply?

## Families

### Anthropic (Claude)

- Latest: Claude Opus 4.6, Sonnet 4.6, Haiku 4.5
- Strengths: coding, long context reasoning, tool use, following nuanced instructions
- Weaknesses: slower than Haiku equivalents, occasional over-safety on benign requests
- Coding harness: Claude Code (CLI, skills, MCP)

### OpenAI (GPT / o-series)

- GPT-5 family, o-series reasoning models
- Strengths: UX maturity, multi-modal, ecosystem breadth
- Weaknesses: tool use less predictable than Claude, closed on architecture details

### Google (Gemini)

- Gemini 2 Pro, Flash, Ultra
- Strengths: massive context windows, native multi-modal, deep Google product integration
- Weaknesses: tool use reliability varies, less community tooling

### Open weights

- Llama (Meta), Mistral, DeepSeek, Qwen
- Strengths: self-hostable, cost control, fine-tunable
- Weaknesses: capability gap vs frontier, infra overhead, usually need vLLM or similar

## Selection heuristics

- **Coding agents** — Claude
- **Consumer chat / UI breadth** — GPT / Gemini
- **Massive context (1M+ tokens)** — Gemini
- **On-prem / regulated** — open weights
- **Cheap bulk inference** — Haiku, Flash, DeepSeek

## What's commoditizing

- Basic text tasks (summarization, drafting, Q&A) — all frontier models are fine
- Function calling / tool use — converging but still varies
- Evaluation (HumanEval, MMLU, etc.) — saturated, no longer discriminative

## What's differentiating

- Agentic reliability (multi-step, tool-heavy, long-horizon)
- Coding capability, especially complex codebases
- Long-context coherence at 100k+ tokens
- Price-performance on bulk / background use cases
