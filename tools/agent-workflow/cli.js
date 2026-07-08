#!/usr/bin/env node

const path = require("path");
const {
  generatePrompt,
  readState,
  recordAgentResult,
  writeGeneratedPrompt,
  writeState,
} = require("./agentWorkflow.js");
const {
  DEFAULT_AGENT_RUNNERS,
  detectAgentCli,
  runWorkflowAgentAndPersist,
} = require("./agentRunner.js");
const { runWorkflowCommandAndPersist } = require("./agentWorkflowRun.js");

function readFlag(args, name) {
  const index = args.indexOf(name);
  if (index === -1) return undefined;
  return args[index + 1];
}

function hasFlag(args, name) {
  return args.includes(name);
}

function printUsage() {
  console.log([
    "Usage:",
    "  node tools/agent-workflow/cli.js next --state <state.json> [--write]",
    "  node tools/agent-workflow/cli.js record --state <state.json> --stage <stage> --agent <name> (--result-text <text> | --result-file <path>)",
    "  node tools/agent-workflow/cli.js detect-agent --agent <codex|claude>",
    "  node tools/agent-workflow/cli.js run-agent --state <state.json> [--stage <stage>] [--agent <codex|claude>] [--timeout-ms <ms>]",
    "  node tools/agent-workflow/cli.js run --state <state.json> [--until-blocked] [--max-steps <n>] [--agent <codex|claude>] [--timeout-ms <ms>]",
    "",
    "Safety:",
    "  This script does not push, create PRs, merge PRs, delete branches, call external AI tools, or call network APIs.",
    "  Any remote-mutating commands in generated prompts are labeled HUMAN-ONLY.",
  ].join("\n"));
}

function main(argv) {
  const [command, ...args] = argv;
  const statePath = readFlag(args, "--state");

  if (!command) {
    printUsage();
    process.exitCode = 1;
    return;
  }

  if (command === "detect-agent") {
    const agentId = readFlag(args, "--agent");
    const config = DEFAULT_AGENT_RUNNERS[agentId];
    if (!config) {
      console.error(`Unknown agent: ${agentId || "not provided"}`);
      process.exitCode = 1;
      return;
    }
    detectAgentCli(config)
      .then((result) => {
        console.log(JSON.stringify(result, null, 2));
        if (!result.installed) process.exitCode = 2;
      })
      .catch((error) => {
        console.error(error.message);
        process.exitCode = 1;
      });
    return;
  }

  if (!statePath) {
    printUsage();
    process.exitCode = 1;
    return;
  }

  const resolvedStatePath = path.resolve(process.cwd(), statePath);
  const state = readState(resolvedStatePath);

  if (command === "next") {
    if (hasFlag(args, "--write")) {
      const generated = writeGeneratedPrompt(state, { cwd: process.cwd() });
      console.log(generated.prompt);
      console.error(`Wrote prompt: ${generated.outputPath}`);
      return;
    }

    const generated = generatePrompt(state);
    console.log(generated.prompt);
    return;
  }

  if (command === "record") {
    const stage = readFlag(args, "--stage");
    const agent = readFlag(args, "--agent") || "agent";
    const resultText = readFlag(args, "--result-text");
    const resultFile = readFlag(args, "--result-file");
    const recorded = recordAgentResult(
      state,
      {
        stage,
        agent,
        resultText,
        resultFile: resultFile ? path.resolve(process.cwd(), resultFile) : undefined,
      },
      { cwd: process.cwd() },
    );
    writeState(resolvedStatePath, recorded.state);
    console.log(`Recorded ${recorded.result.stage} result at ${recorded.result.path}`);
    console.log(`Next stage: ${generatePrompt(recorded.state).stage}`);
    return;
  }

  if (command === "run-agent") {
    const timeoutMsText = readFlag(args, "--timeout-ms");
    runWorkflowAgentAndPersist(resolvedStatePath, {
      cwd: process.cwd(),
      stage: readFlag(args, "--stage"),
      agentId: readFlag(args, "--agent"),
      timeoutMs: timeoutMsText ? Number(timeoutMsText) : undefined,
    })
      .then((run) => {
        console.log(JSON.stringify(run.executionRecord, null, 2));
        if (run.executionRecord.exitCode !== 0) process.exitCode = run.executionRecord.timedOut ? 124 : 1;
      })
      .catch((error) => {
        console.error(error.message);
        process.exitCode = 1;
      });
    return;
  }

  if (command === "run") {
    const timeoutMsText = readFlag(args, "--timeout-ms");
    const maxStepsText = readFlag(args, "--max-steps");
    runWorkflowCommandAndPersist(resolvedStatePath, {
      cwd: process.cwd(),
      stage: readFlag(args, "--stage"),
      agentId: readFlag(args, "--agent"),
      timeoutMs: timeoutMsText ? Number(timeoutMsText) : undefined,
      untilBlocked: hasFlag(args, "--until-blocked"),
      maxSteps: maxStepsText ? Number(maxStepsText) : undefined,
    })
      .then((summary) => {
        console.log(formatRunSummary(summary));
        if (summary.stopReason === "failure" || summary.stopReason === "missing-agent") process.exitCode = 1;
      })
      .catch((error) => {
        console.error(error.message);
        process.exitCode = 1;
      });
    return;
  }

  printUsage();
  process.exitCode = 1;
}

function formatRunSummary(summary) {
  const lines = [
    `Workflow run stopped: ${summary.stopReason}`,
    `Next stage: ${summary.nextStage}`,
  ];
  for (const step of summary.steps) {
    lines.push([
      `Stage: ${step.stage}`,
      `Agent: ${step.agentId}`,
      `Result: ${step.outputState}`,
      `Next: ${step.nextStage}`,
      `Execution: ${step.recordPath}`,
      `Result path: ${step.resultPath || "none"}`,
    ].join(" | "));
  }
  if (summary.errorMessage) lines.push(`Error: ${summary.errorMessage}`);
  return lines.join("\n");
}

if (require.main === module) {
  main(process.argv.slice(2));
}

module.exports = { formatRunSummary, main };
