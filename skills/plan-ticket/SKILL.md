---
name: plan-ticket
description: >
  Read a Jira ticket, explore related repos for existing patterns, and produce an execution plan.
  Use this skill when the user says "plan ticket", "plan JIRA", "plan ADV-xxxx",
  or provides a Jira ticket ID and asks to explore/plan the implementation.
  Accepts arguments: <JIRA-ID> [repo1, repo2, ...] where repos are optional directories
  under the working directory to explore for context.
---

# Plan Ticket

## Input

The user provides:
- **JIRA-ID** (required) — e.g. `ADV-4966`
- **Repos** (optional) — comma-separated list of repo directory names to explore (e.g. `data-apis, data-finserv, data-catalogs`). These are directories under `/Users/nguyenquytu/repo/`.

## Step 1: Fetch the Jira Ticket

```bash
acli jira workitem view {JIRA-ID} --fields '*all' --json
```

Extract and summarize:
- **Title & type** (story, bug, task)
- **Description** — requirements, scope, acceptance criteria
- **Parent epic** — for broader context
- **Linked issues** — blockers, related work
- **Status & priority**

If the ticket references other tickets, fetch those too for context.

## Step 2: Determine Repos & Search Terms

From the ticket description, extract:
- **Entity names** — domain objects, models, services mentioned
- **Feature keywords** — what the ticket asks to build/change
- **Service references** — API names, service names, proto packages

If the user didn't specify repos, infer them from the ticket (look for repo/service names in the description, linked PRs, or epic context).

Validate that each repo exists at `/Users/nguyenquytu/repo/{repo_name}`.

## Step 3: Spawn the Plan-Ticket Agent

Launch a **single general-purpose Agent** with the plan-ticket agent prompt from `~/.claude/agents/plan-ticket/agent.md`.

Pass to the agent:
1. The full ticket context from Step 1
2. The list of repo paths
3. The extracted search terms

The agent will:
- Spawn parallel Explore agents across repos
- Synthesize findings
- Enter plan mode and produce the execution plan
- Exit plan mode for your approval

### Agent Prompt

```
You are the plan-ticket agent. You are the plan-ticket agent. Follow the instructions below.

## Ticket Context
{paste the full ticket summary from Step 1}

## Repos to Explore
{list of /Users/nguyenquytu/repo/{repo_name} paths}

## Search Terms
{extracted entity names, feature keywords, service references}

Begin with PHASE 1 — launch parallel Explore agents for each repo.
```

## Step 4: Review Agent Output

When the agent returns with the plan:
- Present it to the user
- Ask if they want to adjust scope, add repos, or clarify open questions
- Do NOT start implementing without explicit approval

## Important Notes

- Use **`acli`** for all Jira operations — never use MCP Atlassian tools.
- Repos are located at `/Users/nguyenquytu/repo/{repo_name}`.
- The agent handles all exploration and planning — don't duplicate that work in the skill.
- If the agent reports open questions, surface them prominently to the user.
