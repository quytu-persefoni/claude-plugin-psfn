# Reusable Prompt Blocks for Gemini

Copy-paste these XML blocks into your Gemini prompts. Mix and match based on task type.

## Task Block

```xml
<task>
{Describe the concrete job. Include:
- What needs to happen
- Where in the codebase (repo path, file names)
- Any error messages or symptoms
- Scope boundaries (what NOT to touch)}
</task>
```

## Output Contract — Structured

```xml
<output_contract>
Return your response in this exact format:

## Summary
{One paragraph overview}

## Findings
{Numbered list, each with: severity, file:line, description, recommendation}

## Next Steps
{Actionable items for the developer}
</output_contract>
```

## Output Contract — Compact

```xml
<compact_output>
Answer in under 200 words. Lead with the conclusion.
If you made code changes, list touched files.
</compact_output>
```

## Verification Loop

```xml
<verification>
Before finalizing:
1. Run the relevant test suite
2. Confirm no regressions
3. Verify the fix addresses the root cause, not just symptoms
4. Check edge cases: empty input, null values, concurrent access
</verification>
```

## Grounding Rules

```xml
<grounding_rules>
- Every claim must reference a specific file and line number
- Distinguish observed facts from inferences
- If you're uncertain, say "I suspect..." rather than stating as fact
- Do not reference files or functions that don't exist
</grounding_rules>
```

## Safety Constraints

```xml
<safety>
- Only modify files directly related to the task
- Do not refactor unrelated code
- Do not change package versions unless required
- Preserve existing patterns and conventions
- If the change seems risky, explain why before making it
</safety>
```

## Follow-Through Policy

```xml
<follow_through>
- If you encounter a missing dependency, install it and continue
- If a test fails after your change, investigate and fix it
- If you need context from another file, read it — don't guess
- Stop and report if you discover the problem is in a different repo
</follow_through>
```

## Research Mode

```xml
<research_mode>
This is a read-only research task. Do not modify any files.
- Read relevant source files to answer the question
- Trace execution paths through the codebase
- Document your findings with file:line references
- List any assumptions or unknowns at the end
</research_mode>
```

## Completeness Contract

```xml
<completeness>
The task is not done until:
1. All specified changes are implemented
2. Tests pass (run them, don't assume)
3. No TypeScript/lint errors introduced
4. Changed files are listed in your response
</completeness>
```
