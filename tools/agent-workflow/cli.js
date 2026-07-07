#!/usr/bin/env node

const path = require("path");
const {
  generatePrompt,
  readState,
  recordAgentResult,
  writeGeneratedPrompt,
  writeState,
} = require("./agentWorkflow.js");

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
    "",
    "Safety:",
    "  This script does not push, create PRs, merge PRs, delete branches, call external AI tools, or call network APIs.",
    "  Any remote-mutating commands in generated prompts are labeled HUMAN-ONLY.",
  ].join("\n"));
}

function main(argv) {
  const [command, ...args] = argv;
  const statePath = readFlag(args, "--state");

  if (!command || !statePath) {
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

  printUsage();
  process.exitCode = 1;
}

if (require.main === module) {
  main(process.argv.slice(2));
}

module.exports = { main };
