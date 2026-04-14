# Research: Prompt Injection

## Question

How do agent systems harden against injected instructions in retrieved content, tool outputs, or user-supplied text?

## Categories

- **Direct injection** — attacker input contains "ignore previous instructions"
- **Indirect injection** — content (webpage, file, email) passed to the model contains malicious instructions
- **Jailbreak** — bypassing system prompt safety via roleplay, encoding, cleverness
- **Data exfiltration** — trick the model into leaking system prompts or tools

## Mitigations (survey)

- **Separate channels** — system prompt, user, tool output, retrieved content all tagged clearly. Models trained to respect hierarchy.
- **Sanitization** — strip suspicious patterns before passing to model. Fragile.
- **Tool-level authorization** — dangerous tools require explicit user approval, not LLM-gated
- **Output validation** — check model responses against schemas / rules before action
- **Constitutional training** — RLHF / RLAIF with injection-resistance examples
- **Sandboxing** — agents run in isolated envs, can't exfiltrate by default

## Hard truths

- You can't fully prevent injection with prompting alone
- "Ignore previous instructions" doesn't work on modern models, but elaborated variants sometimes do
- Tool + permission design is the real defense, not prompt engineering

## Anthropic-specific

- Claude's trained to notice hierarchy (system > user > tool > retrieved)
- Still imperfect; trust tool output for behavior only within its intended scope
- XML tagging helps the model understand what's what

## Papers / posts

- Simon Willison's prompt injection posts (ongoing)
- NVIDIA NeMo Guardrails
- OWASP LLM Top 10
- "Universal Adversarial Triggers" line of research

## Practical implications for mnemo

- Knowledge base content is user-authored, so risk is about accidental injection from imported sources (RSS, clipboard, URLs)
- Display retrieved content to user, don't auto-act on instructions embedded in notes
- Treat skill content as privileged; treat user notes as semi-trusted
