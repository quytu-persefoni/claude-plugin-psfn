---
description: Run a one-shot Gemini task (coding, research, debugging)
argument-hint: '[--model <pro|flash|lite>] [--yolo] [--json] <prompt>'
disable-model-invocation: true
allowed-tools: Bash(node:*)
---

Run a Gemini task through the companion script.

Raw slash-command arguments:
`$ARGUMENTS`

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/gemini-companion.mjs" task $ARGUMENTS
```

- Return the command stdout verbatim.
- Do not paraphrase or add commentary.
- If Gemini makes code changes, list the touched files when reported.
