#!/usr/bin/env node

/**
 * gemini-companion.mjs — Lightweight CLI wrapper for Google Gemini CLI integration.
 *
 * Subcommands:
 *   setup                Check Gemini CLI availability and auth status
 *   task <prompt>        Run a one-shot Gemini task
 *   review [options]     Run a code review via Gemini
 *   status               Show recent Gemini jobs
 *   result [job-id]      Show stored output for a completed job
 *   cancel [job-id]      Cancel a running job
 */

import { execSync, spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STATE_DIR = process.env.GEMINI_COMPANION_STATE ?? path.join(process.env.HOME, ".gemini", "companion-state");
const MAX_JOBS = 50;

// ── Utilities ──────────────────────────────────────────────────────────────

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function generateJobId(prefix = "gemini") {
  const ts = Date.now().toString(36);
  const rand = crypto.randomBytes(3).toString("hex");
  return `${prefix}-${ts}-${rand}`;
}

function nowIso() {
  return new Date().toISOString();
}

function shorten(text, limit = 96) {
  const normalized = String(text ?? "").trim().replace(/\s+/g, " ");
  if (!normalized) return "";
  return normalized.length <= limit ? normalized : `${normalized.slice(0, limit - 3)}...`;
}

// ── State Management ───────────────────────────────────────────────────────

function getWorkspaceStateDir() {
  const cwd = process.cwd();
  const hash = crypto.createHash("sha256").update(cwd).digest("hex").slice(0, 12);
  const dir = path.join(STATE_DIR, hash);
  ensureDir(dir);
  return dir;
}

function readState() {
  const stateFile = path.join(getWorkspaceStateDir(), "state.json");
  if (!fs.existsSync(stateFile)) return { version: 1, jobs: [] };
  return JSON.parse(fs.readFileSync(stateFile, "utf8"));
}

function writeState(state) {
  const stateFile = path.join(getWorkspaceStateDir(), "state.json");
  ensureDir(path.dirname(stateFile));
  fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));
}

function upsertJob(job) {
  const state = readState();
  const idx = state.jobs.findIndex((j) => j.id === job.id);
  if (idx >= 0) {
    state.jobs[idx] = { ...state.jobs[idx], ...job };
  } else {
    state.jobs.push(job);
  }
  // Trim old jobs
  if (state.jobs.length > MAX_JOBS) {
    state.jobs = state.jobs.slice(-MAX_JOBS);
  }
  writeState(state);
}

function readJobFile(jobId) {
  const jobFile = path.join(getWorkspaceStateDir(), `${jobId}.json`);
  if (!fs.existsSync(jobFile)) return null;
  return JSON.parse(fs.readFileSync(jobFile, "utf8"));
}

function writeJobFile(jobId, data) {
  const jobFile = path.join(getWorkspaceStateDir(), `${jobId}.json`);
  ensureDir(path.dirname(jobFile));
  fs.writeFileSync(jobFile, JSON.stringify(data, null, 2));
}

// ── Gemini CLI Detection ───────────────────────────────────────────────────

function getGeminiAvailability() {
  try {
    const version = execSync("gemini --version 2>/dev/null", { encoding: "utf8" }).trim();
    return { available: true, version };
  } catch {
    return { available: false, version: null };
  }
}

function getGeminiAuthStatus() {
  try {
    const credsPath = path.join(process.env.HOME, ".gemini", "oauth_creds.json");
    if (fs.existsSync(credsPath)) {
      const creds = JSON.parse(fs.readFileSync(credsPath, "utf8"));
      return { authenticated: true, account: creds.account ?? "configured" };
    }
    return { authenticated: false, account: null };
  } catch {
    return { authenticated: false, account: null };
  }
}

// ── Git Helpers ────────────────────────────────────────────────────────────

function isGitRepo() {
  try {
    execSync("git rev-parse --is-inside-work-tree 2>/dev/null", { encoding: "utf8" });
    return true;
  } catch {
    return false;
  }
}

function getGitDiff(mode = "working-tree", base = "main") {
  try {
    switch (mode) {
      case "staged":
        return execSync("git diff --cached", { encoding: "utf8", maxBuffer: 10 * 1024 * 1024 });
      case "branch":
        return execSync(`git diff ${base}...HEAD`, { encoding: "utf8", maxBuffer: 10 * 1024 * 1024 });
      case "working-tree":
      default:
        return execSync("git diff HEAD", { encoding: "utf8", maxBuffer: 10 * 1024 * 1024 });
    }
  } catch {
    return "";
  }
}

// ── Run Gemini ─────────────────────────────────────────────────────────────

function runGemini(prompt, options = {}) {
  const args = [];

  if (options.model) {
    args.push("-m", options.model);
  } else {
    args.push("-m", "gemini-2.5-flash-lite");
  }

  args.push("-o", "json");

  if (options.yolo) {
    args.push("--yolo");
  }

  if (options.sandbox) {
    args.push("-s");
  }

  // Use positional prompt for short prompts, stdin for long ones
  if (prompt.length < 4000 && !prompt.includes("'")) {
    args.push(prompt);
    const result = spawnSync("gemini", args, {
      encoding: "utf8",
      maxBuffer: 50 * 1024 * 1024,
      timeout: options.timeout ?? 600000,
      cwd: process.cwd(),
    });
    return {
      stdout: result.stdout ?? "",
      stderr: result.stderr ?? "",
      status: result.status ?? 1,
    };
  }

  // Pipe long prompts via stdin
  const result = spawnSync("gemini", args, {
    input: prompt,
    encoding: "utf8",
    maxBuffer: 50 * 1024 * 1024,
    timeout: options.timeout ?? 600000,
    cwd: process.cwd(),
  });
  return {
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
    status: result.status ?? 1,
  };
}

function parseGeminiOutput(stdout) {
  try {
    const parsed = JSON.parse(stdout);
    return {
      response: parsed.response ?? "",
      stats: parsed.stats ?? null,
      raw: parsed,
    };
  } catch {
    // Gemini may output non-JSON (e.g., plain text or errors)
    return {
      response: stdout,
      stats: null,
      raw: null,
    };
  }
}

// ── Subcommands ────────────────────────────────────────────────────────────

function handleSetup(argv) {
  const asJson = argv.includes("--json");
  const gemini = getGeminiAvailability();
  const auth = getGeminiAuthStatus();

  const report = {
    ready: gemini.available && auth.authenticated,
    gemini,
    auth,
    nextSteps: [],
  };

  if (!gemini.available) {
    report.nextSteps.push("Install Gemini CLI: npm install -g @anthropic-ai/gemini-cli or see https://github.com/anthropics/gemini-cli");
  }
  if (gemini.available && !auth.authenticated) {
    report.nextSteps.push("Authenticate: run `!gemini` and follow the OAuth flow.");
  }

  if (asJson) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(`Gemini CLI: ${gemini.available ? `v${gemini.version}` : "not installed"}`);
    console.log(`Auth: ${auth.authenticated ? `authenticated (${auth.account})` : "not authenticated"}`);
    if (report.nextSteps.length) {
      console.log("\nNext steps:");
      report.nextSteps.forEach((s) => console.log(`  - ${s}`));
    } else {
      console.log("\nReady to use.");
    }
  }
}

function handleTask(argv) {
  const asJson = argv.includes("--json");
  const yolo = argv.includes("--yolo") || argv.includes("--write");
  const sandbox = argv.includes("-s") || argv.includes("--sandbox");

  // Extract model
  let model = null;
  const mIdx = argv.indexOf("-m");
  const modelIdx = argv.indexOf("--model");
  if (mIdx >= 0 && argv[mIdx + 1]) model = argv[mIdx + 1];
  else if (modelIdx >= 0 && argv[modelIdx + 1]) model = argv[modelIdx + 1];

  // Model aliases
  const aliases = { pro: "gemini-2.5-flash-lite", flash: "gemini-2.5-flash", lite: "gemini-2.5-flash-lite" };
  if (model && aliases[model]) model = aliases[model];

  // Extract prompt (everything that's not a flag)
  const flagSet = new Set(["--json", "--yolo", "--write", "-s", "--sandbox", "-m", "--model", "--background"]);
  const positionals = [];
  for (let i = 0; i < argv.length; i++) {
    if (flagSet.has(argv[i])) {
      if (argv[i] === "-m" || argv[i] === "--model") i++; // skip value
      continue;
    }
    positionals.push(argv[i]);
  }
  const prompt = positionals.join(" ").trim();

  if (!prompt) {
    console.error("Error: Provide a prompt for the task.");
    process.exitCode = 1;
    return;
  }

  // Create job
  const jobId = generateJobId("task");
  const job = {
    id: jobId,
    kind: "task",
    status: "running",
    prompt: shorten(prompt),
    model: model ?? "gemini-2.5-flash-lite",
    startedAt: nowIso(),
    write: yolo,
  };
  upsertJob(job);

  // Run
  const result = runGemini(prompt, { model, yolo, sandbox });
  const parsed = parseGeminiOutput(result.stdout);

  // Update job
  const completedJob = {
    ...job,
    status: result.status === 0 ? "completed" : "failed",
    completedAt: nowIso(),
    response: shorten(parsed.response, 200),
    stats: parsed.stats,
  };
  upsertJob(completedJob);
  writeJobFile(jobId, { ...completedJob, fullResponse: parsed.response });

  if (asJson) {
    console.log(JSON.stringify({
      jobId,
      status: completedJob.status,
      response: parsed.response,
      stats: parsed.stats,
    }, null, 2));
  } else {
    if (result.status !== 0 && result.stderr) {
      console.error(result.stderr);
    }
    console.log(parsed.response);
  }
}

function handleReview(argv) {
  const asJson = argv.includes("--json");
  const adversarial = argv.includes("--adversarial") || argv.includes("--challenge");

  // Extract scope/base
  let scope = "working-tree";
  let base = "main";
  const scopeIdx = argv.indexOf("--scope");
  if (scopeIdx >= 0 && argv[scopeIdx + 1]) scope = argv[scopeIdx + 1];
  const baseIdx = argv.indexOf("--base");
  if (baseIdx >= 0 && argv[baseIdx + 1]) base = argv[baseIdx + 1];

  // Extract model
  let model = null;
  const mIdx = argv.indexOf("-m");
  const modelIdx = argv.indexOf("--model");
  if (mIdx >= 0 && argv[mIdx + 1]) model = argv[mIdx + 1];
  else if (modelIdx >= 0 && argv[modelIdx + 1]) model = argv[modelIdx + 1];

  // Extract focus text
  const flagSet = new Set(["--json", "--adversarial", "--challenge", "--scope", "--base", "-m", "--model", "--wait", "--background"]);
  const positionals = [];
  for (let i = 0; i < argv.length; i++) {
    if (flagSet.has(argv[i])) {
      if (["--scope", "--base", "-m", "--model"].includes(argv[i])) i++;
      continue;
    }
    positionals.push(argv[i]);
  }
  const focusText = positionals.join(" ").trim();

  if (!isGitRepo()) {
    console.error("Error: Not inside a git repository.");
    process.exitCode = 1;
    return;
  }

  const diff = getGitDiff(scope, base);
  if (!diff.trim()) {
    console.log("No changes to review.");
    return;
  }

  const reviewType = adversarial ? "Adversarial Review" : "Code Review";
  const reviewerRole = adversarial
    ? `You are a skeptical senior engineer whose job is to challenge the implementation approach and design choices — not just find bugs, but question whether this is the right solution at all.

Focus on:
- Are the assumptions valid?
- What breaks under real-world load, edge cases, or maintenance?
- Is this the simplest correct approach?
- What would you do differently?`
    : `You are an expert code reviewer. Review the following git diff thoroughly for correctness, security, performance, and maintainability.`;

  const prompt = `${reviewerRole}

${focusText ? `Focus area: ${focusText}\n` : ""}
<diff>
${diff}
</diff>

Produce a structured review:

## Summary
One paragraph overview of the changes.

## Assessment
Overall: Looks good | Needs changes | Needs discussion

## Findings
For each issue found:
- **Severity**: critical | high | medium | low
- **File**: file path and line numbers
- **Issue**: what's wrong
- **Suggestion**: how to fix it

Order findings by severity (critical first). If no issues found, say "No issues found."

## Positives
What the code does well.

## Verdict
Final recommendation.`;

  // Create job
  const jobId = generateJobId("review");
  const job = {
    id: jobId,
    kind: adversarial ? "adversarial-review" : "review",
    status: "running",
    scope,
    base,
    startedAt: nowIso(),
  };
  upsertJob(job);

  // Run
  const result = runGemini(prompt, { model, yolo: false });
  const parsed = parseGeminiOutput(result.stdout);

  // Update job
  const completedJob = {
    ...job,
    status: result.status === 0 ? "completed" : "failed",
    completedAt: nowIso(),
    response: shorten(parsed.response, 200),
    stats: parsed.stats,
  };
  upsertJob(completedJob);
  writeJobFile(jobId, { ...completedJob, fullResponse: parsed.response });

  if (asJson) {
    console.log(JSON.stringify({
      jobId,
      status: completedJob.status,
      reviewType,
      response: parsed.response,
      stats: parsed.stats,
    }, null, 2));
  } else {
    console.log(`── ${reviewType} (${jobId}) ──\n`);
    if (result.status !== 0 && result.stderr) {
      console.error(result.stderr);
    }
    console.log(parsed.response);
  }
}

function handleStatus(argv) {
  const asJson = argv.includes("--json");
  const showAll = argv.includes("--all");
  const state = readState();
  const jobs = state.jobs.slice().reverse();
  const sessionId = process.env.GEMINI_COMPANION_SESSION_ID;

  const filtered = showAll
    ? jobs
    : sessionId
      ? jobs.filter((j) => j.sessionId === sessionId).slice(0, 10)
      : jobs.slice(0, 10);

  if (asJson) {
    console.log(JSON.stringify({ jobs: filtered }, null, 2));
  } else {
    if (!filtered.length) {
      console.log("No Gemini jobs found.");
      return;
    }
    console.log("Job ID                | Kind              | Status    | Summary");
    console.log("─".repeat(80));
    for (const job of filtered) {
      const id = (job.id ?? "").padEnd(20);
      const kind = (job.kind ?? "task").padEnd(18);
      const status = (job.status ?? "unknown").padEnd(10);
      const summary = shorten(job.prompt ?? job.response ?? "", 40);
      console.log(`${id} | ${kind} | ${status} | ${summary}`);
    }
  }
}

function handleResult(argv) {
  const asJson = argv.includes("--json");
  const positionals = argv.filter((a) => !a.startsWith("--"));
  const jobId = positionals[0];

  if (!jobId) {
    // Show latest completed job
    const state = readState();
    const latest = state.jobs.slice().reverse().find((j) => j.status === "completed");
    if (!latest) {
      console.log("No completed jobs found.");
      return;
    }
    const stored = readJobFile(latest.id);
    if (asJson) {
      console.log(JSON.stringify(stored ?? latest, null, 2));
    } else {
      console.log(`── Result: ${latest.id} (${latest.kind}) ──\n`);
      console.log(stored?.fullResponse ?? latest.response ?? "No output stored.");
    }
    return;
  }

  const stored = readJobFile(jobId);
  if (!stored) {
    console.error(`No stored result for job ${jobId}.`);
    process.exitCode = 1;
    return;
  }

  if (asJson) {
    console.log(JSON.stringify(stored, null, 2));
  } else {
    console.log(`── Result: ${jobId} (${stored.kind}) ──\n`);
    console.log(stored.fullResponse ?? stored.response ?? "No output stored.");
  }
}

function handleCancel(argv) {
  const positionals = argv.filter((a) => !a.startsWith("--"));
  const jobId = positionals[0];

  if (!jobId) {
    const state = readState();
    const running = state.jobs.find((j) => j.status === "running");
    if (!running) {
      console.log("No running jobs to cancel.");
      return;
    }
    running.status = "cancelled";
    running.completedAt = nowIso();
    upsertJob(running);
    console.log(`Cancelled ${running.id}.`);
    return;
  }

  const state = readState();
  const job = state.jobs.find((j) => j.id === jobId);
  if (!job) {
    console.error(`Job ${jobId} not found.`);
    process.exitCode = 1;
    return;
  }
  job.status = "cancelled";
  job.completedAt = nowIso();
  upsertJob(job);
  console.log(`Cancelled ${jobId}.`);
}

// ── Main ───────────────────────────────────────────────────────────────────

const [subcommand, ...argv] = process.argv.slice(2);

if (!subcommand || subcommand === "help" || subcommand === "--help") {
  console.log([
    "Usage:",
    "  gemini-companion setup [--json]",
    "  gemini-companion task [--model <pro|flash|lite>] [--yolo] [--json] <prompt>",
    "  gemini-companion review [--adversarial] [--scope <working-tree|staged|branch>] [--base <ref>] [--model <model>] [--json] [focus text]",
    "  gemini-companion status [--all] [--json]",
    "  gemini-companion result [job-id] [--json]",
    "  gemini-companion cancel [job-id]",
  ].join("\n"));
  process.exit(0);
}

try {
  switch (subcommand) {
    case "setup":
      handleSetup(argv);
      break;
    case "task":
      handleTask(argv);
      break;
    case "review":
      handleReview(argv);
      break;
    case "adversarial-review":
      handleReview(["--adversarial", ...argv]);
      break;
    case "status":
      handleStatus(argv);
      break;
    case "result":
      handleResult(argv);
      break;
    case "cancel":
      handleCancel(argv);
      break;
    default:
      console.error(`Unknown subcommand: ${subcommand}`);
      process.exitCode = 1;
  }
} catch (err) {
  console.error(err.message ?? String(err));
  process.exitCode = 1;
}
