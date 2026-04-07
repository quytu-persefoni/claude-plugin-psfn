# Gemini Prompt Recipes

End-to-end prompt templates for common task types. Adapt these to your specific context.

---

## Recipe 1: Diagnosis

When you need Gemini to investigate an issue without making changes.

```xml
<task>
Diagnose why {description of symptom}.
Repository: {repo_path}
Error: {error message or log snippet}
Context: {when it happens, what changed recently}
</task>

<research_mode>
Do not modify any files. Read the relevant code and trace the issue.
</research_mode>

<output_contract>
## Root Cause
{One paragraph}

## Evidence
{File paths and line numbers supporting the diagnosis}

## Confidence
{High | Medium | Low — and why}

## Recommended Fix
{What to change, without actually changing it}
</output_contract>

<grounding_rules>
- Every claim must cite a file and line
- Distinguish facts from hypotheses
</grounding_rules>
```

---

## Recipe 2: Targeted Fix

When you know the problem and want Gemini to fix it.

```xml
<task>
Fix {specific issue} in {file_path}.
The problem: {description}
Expected behavior: {what should happen}
Current behavior: {what happens now}
</task>

<safety>
- Only modify files directly related to this fix
- Do not refactor surrounding code
- Preserve existing test patterns
</safety>

<verification>
After making the fix:
1. Run `{test_command}` and confirm tests pass
2. Verify the fix handles: {edge_case_1}, {edge_case_2}
3. Check for regressions in related functionality
</verification>

<compact_output>
List the files changed and summarize what you did in under 100 words.
</compact_output>
```

---

## Recipe 3: Code Review

When you want Gemini to review a diff.

```xml
<task>
Review this code change for correctness, security, performance, and maintainability.
{optional: Focus on {specific area}.}
</task>

<diff>
{THE DIFF CONTENT}
</diff>

<output_contract>
## Summary
One paragraph overview of the changes.

## Assessment
Overall: Looks good | Needs changes | Needs discussion

## Findings
For each issue:
- **Severity**: critical | high | medium | low
- **File**: path:line_start-line_end
- **Issue**: description
- **Suggestion**: how to fix

Order by severity descending.

## Positives
What the code does well.

## Verdict
Ship it / Needs work / Needs discussion
</output_contract>

<grounding_rules>
- Only comment on code visible in the diff
- Reference exact line numbers
- Don't suggest changes unrelated to the diff
</grounding_rules>
```

---

## Recipe 4: Implementation

When you want Gemini to build something new.

```xml
<task>
Implement {feature_description}.
Repository: {repo_path}

Requirements:
1. {requirement_1}
2. {requirement_2}
3. {requirement_3}

Follow the patterns in {reference_file} as a template.
</task>

<safety>
- Follow existing code conventions
- Add tests for new functionality
- Do not modify unrelated files
</safety>

<completeness>
Done when:
1. Feature works as specified
2. Tests written and passing
3. No TypeScript/lint errors
4. All requirements met
</completeness>

<verification>
1. Run `{test_command}`
2. Manually verify {key_behavior}
3. Check edge cases: {edge_cases}
</verification>
```

---

## Recipe 5: Root-Cause Review

When you want Gemini to do a deep analysis of why something was built a certain way.

```xml
<task>
Analyze the design and implementation of {component/feature}.
Repository: {repo_path}

Questions to answer:
1. Why was it built this way?
2. What are the tradeoffs?
3. What assumptions does it depend on?
4. Where could it fail under real-world conditions?
</task>

<research_mode>
Do not modify any files.
</research_mode>

<grounding_rules>
- Cite specific files and functions for every claim
- Trace the actual execution path, don't guess
- Note where documentation conflicts with implementation
</grounding_rules>

<output_contract>
## Architecture Overview
{How it works, with file references}

## Design Decisions
{Why it's built this way — with evidence}

## Assumptions
{What must remain true for this to work}

## Risk Areas
{Where it could break, ordered by likelihood}

## Recommendations
{What to improve, if anything}
</output_contract>
```
