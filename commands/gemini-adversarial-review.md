---
description: Run a Gemini review that challenges the implementation approach and design choices
argument-hint: '[--wait|--background] [--base <ref>] [--scope auto|working-tree|staged|branch] [--model <pro|flash>] [focus ...]'
disable-model-invocation: true
allowed-tools: Read, Glob, Grep, Bash(node:*), Bash(git:*), AskUserQuestion
---

Run an adversarial Gemini review through the companion script.
Position it as a challenge review that questions the chosen implementation, design choices, tradeoffs, and assumptions.

Raw slash-command arguments:
`$ARGUMENTS`

Core constraint:
- This command is review-only.
- Do not fix issues, apply patches, or suggest that you are about to make changes.
- Your only job is to run the review and return Gemini's output verbatim to the user.

Execution mode rules:
- Same as `/psfn:gemini-review` — estimate size, ask foreground/background.

Foreground flow:
```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/gemini-companion.mjs" adversarial-review $ARGUMENTS
```
- Return the command stdout verbatim.
- Do not fix any issues mentioned in the review output.

Background flow:
- Launch with `Bash` in the background.
- Tell the user: "Gemini adversarial review started in the background."
