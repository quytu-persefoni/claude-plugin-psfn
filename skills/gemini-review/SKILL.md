---
name: gemini-review
description: Run a code review using Google Gemini CLI against local git changes or a PR. Use when the user wants Gemini to review their code, asks for a "Gemini review", wants a second-opinion review from a different AI, or wants to cross-check Claude's work with Gemini. Also useful for adversarial reviews that challenge design choices.
user-invocable: true
---

# Gemini Code Review

Run a structured code review using Google's Gemini CLI against local git changes or a specific PR.

## When to Use

- User asks for a "Gemini review" or "review with Gemini"
- User wants a second-opinion review from a different AI model
- User wants to cross-validate Claude's own review
- User asks for an adversarial review via Gemini

## Workflow

### Step 1: Gather the diff

Determine what to review based on user input:

**Working tree changes (default):**
```bash
git diff HEAD
```

**Staged changes only:**
```bash
git diff --cached
```

**Branch comparison:**
```bash
git diff main...HEAD
```

**Specific PR:**
```bash
gh pr diff <number>
```

### Step 2: Build the review prompt

Construct a structured prompt with the diff context. The prompt should instruct Gemini to act as a code reviewer.

**Standard review prompt template:**
```
You are an expert code reviewer. Review the following git diff thoroughly.

<diff>
{DIFF_CONTENT}
</diff>

Produce a structured review with these sections:

## Summary
One paragraph overview of the changes.

## Assessment
Overall: Looks good | Needs changes | Needs discussion

## Findings
For each issue found, include:
- **Severity**: critical | high | medium | low
- **File**: file path and line numbers
- **Issue**: what's wrong
- **Suggestion**: how to fix it

Order findings by severity (critical first).

## Positives
What the code does well.

## Verdict
Final recommendation with any blocking issues called out.
```

**Adversarial review prompt template:**
For adversarial reviews, replace the system framing:
```
You are a skeptical senior engineer whose job is to challenge the implementation
approach and design choices — not just find bugs, but question whether this is
the right solution at all.

Focus on:
- Are the assumptions valid?
- What breaks under real-world load, edge cases, or maintenance?
- Is this the simplest correct approach?
- What would you do differently?
```

### Step 3: Run Gemini

```bash
cat <<'PROMPT' | gemini -m gemini-2.5-pro -o json
{review_prompt_with_diff}
PROMPT
```

Always use read-only mode for reviews (no `--yolo`). Reviews should never modify code.

### Step 4: Present results

- Extract the `response` field from the JSON output.
- Present findings ordered by severity.
- Include file paths and line numbers exactly as Gemini reports them.
- **CRITICAL**: After presenting findings, STOP. Do not auto-apply fixes. Ask the user which issues they want fixed before touching any files.

## Model Selection

- Default to `gemini-2.5-pro` for reviews — it's the strongest reasoning model.
- Use `gemini-2.5-flash` if the user asks for a faster review.

## Options

The user can specify:
- `--adversarial` or `--challenge`: Use the adversarial prompt template
- `--model <model>` or `-m <model>`: Override model selection
- `--base <ref>`: Compare against a specific base branch
- `--pr <number>`: Review a specific PR
- A focus area as free text (e.g., "focus on the auth changes")
