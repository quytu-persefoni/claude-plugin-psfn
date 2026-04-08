---
name: create-pr
description: >
  Create a GitHub PR with auto-filled description and transition the Jira ticket to Dev Review.
  Use this skill when the user says "create PR", "open PR", "submit PR", "make a PR",
  or any variation of requesting a pull request in the fe-advanced repo.
  This skill handles the full workflow: analyzing the diff, filling out the PR template,
  creating the PR via gh CLI, and updating Jira status via acli.
  Trigger even if the user doesn't mention Jira — the Jira transition is automatic.
---

# Create PR + Jira Transition

This skill automates two things: creating a well-described GitHub PR and transitioning the associated Jira ticket to "Dev Review". It is designed for the `Persefoni-AI/fe-advanced` repository.

## Repo Guard

Before doing anything, confirm you are in a git repo whose origin contains `fe-advanced`. If not, tell the user this skill is scoped to fe-advanced and stop.

## Step 1: Extract context from the branch

Branch names follow the pattern `{type}/{username}/{JIRA-ID}` (e.g. `feat/tunguyen/ADV-4990`).

Parse out:
- **type** — `feat`, `fix`, etc.
- **username** — the developer's username
- **JIRA-ID** — the Jira ticket key (e.g. `ADV-4990`)

If the branch doesn't match this pattern, ask the user for the Jira ticket ID.

## Step 2: Determine the base branch

Default base branch is `main`. If the user specifies a different base (e.g. "create PR against develop"), use that instead.

## Step 3: Analyze the changes

Gather information to fill the PR template. Run these in parallel:

```bash
git log main..HEAD --oneline
git diff main...HEAD --stat
git diff main...HEAD
```

(Replace `main` with the actual base branch if different.)

Read the diff carefully. Understand:
- What files changed and why
- The intent behind the changes (new feature, bug fix, refactor, etc.)
- Any notable implementation details

## Step 4: Fill the PR template

The repo's PR template lives at `.github/pull_request_template.md`. Use it as the structure.

Delegate the PR description writing to `/psfn:gemini-task` with a prompt that includes:
- The full diff output from Step 3
- The PR template structure
- The Jira ID and branch context from Step 1
- Instructions to fill each section of the template as described below

The Gemini task prompt should instruct it to fill these sections:

### Describe your changes
Write a clear, concise summary of what the PR does and why. Base this on the actual diff — not just commit messages. Use bullet points for multiple changes. Be specific (e.g. "Add Organization column to JP Statutory Report table" not "Update report").

### Jira tickets
Link to the Jira ticket: `https://persefoni.atlassian.net/browse/{JIRA-ID}`

### Steps to reproduce / test
Write concrete steps to verify the changes work. Think about:
- What page/feature to navigate to
- What actions to perform
- What the expected result is

If the changes are purely internal (refactor, config), write "N/A — internal change, covered by existing tests" or similar.

### Screenshots
Write "N/A" unless the user provides screenshots or the changes are purely visual and you can describe what changed.

### Checklist before requesting a review
Mark all items as checked (`[x]`) — the developer has presumably done these. The checklist is:
- [x] I have performed a self-review of my code
- [x] I have commented my code, particularly in hard-to-understand areas
- [x] I have made corresponding changes to the documentation
- [x] Changes to Unit Tests follow the team conventions

### Manual Preview Build Commands
Include the preview commands table exactly as-is from the template — do not modify it.

Use the Gemini output as the PR body. Review it briefly for accuracy against the diff before proceeding.

## Step 5: Ask to review before creating

Before creating the PR, ask the user: **"Want me to review the changes before creating the PR?"**

- If **yes** — invoke `/codex:adversarial-review --wait` to run a Codex adversarial review that challenges the implementation approach and design choices. This is more thorough than a standard review — it questions tradeoffs, assumptions, and where the design could fail. Present the review output verbatim. After the review, ask the user if they want to proceed with creating the PR or address the review findings first.
- If **no** (or "just create it", "go ahead", etc.) — proceed directly to Step 6.

## Step 6: Create the PR

Show the user the PR title and filled body, and ask for confirmation.

Construct the PR title following the repo convention observed in commit history:
- `feat(scope): description` for features
- `fix(scope): description` for fixes

The scope should be derived from the primary area of change (e.g. `report`, `auth`, `reporting`). Include the Jira ID if the team convention includes it (check recent PRs).

Use `gh pr create`:

```bash
gh pr create \
  --base {base_branch} \
  --title "{title}" \
  --body "$(cat <<'EOF'
{filled template}
EOF
)"
```

## Step 7: Transition the Jira ticket

After the PR is successfully created, transition the Jira ticket to "Dev Review":

```bash
acli jira workitem transition --key "{JIRA-ID}" --status "Dev Review" --yes
```

The `--yes` flag skips the confirmation prompt.

If the transition fails (e.g. invalid status name, ticket not found), report the error to the user but don't fail the whole workflow — the PR was already created successfully.

## Step 8: Report

Print a summary:
- PR URL (clickable)
- Jira ticket link
- Jira transition status (success or error)

## Important notes

- Use `gh` CLI for GitHub operations, `acli` CLI for Jira. Do NOT use MCP tools for either.
- If there are uncommitted changes, warn the user before proceeding — they probably want to commit first.
- If the branch has no commits ahead of base, warn the user that the PR would be empty.
