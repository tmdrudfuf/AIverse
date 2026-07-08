const fs = require("fs");

const { determineNextStage, readState, writeState } = require("./agentWorkflow.js");
const { runWorkflowAgent } = require("./agentRunner.js");

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
  normalizeMaxSteps,
  runWorkflowCommand,
  runWorkflowCommandAndPersist,
};
