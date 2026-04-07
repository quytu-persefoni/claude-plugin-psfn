---
description: Show active and recent Gemini jobs for this repository
argument-hint: '[--all] [--json]'
disable-model-invocation: true
allowed-tools: Bash(node:*)
---

!`node "${CLAUDE_PLUGIN_ROOT}/scripts/gemini-companion.mjs" status $ARGUMENTS`

Render the command output as a Markdown table. Keep it compact.
