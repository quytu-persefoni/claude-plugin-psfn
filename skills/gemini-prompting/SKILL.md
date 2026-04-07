---
name: gemini-prompting
description: Internal guidance for composing effective prompts for Google Gemini 2.5 models when delegating coding, review, diagnosis, and research tasks from Claude Code
user-invocable: false
---

# Gemini 2.5 Prompting

Use this skill when `psfn:gemini-rescue` or other Gemini-delegating workflows need to compose prompts for the Gemini CLI.

Gemini 2.5 models are strong at code understanding, tool use, and multi-step reasoning. The key to effective delegation is giving Gemini clear structure and explicit success criteria — similar to briefing a skilled engineer who just walked into the room.

## Core Principles

1. **One task per invocation.** Gemini CLI runs one-shot. Split unrelated asks into separate runs.
2. **State the end goal explicitly.** Don't assume Gemini will infer what "done" looks like.
3. **Use XML tags for structure.** Gemini handles structured prompts well — use tags to separate concerns.
4. **Ground claims in evidence.** For review and research tasks, instruct Gemini to cite file paths and line numbers.
5. **Prefer tighter prompts over higher-cost models.** A well-structured prompt to `flash` often beats a vague prompt to `pro`.

## Prompt Recipe

Build prompts using these blocks as needed:

### `<task>` — Always required
The concrete job, relevant context, and scope boundaries.

```xml
<task>
Investigate why `processOrder()` in src/services/order.ts throws
a null reference when the cart contains a subscription item.
The error appears in production logs but not in tests.
Repository: /Users/nguyenquytu/repo/fe-advanced
</task>
```

### `<output_contract>` — What the response should look like
Define the shape, ordering, and brevity requirements.

```xml
<output_contract>
Return a structured report:
1. Root cause (one paragraph)
2. Affected code paths (file:line format)
3. Recommended fix (code diff)
4. Test to prevent regression
</output_contract>
```

### `<verification>` — For implementation and fix tasks
What Gemini should check before declaring done.

```xml
<verification>
After making changes:
1. Run `npm test -- --grep "order"` and confirm all tests pass
2. Verify the fix handles both subscription and one-time items
3. Check that no existing tests broke
</verification>
```

### `<grounding_rules>` — For review and research
Prevent hallucinated claims.

```xml
<grounding_rules>
- Only reference files that exist in the repository
- Include file paths and line numbers for every claim
- If something is an inference rather than an observed fact, say so
- Do not suggest fixes for problems you haven't verified exist
</grounding_rules>
```

### `<safety>` — For write-capable tasks
Keep edits narrow and safe.

```xml
<safety>
- Only modify files directly related to the task
- Do not refactor surrounding code
- Do not update dependencies unless required for the fix
- Preserve existing test patterns
</safety>
```

## When to Add Blocks

| Task Type | Required Blocks | Optional Blocks |
|-----------|----------------|-----------------|
| Debugging | task, verification | output_contract, safety |
| Implementation | task, verification, safety | output_contract |
| Code review | task, grounding_rules, output_contract | — |
| Research | task, grounding_rules | output_contract |
| Quick question | task | — |

## Model Selection Guide

- **gemini-2.5-pro**: Complex multi-file debugging, architecture decisions, large diffs
- **gemini-2.5-flash**: Moderate complexity tasks, focused single-file changes, fast iteration
- **gemini-2.5-flash-lite**: Simple lookups, formatting, quick questions

## Anti-Patterns

1. **Vague task framing.** "Fix the bug" → Tell Gemini which bug, where, and what the symptoms are.
2. **Missing output contract.** Without structure, Gemini returns free-form text that's harder to act on.
3. **Over-long prompts.** If you're writing a novel, you've lost the plot. Be concise and structured.
4. **Asking Gemini to "be creative" with code.** Be specific about what you want. Creativity is for humans.
5. **No verification step for edits.** Always ask Gemini to check its work when it's making changes.
6. **Mixing read and write concerns.** Don't ask Gemini to review AND fix in the same prompt. Review first, then fix separately.

See [references/prompt-blocks.md](references/prompt-blocks.md) for reusable XML blocks.
See [references/gemini-prompt-recipes.md](references/gemini-prompt-recipes.md) for end-to-end templates.
