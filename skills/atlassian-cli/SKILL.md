---
name: atlassian-cli
description: >
  Route all Atlassian (Jira and Confluence) operations through the `acli` CLI tool instead of the
  Atlassian MCP server. This skill MUST trigger whenever the user mentions Jira, Confluence, tickets,
  sprints, boards, work items, Atlassian, or any related concept — even if they don't explicitly say
  "acli". It also triggers when other skills (like create-pr or plan-ticket) need to interact with
  Jira or Confluence. The only exception is Confluence operations that acli cannot handle (creating,
  editing, or searching pages/spaces) — for those, fall back to the Atlassian MCP.
---

# Atlassian CLI — Prefer `acli` Over MCP

The `acli` CLI is the preferred tool for all Atlassian operations. It's faster, doesn't require OAuth setup, and is already authenticated. Only fall back to the Atlassian MCP (`mcp__atlassian__*` tools) when `acli` genuinely can't do what's needed.

## When to use `acli` (always, unless listed in the MCP section below)

### Jira — Full Coverage

`acli` handles virtually everything in Jira:

| Operation | Command |
|---|---|
| View a ticket | `acli jira workitem view KEY-123` |
| View with specific fields | `acli jira workitem view KEY-123 --fields summary,status,description` |
| View all fields | `acli jira workitem view KEY-123 --fields '*all'` |
| View as JSON | `acli jira workitem view KEY-123 --json` |
| Search with JQL | `acli jira workitem search --jql "project = ADV AND status = 'In Progress'"` |
| Search with limit | `acli jira workitem search --jql "..." --limit 20` |
| Search as CSV | `acli jira workitem search --jql "..." --csv` |
| Count results | `acli jira workitem search --jql "..." --count` |
| Create a ticket | `acli jira workitem create --project ADV --type Task --summary "..." --description "..."` |
| Edit a ticket | `acli jira workitem edit --key KEY-123 --summary "new title"` |
| Transition status | `acli jira workitem transition --key KEY-123 --status "Dev Review" --yes` |
| Assign a ticket | `acli jira workitem assign --key KEY-123 --assignee "user@email.com"` |
| Add a comment | `acli jira workitem comment add --key KEY-123 --body "comment text"` |
| View comments | `acli jira workitem comment list --key KEY-123` |
| Link work items | `acli jira workitem link add --inward KEY-1 --outward KEY-2 --type "blocks"` |
| Clone a ticket | `acli jira workitem clone KEY-123` |
| Delete a ticket | `acli jira workitem delete KEY-123` |
| Archive/unarchive | `acli jira workitem archive KEY-123` / `unarchive` |
| Manage attachments | `acli jira workitem attachment add --key KEY-123 --file path/to/file` |
| Manage watchers | `acli jira workitem watcher add --key KEY-123 --watcher "user@email.com"` |
| View a sprint | `acli jira sprint view --id 123` |
| List sprint items | `acli jira sprint list-workitems --id 123` |
| Create a sprint | `acli jira sprint create --board-id 1 --name "Sprint 5"` |
| List boards | `acli jira board search` |
| Board sprints | `acli jira board list-sprints --board-id 1` |
| List projects | `acli jira board list-projects` |
| View fields | `acli jira field list` |
| View filters | `acli jira filter list` |

Always add `--yes` to skip confirmation prompts when running non-interactively (e.g., transitions, deletes).

Use `--json` when you need to parse the output programmatically.

### Confluence — Read Only

| Operation | Command |
|---|---|
| View a page | `acli confluence page view --page-id 12345` |
| View a space | `acli confluence space list` (if available) |
| View a blog | `acli confluence blog list` (if available) |

## When to fall back to Atlassian MCP

Only use `mcp__atlassian__*` tools for Confluence operations that `acli` cannot perform:

- **Creating** Confluence pages or blog posts
- **Editing/updating** Confluence page content
- **Searching** Confluence content (full-text search across spaces)
- **Deleting** Confluence pages
- **Managing** Confluence spaces (create, update, delete)
- **Managing** Confluence page permissions

If the MCP is not yet authenticated when you need it for one of these, call `mcp__atlassian__authenticate` and guide the user through OAuth. But exhaust `acli` options first — if you're just reading a page, use `acli confluence page view`.

## Important rules

1. **Never** call `mcp__atlassian__authenticate` or any `mcp__atlassian__*` tool for Jira operations. `acli` covers 100% of Jira needs.
2. **Never** suggest the user "set up the Atlassian MCP" for tasks that `acli` handles.
3. When other skills (like `psfn:create-pr` or `psfn:plan-ticket`) need Jira data, they should use `acli` commands — not MCP tools.
4. If an `acli` command fails, check `acli auth status` to verify authentication, then retry. Don't immediately fall back to MCP.
5. For bulk operations, prefer `acli` with `--paginate` or `--limit` flags over making multiple MCP calls.
