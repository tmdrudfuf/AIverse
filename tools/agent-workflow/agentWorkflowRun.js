const fs = require("fs");

const { determineNextStage, getRunDirectory, readState, writeGeneratedPrompt, writeState } = require("./agentWorkflow.js");
const {
  assertRunnableStage,
  assertSafeCommand,
  resolveAgentConfig,
  resolveStageAgentId,
  runWorkflowAgent,
} = require("./agentRunner.js");

const DEFAULT_MAX_WORKFLOW_RUN_STEPS = 6;

function normalizeMaxSteps(value, fallback) {
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : fallback;
}

function isFailedOutputState(outputState) {
  return outputState !== "ok";
}

function createStepSummary(run) {
  const nextStage = determineNextStage(run.state);
  return {
    stage: run.executionRecord.stage,
    agentId: run.executionRecord.agentId,
    agentIdentity: run.executionRecord.agentIdentity,
    outputState: run.executionRecord.outputState,
    exitCode: run.executionRecord.exitCode,
    recordPath: run.state.agentExecutions?.[run.state.agentExecutions.length - 1]?.path || "",
    resultPath: run.resultPath ? run.resultPath.replace(/\\/g, "/") : undefined,
    nextStage,
  };
}

function getNextExpectedStep(stage) {
  if (stage === "implement") return "review";
  if (stage === "fix") return "re-review";
  if (stage === "final-verification") return "human-merge-decision";
  if (stage === "review" || stage === "re-review") return "depends on Approved or Changes Requested";
  return "human-merge-decision";
}

function createDryRunSummary(state, options = {}) {
  const stage = options.stage || determineNextStage(state);
  if (stage === "human-merge-decision") {
    return {
      stage,
      blocked: true,
      blockedReason: "human-merge-decision is human-only and must not invoke an agent CLI",
      nextExpectedStep: "human merge decision",
      runDirectory: getRunDirectory(state, { cwd: options.cwd }),
    };
  }

  assertRunnableStage(stage);
  const agentId = resolveStageAgentId(state, stage, options.agentId);
  const agent = resolveAgentConfig(state, agentId);
  assertSafeCommand(agent);
  const generated = writeGeneratedPrompt(state, {
    cwd: options.cwd,
    stage,
    now: options.now,
  });

  return {
    stage,
    agentId: agent.agentId,
    agentIdentity: agent.identity,
    command: agent.command,
    args: agent.args,
    promptPath: generated.outputPath.replace(/\\/g, "/"),
    runDirectory: getRunDirectory(state, { cwd: options.cwd }).replace(/\\/g, "/"),
    nextExpectedStep: getNextExpectedStep(stage),
    blocked: false,
  };
}

async function runWorkflowCommand(state, options = {}) {
  let currentState = state;
  const steps = [];
  const untilBlocked = Boolean(options.untilBlocked);
  const maxSteps = normalizeMaxSteps(options.maxSteps, untilBlocked ? DEFAULT_MAX_WORKFLOW_RUN_STEPS : 1);
  let stopReason = "single-stage-complete";
  let errorMessage = "";

  for (let stepIndex = 0; stepIndex < maxSteps; stepIndex += 1) {
    const stage = stepIndex === 0 && options.stage ? options.stage : determineNextStage(currentState);
    if (stage === "human-merge-decision") {
      stopReason = "human-merge-decision";
      break;
    }

    try {
      const run = await runWorkflowAgent(currentState, {
        cwd: options.cwd,
        stage,
        agentId: stepIndex === 0 ? options.agentId : undefined,
        timeoutMs: options.timeoutMs,
        processAdapter: options.processAdapter,
        now: options.now,
      });
      currentState = run.state;
      const step = createStepSummary(run);
      steps.push(step);

      if (isFailedOutputState(step.outputState)) {
        stopReason = "failure";
        break;
      }

      if (!untilBlocked) {
        stopReason = "single-stage-complete";
        break;
      }
    } catch (error) {
      stopReason = "missing-agent";
      errorMessage = error.message;
      break;
    }
  }

  if (untilBlocked && steps.length >= maxSteps && stopReason === "single-stage-complete") {
    stopReason = "max-steps";
  }

  return {
    steps,
    stopReason,
    errorMessage,
    nextStage: determineNextStage(currentState),
    state: currentState,
  };
}

async function runWorkflowCommandAndPersist(statePath, options = {}) {
  const state = readState(statePath);
  const summary = await runWorkflowCommand(state, options);
  writeState(statePath, summary.state);
  return { ...summary, statePath };
}

module.exports = {
  DEFAULT_MAX_WORKFLOW_RUN_STEPS,
  createDryRunSummary,
  normalizeMaxSteps,
  runWorkflowCommand,
  runWorkflowCommandAndPersist,
};
