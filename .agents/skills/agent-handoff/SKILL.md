---
name: agent-handoff
description: Produces a complete, self-sufficient handoff when work must continue in a different agent context — a fresh session after context compaction, a subagent dispatched for a sub-task, a different tool/model picking up the work, or an explicit pause. Trigger when the conversation is approaching a context limit, before spawning a subagent to do part of the work, when the user asks to "write a handoff", "summarize where we're at", "prep this for a new session/chat", or "continue this later", and whenever a task is left incomplete at the end of a turn and will not be finished by the same agent in the same context. Do NOT trigger for routine status updates within the same ongoing session, or when the task is being completed in full within the current turn.
---

# Agent Handoff

Act as the agent that will never speak to the user about this task again — the entire burden of continuity falls on the document you write, not on anything you remember. Write for a reader with zero conversation history: another agent instance, a subagent, or yourself after a full context reset.

## Why This Skill Exists

A handoff that only restates *what* was done is not enough — the receiving agent will re-derive the *why* by guessing, and guesses about intent are where continuity actually breaks. A dropped constraint, an unstated rejected alternative, or an assumption that was never written down gets silently re-decided, often differently, and the task drifts without anyone noticing until much later. The goal of this skill is to make the receiving agent's first action a correct one, not a rediscovery process.

## Work Style

- Write as if the receiving agent has read nothing else — no shared memory, no access to this conversation, only the document.
- Separate fact from inference: what was verified (tests passed, output observed) vs. what was assumed (not yet checked, believed true but unconfirmed).
- Prefer specificity over summary. "Fixed the auth bug" is not a handoff; "the token refresh race condition was in `refreshToken()` — the fix adds a mutex around the refresh call, see the diff in step 3" is.
- Include what was tried and rejected, and why, whenever a rejected approach could plausibly be re-attempted by someone without that context.
- Keep the handoff proportional to what is genuinely needed to continue — padding it with settled, unambiguous context wastes the receiving agent's context budget as much as omitting something does.

## Non-Negotiable Blockers

- Do not write a handoff that omits the exact next step. "Continue implementing the feature" is not a next step; "implement block 3 of the plan below: the endpoint tests" is.
- Do not describe the current state as more finished or more verified than it actually is. A handoff that overstates progress causes the receiving agent to skip verification it should do.
- Do not hand off a broken or partially-applied state without explicitly flagging it as broken and describing exactly what is inconsistent.
- Do not omit constraints, requirements, or rejected approaches that the user stated explicitly during the session — losing these is the single most common way a handoff causes rework.
- If you do not know why a past decision was made (e.g., inherited from an earlier handoff with no rationale recorded), say so explicitly rather than inventing a plausible-sounding justification.
- Do not deliver the handoff only as chat output. It must be written to disk as a file the programmer can find without scrolling back through the conversation — see Where to Save It.

## Execute the Task

1. Identify the handoff type: context-limit handoff, subagent dispatch, pause/resume, or agent/tool switch — the required detail level differs (see Handoff Types below).
2. Reconstruct the task's current state: what the original goal was, what has been done, what has been verified, what remains.
3. Extract constraints and decisions actually stated by the user or established during the session — do not include ones you are inferring for the first time while writing the handoff.
4. Identify open questions or ambiguities the next agent will hit, and anything you deliberately left unresolved.
5. Write the handoff using the structure in Output Format.
6. State the single next action explicitly — the first thing the receiving agent should do, not a list of eventual future steps.
7. Save the handoff to disk per Where to Save It. A handoff that only exists in the chat response has not been delivered.

## Handoff Types

- **Context-limit handoff**: the fullest form. Assume the receiving agent (likely a fresh instance of yourself) has none of this conversation. Include full state, all decisions with rationale, and the complete remaining plan.
- **Subagent dispatch**: scope tightly to the subagent's task. Include only the constraints and context relevant to that sub-task, plus how its output will be consumed by the parent task — do not hand off the entire project history for a narrowly-scoped sub-task.
- **Pause/resume**: lighter weight if the same agent and user will resume soon, but still write it down rather than relying on memory — "soon" often is not.
- **Agent/tool switch**: include any tool-specific or environment-specific context the new agent will need (file paths, commands used, environment quirks) that a same-tool handoff could have omitted.

## Output Format

Use this structure, omitting sections that are empty rather than filling them with "N/A":

```markdown
## Goal
What this task is trying to accomplish, in one or two sentences.

## State
What has been done. Distinguish verified from unverified explicitly.

## Decisions
Design or approach decisions made, with the reasoning — especially anything
non-obvious or any rejected alternative worth not re-trying.

## Constraints
Requirements or limits the user stated explicitly that still apply.

## Open Questions
Anything ambiguous or unresolved that the next agent will need to address.

## Next Step
The single, concrete next action. Not a list of eventual steps — the one
thing to do first.

## Remaining Plan
(If applicable) The rest of the plan beyond the next step, at the same
level of granularity it was already broken into.
```

## Where to Save It

- Write the handoff to `HANDOFF.md` at the project root — a file name and location the programmer will find without being told where to look, independent of which agent or tool wrote it.
- Overwrite the existing `HANDOFF.md` by default; a stale handoff sitting next to a current one is a hazard, since a future agent (or the programmer) may read the wrong one.
- Exception — subagent dispatch: do not write to the project's `HANDOFF.md`. A subagent's handoff is scoped to the parent task and belongs in the parent's context or return value, not in a file that competes with the project-level handoff.
- If the task explicitly calls for preserving handoff history (e.g., the user asks to keep a log across multiple pauses), append a dated section to `HANDOFF.md` instead of overwriting — but do not do this by default.
- After writing the file, say so plainly in the chat response ("Handoff written to `HANDOFF.md`") — do not also paste the full handoff content into the chat response as well; that defeats the point of having a single file to check.

## Trigger Examples

- "We're running low on context, write a handoff before we lose this"
- "Summarize where we're at so I can start a new chat"
- "Prep this for the subagent that's going to implement block 2"
- "I need to step away — write up the state so I can pick this up tomorrow"
- "Hand this off to the next agent, I'm switching tools"
- "Package the context for a fresh Claude Code session"