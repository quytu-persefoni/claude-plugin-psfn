# psfn

A Claude Code plugin for Persefoni workflow automation — PR creation with Jira integration, code review, ticket planning, and Gemini CLI delegation.

## Installation

```
/plugin install github:quytu-persefoni/claude-plugin-psfn
```

Then reload plugins:

```
/reload-plugins
```

### Prerequisites

- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) CLI
- [GitHub CLI](https://cli.github.com/) (`gh`) — for PR creation and review skills
- [Gemini CLI](https://github.com/google-gemini/gemini-cli) — for Gemini delegation skills (optional)

To set up Gemini CLI after installing the plugin:

```
/psfn:gemini-setup
```

## Skills

| Skill | Description | Trigger |
|-------|-------------|---------|
| **create-pr** | Create a GitHub PR with auto-filled description and transition the Jira ticket to Dev Review | `/psfn:create-pr` |
| **plan-ticket** | Read a Jira ticket, explore repos for patterns, and produce an execution plan | `/psfn:plan-ticket <TICKET-ID>` |
| **gemini-review** | Run a code review using Gemini CLI against local changes or a PR | `/psfn:gemini-review` |
| **gemini-task** | Delegate coding tasks, debugging, or research to Gemini CLI | `/psfn:gemini-task <prompt>` |
| **gemini-prompting** | Internal guidance for composing effective Gemini prompts | (auto) |

## Slash Commands

| Command | Description |
|---------|-------------|
| `/psfn:gemini-setup` | Check Gemini CLI installation and authentication |
| `/psfn:gemini-rescue` | Delegate investigation or fix to Gemini |
| `/psfn:gemini-review` | Run a Gemini code review |
| `/psfn:gemini-task` | Send a task to Gemini |
| `/psfn:gemini-status` | Check status of a running Gemini task |
| `/psfn:gemini-result` | Get the result of a completed Gemini task |
| `/psfn:gemini-cancel` | Cancel a running Gemini task |
| `/psfn:gemini-adversarial-review` | Run an adversarial review via Gemini |

## Agents

| Agent | Description |
|-------|-------------|
| **gemini-rescue** | Proactively delegates investigation or fix to Gemini when Claude Code is stuck |
| **plan-ticket** | Explores repos for patterns relevant to a Jira ticket and produces an execution plan |

## License

Private — for internal use.
