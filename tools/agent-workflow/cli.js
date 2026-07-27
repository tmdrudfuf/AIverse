#!/usr/bin/env node

const path = require("path");
const {
  determineNextStage,
  generatePrompt,
  readState,
  recordAgentResult,
  writeGeneratedPrompt,
  writeState,
} = require("./agentWorkflow.js");
const {
  DEFAULT_AGENT_RUNNERS,
  DEFAULT_STAGE_AGENTS,
  detectAgentCli,
  resolveAgentConfig,
  runWorkflowAgentAndPersist,
} = require("./agentRunner.js");
const { previewWorkflowCommand, runWorkflowCommandAndPersist } = require("./agentWorkflowRun.js");
const {
  NEXT_ACTION_BY_OUTCOME,
  SAME_RUNNER_WARNING,
  previewIndependentReview,
  runIndependentReviewAndPersist,
} = require("./reviewCommand.js");
const {
  previewOrchestration,
  runOrchestrationAndPersist,
} = require("./orchestrateCommand.js");
const { resolveEffectiveRoles } = require("./roleResolver.js");
const { getRunSummaryForDisplay, formatSummaryCommandOutput } = require("./summaryCommand.js");

const ROLE_SOURCE_LABELS = {
  "cli-override": "CLI override",
  state: "state",
  default: "default",
  resume: "resume (pinned)",
};

function describeRoleSource(source) {
  return ROLE_SOURCE_LABELS[source] || source || "unknown";
}

function readFlag(args, name) {
  const index = args.indexOf(name);
  if (index === -1) return undefined;
  return args[index + 1];
}

function hasFlag(args, name) {
  return args.includes(name);
}

/**
 * Strict reader for --implementer: rejects a missing value (end of argv, or
 * immediately followed by another flag) and rejects conflicting repeats.
 * An identical value repeated more than once normalizes to that one value.
 */
function readImplementerFlag(args) {
  const indices = [];
  for (let index = 0; index < args.length; index += 1) {
    if (args[index] === "--implementer") indices.push(index);
  }
  if (!indices.length) return undefined;
  const values = indices.map((index) => args[index + 1]);
  for (const value of values) {
    if (value === undefined || value.startsWith("--")) {
      throw new Error("--implementer requires a value.");
    }
  }
  const unique = [...new Set(values)];
  if (unique.length > 1) {
    throw new Error(`--implementer was provided multiple times with conflicting values: ${unique.join(", ")}.`);
  }
  return unique[0];
}

function printUsage() {
  console.log([
    "Usage:",
    "  node tools/agent-workflow/cli.js next --state <state.json> [--write]",
    "  node tools/agent-workflow/cli.js record --state <state.json> --stage <stage> --agent <name> (--result-text <text> | --result-file <path>)",
    "  node tools/agent-workflow/cli.js detect-agent --agent <implementer|reviewer|agent-id>",
    "  node tools/agent-workflow/cli.js detect-agent --implementer <agent-id> [--state <state.json>]",
    "  node tools/agent-workflow/cli.js run-agent --state <state.json> [--stage <stage>] [--agent <implementer|reviewer|agent-id>] [--timeout-ms <ms>]",
    "  node tools/agent-workflow/cli.js run --state <state.json> [--dry-run] [--until-blocked] [--max-steps <n>] [--agent <implementer|reviewer|agent-id>] [--implementer <agent-id>] [--timeout-ms <ms>]",
    "  node tools/agent-workflow/cli.js run-review --state <state.json> [--dry-run] [--agent <reviewer|agent-id>] [--implementer <agent-id>] [--base <branch>] [--timeout-ms <ms>]",
    "  node tools/agent-workflow/cli.js orchestrate --state <state.json> [--dry-run] [--implementer <agent-id>] [--timeout-ms <ms>] [--max-fix-cycles <n>] [--skip-validation] [--validation-command <command>] [--validation-strategy full-every-cycle|focused-final-full] [--focused-validation-command <command>] [--full-validation-command <command>] [--force-full-validation] [--max-review-attempts <n>] [--max-automatic-fix-cycles <n>] [--max-incomplete-review-retries <n>] [--max-reviewer-question-cycles <n>]",
    "  node tools/agent-workflow/cli.js summary --state <state.json> [--format markdown|json]",
    "",
    "Run summaries:",
    "  `orchestrate` (non-dry-run) writes run-summary.json/run-summary.md to the run directory once, after",
    "  its internal loop stops (approved/blocked/timed-out/awaiting human decision). `summary` is read-only:",
    "  it recomputes the same normalized summary directly from the supplied state file on demand -- it never",
    "  spawns a process, runs validation, mutates state, or writes any artifact, and works for state files",
    "  that predate this feature. --format defaults to markdown.",
    "",
    "Validation strategy:",
    "  --validation-strategy full-every-cycle (default) runs the same full command list at every validate/",
    "  revalidate/final-verification occurrence, exactly as before this option existed. focused-final-full runs",
    "  a smaller --focused-validation-command list at validate/revalidate and reserves the full",
    "  --full-validation-command list for final-verification only, which remains the sole gate for merge",
    "  readiness -- focused validation passing alone can never make a run ready. --force-full-validation runs",
    "  the full list at the very next validation occurrence without skipping any stage or marking anything",
    "  ready by itself. See tools/agent-workflow/README.md#focused-validation-review-loop.",
    "",
    "Review budgets:",
    "  --max-review-attempts <n> (default 3) caps total independent Reviewer attempts across this run.",
    "  --max-automatic-fix-cycles <n> is a reviewBudget-level ceiling on Reviewer-requested fix cycles; when",
    "  not supplied it mirrors --max-fix-cycles so the two never silently diverge. --max-fix-cycles itself",
    "  keeps its original meaning unchanged. --max-incomplete-review-retries <n> (default 1) bounds retries of",
    "  a review the workflow classified as incomplete (see reviewCoverage.js) before hard-blocking.",
    "  --max-reviewer-question-cycles <n> (default 1) mirrors the existing state.maxQuestionCycles ceiling on",
    "  Reviewer clarification-question rounds. Exhausting any of the four ceilings stops with stopReason",
    "  review-convergence-failed, never humanGate.ready. See tools/agent-workflow/README.md#review-budgets.",
    "",
    "Role selection:",
    "  --implementer <agent-id> picks the Implementer for this execution only and resolves the other",
    "  configured agent as Reviewer automatically. Priority: --implementer > state-configured roles > defaults.",
    "  It never rewrites the state file's configured role mapping. --implementer=value (equals form) is not",
    "  supported, consistent with every other flag in this CLI. Repeating --implementer with the same value",
    "  is accepted; repeating it with different values is rejected before any process spawns.",
    "  --implementer is ignored by next, record, and run-agent, which do not resolve a Reviewer role.",
    "",
    "Safety:",
    "  This script does not push, create PRs, merge PRs, or delete branches.",
    "  Configured local agent CLIs may use network access when a human runs a local CLI stage.",
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
    let implementerFlag;
    try {
      implementerFlag = readImplementerFlag(args);
    } catch (error) {
      console.error(error.message);
      process.exitCode = 1;
      return;
    }

    const detectStatePath = readFlag(args, "--state");
    let detectState;
    try {
      detectState = detectStatePath ? readState(path.resolve(process.cwd(), detectStatePath)) : {};
    } catch (error) {
      console.error(error.message);
      process.exitCode = 1;
      return;
    }

    if (implementerFlag) {
      const resolution = resolveEffectiveRoles({ state: detectState, requestedImplementerId: implementerFlag });
      if (!resolution.ok) {
        console.error(resolution.diagnostics.join(" "));
        process.exitCode = 1;
        return;
      }
      Promise.all([
        detectAgentCli(resolveAgentConfig(detectState, resolution.roles.implementer)),
        detectAgentCli(resolveAgentConfig(detectState, resolution.roles.reviewer)),
      ])
        .then(([implementerResult, reviewerResult]) => {
          console.log(JSON.stringify({
            roleSource: resolution.source,
            implementer: implementerResult,
            reviewer: reviewerResult,
          }, null, 2));
          if (!implementerResult.installed || !reviewerResult.installed) process.exitCode = 2;
        })
        .catch((error) => {
          console.error(error.message);
          process.exitCode = 1;
        });
      return;
    }

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
    let implementerFlag;
    try {
      implementerFlag = readImplementerFlag(args);
    } catch (error) {
      console.error(error.message);
      process.exitCode = 1;
      return;
    }

    let resolvedAgentId;
    let resolvedRoles;
    if (implementerFlag) {
      const resolution = resolveEffectiveRoles({ state, requestedImplementerId: implementerFlag });
      if (!resolution.ok) {
        console.error(resolution.diagnostics.join(" "));
        process.exitCode = 1;
        return;
      }
      resolvedRoles = resolution.roles;
      const stage = readFlag(args, "--stage") || determineNextStage(state);
      const role = DEFAULT_STAGE_AGENTS[stage];
      if (role) resolvedAgentId = resolvedRoles[role];
    }
    const agentId = readFlag(args, "--agent") || resolvedAgentId;

    if (hasFlag(args, "--dry-run")) {
      try {
        console.log(formatDryRunPreview(previewWorkflowCommand(state, {
          cwd: process.cwd(),
          stage: readFlag(args, "--stage"),
          agentId,
        })));
      } catch (error) {
        console.error(error.message);
        process.exitCode = 1;
      }
      return;
    }

    const timeoutMsText = readFlag(args, "--timeout-ms");
    const maxStepsText = readFlag(args, "--max-steps");
    runWorkflowCommandAndPersist(resolvedStatePath, {
      cwd: process.cwd(),
      stage: readFlag(args, "--stage"),
      agentId,
      resolvedRoles,
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

  if (command === "run-review") {
    let implementerFlag;
    try {
      implementerFlag = readImplementerFlag(args);
    } catch (error) {
      console.error(error.message);
      process.exitCode = 1;
      return;
    }

    if (hasFlag(args, "--dry-run")) {
      try {
        console.log(formatIndependentReviewDryRunPreview(previewIndependentReview(state, {
          cwd: process.cwd(),
          agentId: readFlag(args, "--agent"),
          implementerAgentId: implementerFlag,
          baseBranch: readFlag(args, "--base"),
        })));
      } catch (error) {
        console.error(error.message);
        process.exitCode = 1;
      }
      return;
    }

    const timeoutMsText = readFlag(args, "--timeout-ms");
    runIndependentReviewAndPersist(resolvedStatePath, {
      cwd: process.cwd(),
      agentId: readFlag(args, "--agent"),
      implementerAgentId: implementerFlag,
      baseBranch: readFlag(args, "--base"),
      timeoutMs: timeoutMsText ? Number(timeoutMsText) : undefined,
    })
      .then((run) => {
        console.log(formatIndependentReviewResult(run));
        if (run.outcome !== "Approved") process.exitCode = 1;
      })
      .catch((error) => {
        console.error(error.message);
        process.exitCode = 1;
      });
    return;
  }

  if (command === "orchestrate") {
    let implementerFlag;
    try {
      implementerFlag = readImplementerFlag(args);
    } catch (error) {
      console.error(error.message);
      process.exitCode = 1;
      return;
    }

    const timeoutMsText = readFlag(args, "--timeout-ms");
    const maxFixCyclesText = readFlag(args, "--max-fix-cycles");
    const validationCommands = readAllFlags(args, "--validation-command");
    const focusedValidationCommands = readAllFlags(args, "--focused-validation-command");
    const fullValidationCommands = readAllFlags(args, "--full-validation-command");
    // Spec 056 Part C: reviewBudget CLI overrides. Only flags actually
    // supplied are set on the override object -- resolveReviewBudget's own
    // precedence (CLI > state.reviewBudget > --max-fix-cycles-mirrored
    // default) already handles "not supplied", so no flag defaults are
    // hardcoded here (see README.md#review-budgets for precedence details).
    const maxReviewAttemptsText = readFlag(args, "--max-review-attempts");
    const maxAutomaticFixCyclesText = readFlag(args, "--max-automatic-fix-cycles");
    const maxIncompleteReviewRetriesText = readFlag(args, "--max-incomplete-review-retries");
    const maxReviewerQuestionCyclesText = readFlag(args, "--max-reviewer-question-cycles");
    const reviewBudget = {};
    if (maxReviewAttemptsText) reviewBudget.maxReviewAttempts = Number(maxReviewAttemptsText);
    if (maxAutomaticFixCyclesText) reviewBudget.maxAutomaticFixCycles = Number(maxAutomaticFixCyclesText);
    if (maxIncompleteReviewRetriesText) reviewBudget.maxIncompleteReviewRetries = Number(maxIncompleteReviewRetriesText);
    if (maxReviewerQuestionCyclesText) reviewBudget.maxReviewerQuestionCycles = Number(maxReviewerQuestionCyclesText);
    const options = {
      cwd: process.cwd(),
      implementerAgentId: implementerFlag,
      timeoutMs: timeoutMsText ? Number(timeoutMsText) : undefined,
      maxFixCycles: maxFixCyclesText ? Number(maxFixCyclesText) : undefined,
      skipValidation: hasFlag(args, "--skip-validation"),
      validationCommands: validationCommands.length ? validationCommands : undefined,
      validationStrategy: readFlag(args, "--validation-strategy"),
      focusedValidationCommands: focusedValidationCommands.length ? focusedValidationCommands : undefined,
      fullValidationCommands: fullValidationCommands.length ? fullValidationCommands : undefined,
      forceFullValidation: hasFlag(args, "--force-full-validation"),
      reviewBudget: Object.keys(reviewBudget).length ? reviewBudget : undefined,
    };
    if (hasFlag(args, "--dry-run")) {
      try {
        console.log(formatOrchestrationDryRun(previewOrchestration(state, options)));
      } catch (error) {
        console.error(error.message);
        process.exitCode = 1;
      }
      return;
    }

    runOrchestrationAndPersist(resolvedStatePath, options)
      .then((run) => {
        console.log(formatOrchestrationResult(run));
        if (run.decision !== "Ready for human merge decision") process.exitCode = 1;
      })
      .catch((error) => {
        console.error(error.message);
        process.exitCode = 1;
      });
    return;
  }

  if (command === "summary") {
    const format = readFlag(args, "--format") || "markdown";
    if (format !== "markdown" && format !== "json") {
      console.error(`Unsupported --format value: ${format}. Use "markdown" or "json".`);
      process.exitCode = 1;
      return;
    }
    const summary = getRunSummaryForDisplay(state, { cwd: process.cwd() });
    console.log(formatSummaryCommandOutput(summary, format));
    return;
  }

  printUsage();
  process.exitCode = 1;
}

function readAllFlags(args, name) {
  const values = [];
  for (let index = 0; index < args.length; index += 1) {
    if (args[index] === name && args[index + 1] !== undefined) values.push(args[index + 1]);
  }
  return values;
}

function formatIndependentReviewDryRunPreview(preview) {
  const lines = [];
  if (preview.sameRunner) lines.push(SAME_RUNNER_WARNING, "");
  lines.push(
    "Dry run: true",
    "Resolved roles",
    `Implementer: ${preview.implementerIdentity} (${preview.implementerId})`,
    `Reviewer: ${preview.reviewerIdentity} (${preview.reviewerId})`,
    `Role source: ${describeRoleSource(preview.roleSource)}`,
    `Command: ${preview.commandPreview}`,
    `Prompt path: ${preview.promptPath}`,
    `Run directory: ${preview.runDirectory}`,
    `Repository: ${preview.repositoryContext.repositoryPath}`,
    `Current branch: ${preview.repositoryContext.currentBranch}`,
    `Base branch: ${preview.repositoryContext.baseBranch}`,
    `Merge base: ${preview.repositoryContext.mergeBase || "(none)"}`,
    `Staged changes: ${preview.repositoryContext.hasStagedChanges}`,
    `Unstaged changes: ${preview.repositoryContext.hasUnstagedChanges}`,
    `Committed branch changes: ${preview.repositoryContext.hasCommittedChanges}`,
    `Will spawn: ${preview.willSpawn}`,
  );
  return lines.join("\n");
}

function formatIndependentReviewResult(run) {
  const lines = [];
  if (run.sameRunner) lines.push(SAME_RUNNER_WARNING, "");
  lines.push(`Review Decision: ${run.outcome}`);
  lines.push(`Implementer: ${run.implementerId}`);
  if (run.outcome === "Approved" || run.outcome === "Changes Requested") {
    lines.push(`Reviewer: ${run.reviewerId}`);
  }
  lines.push(`Role source: ${describeRoleSource(run.roleSource)}`);
  lines.push(`Next action: ${NEXT_ACTION_BY_OUTCOME[run.outcome] || "inspect the saved review output."}`);
  return lines.join("\n");
}

// Defensive against hand-built preview objects (existing tests construct one
// directly without validationPolicy/nextValidationPhase) as well as real
// previewOrchestration() output, which always includes both.
function formatValidationPolicyPreview(preview) {
  if (!preview.validationPolicy || !preview.nextValidationPhase) return [];
  return [
    `Validation strategy: ${preview.validationPolicy.strategy}`,
    `Focused validation commands: ${preview.validationPolicy.focusedCommands.length ? preview.validationPolicy.focusedCommands.join("; ") : "(none configured)"}`,
    `Final full validation commands: ${preview.validationPolicy.fullCommands.join("; ")}`,
    `Next validation phase: ${preview.nextValidationPhase.phase} (${preview.nextValidationPhase.reason})`,
  ];
}

function formatOrchestrationDryRun(preview) {
  const lines = [
    "Dry run: true",
    `Feature: ${preview.featureId}`,
    `Branch: ${preview.branch}`,
    `Current stage: ${preview.currentStage}`,
    "Resolved roles",
    `Implementer: ${preview.implementer.identity} (${preview.implementer.id})`,
    `Implementer command: ${preview.implementer.commandPreview}`,
    `Reviewer: ${preview.reviewer.identity} (${preview.reviewer.id})`,
    `Reviewer command: ${preview.reviewer.commandPreview}`,
    `Role source: ${describeRoleSource(preview.roleSource)}`,
    `Validation: ${preview.validationCommands.length ? preview.validationCommands.join("; ") : "skipped"}`,
    ...formatValidationPolicyPreview(preview),
    `Fix cycle: ${preview.fixCycleCount || 0}/${preview.maxFixCycles}`,
    `Question cycle: ${preview.questionCycle || 0}/${preview.maxQuestionCycles}`,
    `Finding lifecycle: previous findings may be supplied=${preview.findingLifecycle.previousFindingsMayBeSupplied}; current findings=${preview.findingLifecycle.currentFindingCount}`,
    `Next action: ${preview.nextExpectedStage}`,
    `Run directory: ${preview.runDirectory}`,
    `Artifacts: implement prompt=${preview.promptPaths.implement}; review prompt=${preview.promptPaths.review}; answer prompt=${preview.promptPaths.answerQuestions}; final-review prompt=${preview.promptPaths.finalReview}; fix prompt=${preview.promptPaths.fix}; lifecycle=${preview.promptPaths.findingLifecycle}`,
    `Planned stages: ${preview.plannedStages.join(" -> ")}`,
    "Run summary artifacts:",
    `  Would write: ${preview.summaryPaths.json}`,
    `  Would write: ${preview.summaryPaths.markdown}`,
    `  Actual writes: no`,
    "Will spawn agents: no",
    "Will mutate state: no",
    "Will run validation: no",
    "Will perform remote mutation: no",
    `Will spawn: ${preview.willSpawn}`,
  ];
  if (preview.sameRunner) lines.splice(1, 0, SAME_RUNNER_WARNING, "");
  return lines.join("\n");
}

function formatOrchestrationResult(run) {
  const orchestration = run.state.orchestration || {};
  const lines = [];
  if (orchestration.sameRunner) lines.push(SAME_RUNNER_WARNING, "");
  lines.push(
    `Feature: ${run.state.featureId || "unknown-feature"}`,
    `Branch: ${run.state.currentBranch || orchestration.branch || "unknown-branch"}`,
    "Resolved roles",
    `Implementer: ${orchestration.implementerIdentity || "unknown"} (${orchestration.implementerId || "unknown"})`,
    `Reviewer: ${orchestration.reviewerIdentity || "unknown"} (${orchestration.reviewerId || "unknown"})`,
    `Role source: ${describeRoleSource(orchestration.roleResolutionSource || run.state.latestRoleResolutionSource)}`,
    `Current stage: ${orchestration.currentStage || "unknown"}`,
    `Validation: ${Array.isArray(run.state.validationRuns) && run.state.validationRuns.length ? run.state.validationRuns.at(-1).status : "not run"}`,
    `Review decision: ${run.state.latestReviewDecision || "none"}`,
    `Fix cycle: ${run.state.fixCycleCount || 0}/${orchestration.maxFixCycles ?? "unknown"}`,
    `Question cycle: ${run.state.questionCycle || 0}/${orchestration.maxQuestionCycles ?? "unknown"}`,
    `Finding lifecycle: ${run.state.latestFindingLifecycleStatus || orchestration.latestFindingLifecycleStatus || "not run"}`,
    `Next action: ${run.nextAction || "inspect state"}`,
    `Artifacts: ${run.steps.map((step) => step.artifactPath).filter(Boolean).join("; ") || "none"}`,
    `Decision: ${run.decision}`,
  );
  if (run.reason) lines.push(`Reason: ${run.reason}`);
  lines.push("", ...formatOrchestrationSummaryPointer(run));
  return lines.join("\n");
}

function formatOrchestrationSummaryPointer(run) {
  const lines = ["Run summary"];
  if (run.summaryPaths) {
    lines.push(`Markdown: ${run.summaryPaths.markdown}`);
    lines.push(`JSON: ${run.summaryPaths.json}`);
  } else {
    lines.push(`Markdown: unavailable (${run.summaryWarning || "unknown error"})`);
    lines.push("JSON: unavailable");
  }
  if (run.summary) {
    lines.push(`Status: ${run.summary.run.status}`);
    lines.push(`Reviewer decision: ${run.summary.review.finalDecision}`);
    lines.push(`Validation: ${run.summary.validation.status}`);
  }
  return lines;
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

function formatDryRunPreview(preview) {
  return [
    "Dry run: true",
    `Current stage: ${preview.stage}`,
    `Selected agent: ${preview.agentId || "human-merge-decision"} (${preview.agentIdentity})`,
    `Command: ${preview.commandPreview}`,
    `Prompt path: ${preview.promptPath || "none"}`,
    `Run directory: ${preview.runDirectory}`,
    `Next expected step: ${preview.nextStage}`,
    `Will spawn: ${preview.willSpawn}`,
  ].join("\n");
}

if (require.main === module) {
  main(process.argv.slice(2));
}

module.exports = {
  describeRoleSource,
  formatDryRunPreview,
  formatIndependentReviewDryRunPreview,
  formatIndependentReviewResult,
  formatOrchestrationDryRun,
  formatOrchestrationResult,
  formatOrchestrationSummaryPointer,
  formatRunSummary,
  main,
  readImplementerFlag,
};
