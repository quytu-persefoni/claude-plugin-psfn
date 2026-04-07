---
description: Check whether the local Gemini CLI is ready and authenticated
argument-hint: '[--json]'
allowed-tools: Bash(node:*), Bash(gemini:*), AskUserQuestion
---

Run:

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/gemini-companion.mjs" setup --json $ARGUMENTS
```

If the result says Gemini is unavailable and npm is available:
- Use `AskUserQuestion` exactly once to ask whether Claude should install Gemini CLI now.
- Put the install option first and suffix it with `(Recommended)`.
- Use these two options:
  - `Install Gemini CLI (Recommended)`
  - `Skip for now`
- If the user chooses install, run:

```bash
npm install -g @anthropic-ai/gemini-cli
```

- Then rerun:

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/gemini-companion.mjs" setup --json $ARGUMENTS
```

If Gemini is already installed but not authenticated:
- Tell the user to run `!gemini` and follow the OAuth flow.

Output rules:
- Present the final setup output to the user.
- If installation was skipped, present the original setup output.
