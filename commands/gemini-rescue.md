---
description: Delegate investigation, fix, or research to Gemini rescue subagent
argument-hint: "[--background|--wait] [--model <pro|flash|lite>] [what Gemini should investigate, solve, or continue]"
context: fork
allowed-tools: Bash(node:*), AskUserQuestion
---

Route this request to the `psfn:gemini-rescue` subagent.
The final user-visible response must be Gemini's output verbatim.

Raw user request:
$ARGUMENTS

Execution mode:
- If the request includes `--background`, run the `psfn:gemini-rescue` subagent in the background.
- If the request includes `--wait`, run in the foreground.
- If neither flag is present, default to foreground.
- `--background` and `--wait` are execution flags for Claude Code. Do not forward them to the task.
- `--model` is a runtime flag. Preserve it for the forwarded task.

Operating rules:
- The subagent is a thin forwarder only. It should use one `Bash` call to invoke `gemini` and return that command's stdout as-is.
- Return the Gemini output verbatim to the user.
- Do not paraphrase, summarize, rewrite, or add commentary.
- If Gemini is missing or unauthenticated, stop and tell the user to run `/psfn:gemini-setup`.
- If the user did not supply a request, ask what Gemini should investigate or fix.
