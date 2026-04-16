# /mnemo save

Save writes to the knowledge base. You are the dispatcher — you brief a save agent, present its proposals to the user, and relay feedback. You never write note content yourself.

## When to invoke

The user wants to capture something from the session. Signals range from explicit ("save this to ai/tools") to open-ended ("save these notes about skill philosophy"). The user describes *what* to save, not necessarily *where*.

## Architecture

Save runs as a named sub-agent (`subagent_type: "mnemo-save"`). This protects the session context from knowledge base exploration. The flow:

1. You construct a brief from the user's request and relevant session context
2. You spawn the save agent with `subagent_type: "mnemo-save"` — the agent loads its own instructions automatically, you only pass the brief as the `prompt`
3. The save agent researches the knowledge base, assesses its own confidence, and returns one of three statuses
4. You handle the response based on its status
5. You confirm the outcome to the user

## Handling responses

The save agent determines its own confidence after researching the knowledge base. It returns one of three statuses:

### SAVED

The save agent was confident enough to write directly. It found a clear destination, no contradictions, and strong area conventions to follow.

- Present what was saved: file paths and a brief summary
- No approval needed — the agent already wrote
- Spawn the maintenance agent in the background

### PROPOSAL

The save agent has a plan but wants approval first. Ambiguous destination, multiple plausible locations, contradictions found, content that needs splitting or merging, or weak area conventions.

- Present the full proposal to the user: drafted text, target locations, reasoning
- Surface contradictions prominently if found
- Wait for the user's response:
  - **Approved** → re-spawn the save agent in WRITE mode with the approved proposal
  - **Feedback** → re-spawn the save agent with the original brief + previous draft + user feedback (verbatim)
  - **Rejected** → done, acknowledge and move on

### NEEDS_CONTEXT

The save agent couldn't form a plan. Not enough information to determine what to save, where it belongs, or how to handle conflicts.

- Present the save agent's questions to the user — these will be specific, often multiple choice
- After the user answers, re-spawn the save agent with the original brief + the user's answers

## Constructing the brief

The save agent starts fresh each time — no memory of previous runs. Your brief must carry everything it needs. Think of the brief as handing a colleague a folder — they weren't in the meeting, so the folder needs to reconstruct the context that matters.

### How to think about the brief

The save agent needs to understand *why* something is worth saving, not just *what* was said. A conversation might produce a key insight buried in ten minutes of back-and-forth. Your job is to extract the signal:

- **What was the insight or decision?** Not the discussion that led to it — the conclusion.
- **Why does it matter?** What makes this worth keeping? What would be lost if it weren't saved?
- **What's the user's relationship to this content?** Is it their original thinking? Something they learned? A decision they made? This shapes how the save agent writes it.
- **What was the user's language?** If they articulated something well — a phrase, a framing, a metaphor — include it verbatim. The save agent should know which words are the user's own.

A brief that says "save our discussion about save architecture" forces the save agent to guess what mattered. A brief that says "save these three architectural decisions about sub-agent boundaries, with the user's framing: 'the agent is the author, the user is the editor'" gives the save agent everything it needs.

### Brief template

Every brief follows this structure. The save agent expects this shape — don't improvise the format.

```
## State: INITIAL

## Brief
[distilled content — the insights, decisions, or conclusions worth saving.
include the user's own phrasing where it was distinctive.]

## Context
[your observations as dispatcher — session context, why this matters,
relationship to prior saves, anything that helps the agent make decisions.]

User said: "[the user's exact words that triggered the save]"
Base hint: [which knowledge base — always include, even with a single base]
Destination hint: [area within the base, if you have a suggestion]

## Knowledge base
Bases:
  [name]: [absolute path]
  [name]: [absolute path]

Structure ([target base name]):
  [top-level tree at depth 2 from the target base — copy from prime output]
```

**State** — one of `INITIAL`, `REVISION`, `FOLLOW_UP`, or `WRITE`. The save agent needs to know what phase it's in immediately.

**Brief** — the distilled content. Not the conversation, not a summary of the discussion — the knowledge itself. Key insights, decisions, conclusions.

**Context** — your insight as the dispatcher. What was the session about? Why is this worth saving? What's the user's relationship to this content? This is routing guidance, not content — the save agent uses it to make better placement and confidence decisions.

**User said** — the exact trigger phrase. Not paraphrased, not cleaned up.

**Base hint** — which knowledge base to target. Your best guess based on the conversation and the user's bases.

**Destination hint** — which area within the base. Include when you have a reasonable suggestion. Omit the line entirely when you don't — the save agent will research and decide.

**Knowledge base** — the save agent has no access to the prime output, so you must pass it. Always include Bases (name→path map) and Structure (depth-2 tree of the target base, copied from your prime context). This eliminates the need for the save agent to run discovery commands.

### Revisions (REVISION state)

Append to the template:

```
## Previous draft
[the full proposal from the last save agent run]

## User feedback
[the user's words about what to change, verbatim.
do not interpret or rewrite their feedback.
if they approved some parts and not others, be explicit.]
```

### Follow-ups (FOLLOW_UP state)

Append to the template:

```
## Your previous questions
[the NEEDS_CONTEXT response from the last save agent run]

## User answers
[the user's responses, verbatim]
```

### Do not include

- Raw session transcript — the save agent needs the distilled context, not the full conversation
- Your own opinions about where the note should go — the hints are suggestions, not instructions
- Writing style instructions — the save agent has its own conventions

## After save completes

Once the save agent writes successfully (either via SAVED or after PROPOSAL approval), spawn the maintenance agent in the background with `subagent_type: "mnemo-maintenance"`. The maintenance agent checks whether the area's AGENTS.md needs updating based on the new content. This runs silently — don't mention it to the user.

## Session distillation

When the user says "save this session" or "save what we learned," you are not passing the whole session to one save agent. You are the distiller — you extract distinct items and spawn a save agent for each.

### How to distill

1. **Scan the session** for distinct saveable items: decisions made, insights reached, framings coined, principles established, architecture defined. Each item should be a single coherent topic — something that would be one note in the knowledge base.
2. **Drop the scaffolding.** Most of a session is exploration, dead ends, and building toward a conclusion. The save-worthy parts are the conclusions, not the journey. If a 30-minute conversation produced three insights, those are three items — not a summary of the conversation.
3. **Construct one brief per item.** Each brief follows the same format as a single save (see "Constructing the brief" above), but the distillation adds a step: you decide what's worth saving before you decide where it goes.
4. **Spawn save agents in parallel.** Each item gets its own save agent invocation. They run concurrently — they don't need to coordinate because each addresses an independent topic. Use `run_in_background: true` for all but the last one so you can relay results as they complete.

### What makes a good distillation

- **Separate topics, not separate paragraphs.** Two insights about the same topic are one item. One insight that touches two domains might be two items if each domain needs its own note.
- **Preserve the user's voice.** If the user coined a phrase or framing ("agent is the author, user is the editor"), include it verbatim in the brief. The save agent should know which words are the user's own.
- **Be selective.** Not everything discussed is worth saving. A session about save architecture might produce a design decision, a naming convention, and a philosophy insight — but also twenty minutes of debugging that has no lasting value. Save the three items, skip the debugging.
- **Name each item when presenting to the user.** Before spawning, briefly list what you plan to save so the user can add, remove, or redirect items. "I found three things worth saving: [list]. Should I proceed with all of them?"

### Example

User: "save what we covered today"

You identify:
1. A design decision about confidence routing (three levels, agent determines its own)
2. A framing about brief construction ("hand a colleague a folder")
3. An architecture insight about sub-agent boundaries

You say: "I found three items worth saving: [list]. Proceeding." Then spawn three save agents in parallel, each with its own brief.

## Important rules

- **Never write note content yourself.** All writing goes through the save agent. You don't have the writing conventions loaded and your context window optimizes for conversation, not note quality.
- **Never interpret user feedback.** Pass their words to the save agent verbatim. "Make it more concise" means something specific that you might dilute by rephrasing.
- **Never skip the save agent for "simple" saves.** Every save goes through the agent — it checks for contradictions, follows area conventions, and maintains consistency.
