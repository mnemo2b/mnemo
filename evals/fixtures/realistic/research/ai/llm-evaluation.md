# Research: LLM Evaluation

## Question

What actually discriminates a good evaluation suite from a bad one? Where does the effort go?

## Notes from papers / posts

- **"HELM" (Stanford CRFM, 2022)** — multi-dimensional framework: accuracy, robustness, fairness, bias, toxicity, efficiency. Useful as a checklist, not a benchmark.
- **"Holistic Evaluation" critiques** — standardized benchmarks overfit, don't generalize. Task-specific matters more.
- **LMSYS Chatbot Arena** — pairwise human preference, Bradley-Terry ranking. Coarse but hard to game.
- **"LLM-as-a-judge" papers** — GPT-4 correlates with human judgment ~80% on preference tasks, drifts under adversarial conditions.

## Practitioner patterns

From various company engineering blogs:

- Curate 50-200 real examples. No one benchmarks at scale until there's signal.
- Start with binary graders (correct/incorrect), add scalar scores later.
- Reserve LLM-as-judge for subjective quality; use deterministic graders where possible.
- Regressions > absolute scores. Track deltas on a fixed set across model versions.
- Production logs → eval cases — the only way to stay aligned with reality.

## Open questions

- How to measure "agentic" task success without clean ground truth?
- When does model self-grading systematically mislead?
- What's the minimal viable eval suite for a new product?
- How to weight cost, latency, quality — the actual tradeoff product-side?

## Sources

- HELM: [https://crfm.stanford.edu/helm]
- LMSYS: [https://chat.lmsys.org]
- Braintrust blog
- Promptfoo docs
- Anthropic's eval posts
- Hamel Husain's "Your AI Product Needs Evals"
