---
name: gemini-task
description: Delegate coding tasks, debugging, research, or implementation work to Google Gemini CLI. Use this skill when Claude Code is stuck, wants a second opinion, needs a deeper investigation, or should hand off a substantial task to Gemini. Trigger when the user mentions Gemini, asks to "use Gemini", "ask Gemini", "send to Gemini", or wants an alternative AI perspective on a coding problem.
user-invocable: false
---

# Gemini Task Delegation

Use this skill inside the `psfn:gemini-rescue` subagent to delegate tasks to Google's Gemini CLI.

## How It Works

The Gemini CLI (`gemini`) runs as a one-shot subprocess. You give it a prompt, it executes with full tool access (file reading, code execution, shell commands), and returns the result.

## Primary Command

```bash
gemini "<prompt>" -m <model> -o json --yolo
```

Key flags:
- `-m <model>`: Model selection (default: `gemini-2.5-pro`)
- `-o json`: Structured JSON output with response + token stats
- `--yolo`: Auto-approve all tool use (file edits, shell commands) — needed for write-capable tasks
- `-s` / `--sandbox`: Run in sandboxed mode for safer execution
- `--approval-mode default`: Prompt for approval on each tool use (safer alternative to --yolo)

## Model Selection

| Alias    | Model ID                  | Use Case                          |
|----------|---------------------------|-----------------------------------|
| `pro`    | `gemini-2.5-pro`          | Complex reasoning, large codebases |
| `flash`  | `gemini-2.5-flash`        | Fast tasks, moderate complexity    |
| `lite`   | `gemini-2.5-flash-lite`   | Quick lookups, simple questions    |

Default to `gemini-2.5-pro` unless the user asks for speed or specifies another model.

## Execution Rules

- Use exactly one `Bash` call to invoke `gemini`.
- The rescue subagent is a forwarder, not an orchestrator — invoke Gemini once and return stdout unchanged.
- You may use the `gemini-prompting` skill to tighten the user's request into a better Gemini prompt before forwarding.
- Do not inspect the repository, solve the task yourself, or add independent analysis.
- Default to `--yolo` for write-capable tasks unless the user explicitly asks for read-only or safe mode.
- For read-only tasks (diagnosis, research, review), use `--approval-mode default` or omit `--yolo`.
- Pipe complex prompts via stdin when they exceed shell quoting limits.

## Command Patterns

**Simple task:**
```bash
gemini "Fix the type error in src/utils/parser.ts" -m gemini-2.5-pro -o json --yolo
```

**Complex prompt via stdin:**
```bash
cat <<'PROMPT' | gemini -m gemini-2.5-pro -o json --yolo
<task>
Investigate why the API endpoint /users/search returns 500 errors
when the query string contains unicode characters.
</task>
<verification>
Write a test that reproduces the issue, then fix it.
Run the test suite to confirm the fix.
</verification>
PROMPT
```

**Read-only investigation:**
```bash
gemini "Explain the authentication flow in this codebase. Trace from login to token refresh." -m gemini-2.5-pro -o json
```

## Output Handling

JSON output has this shape:
```json
{
  "response": "The actual text response from Gemini",
  "stats": {
    "models": { ... },
    "tools": { ... }
  }
}
```

Extract and return the `response` field as the primary output. Include token stats only if the user asked for them.

## Safety

- Default to write-capable (`--yolo`) only when the task involves making changes.
- For review, diagnosis, or research tasks, omit `--yolo`.
- Do not run Gemini with `--yolo` on production systems or shared infrastructure.
- Preserve the user's task text as-is apart from prompt engineering improvements.
