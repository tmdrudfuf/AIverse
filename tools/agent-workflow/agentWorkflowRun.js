const fs = require("fs");

const {
  createRunFilePath,
  determineNextStage,
  getRunDirectory,
  readState,
  writeState,
} = require("./agentWorkflow.js");
const {
  DEFAULT_STAGE_AGENTS,
  assertRunnableStage,
  assertSafeCommand,
  resolveAgentConfig,
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

function createCommandPreview(agent) {
  const args = agent.args.map((arg) => (arg === "{{prompt}}" || arg === "{prompt}" ? "{{prompt}}" : arg));
  return [agent.command, ...args].filter(Boolean).join(" ");
}

function resolvePreviewStageAgentId(state, stage, explicitAgentId) {
  if (explicitAgentId) return explicitAgentId;
  const stageAgents = {
    ...DEFAULT_STAGE_AGENTS,
    ...(state.stageAgents || {}),
  };
  const agentId = stageAgents[stage];
  if (!agentId) throw new Error(`No default agent configured for stage ${stage}`);
  return agentId;
}

function getDryRunNextExpectedStep(stage) {
  if (stage === "implement") return "review";
  if (stage === "fix") return "re-review";
  if (stage === "final-verification") return "human-merge-decision";
  if (stage === "review" || stage === "re-review") return "depends-on-review-decision";
  return stage;
}

function previewWorkflowCommand(state, options = {}) {
  const stage = options.stage || determineNextStage(state);
  const nextStage = getDryRunNextExpectedStep(stage);
  const runDirectory = getRunDirectory(state, { cwd: options.cwd });

  if (stage === "human-merge-decision") {
    return {
      dryRun: true,
      stage,
      nextStage: "human-merge-decision",
      agentId: undefined,
      agentIdentity: "Human merge decision",
      commandPreview: "human-only",
      promptPath: undefined,
      runDirectory,
      willSpawn: false,
      humanGate: true,
    };
  }

  assertRunnableStage(stage);
  const agentId = resolvePreviewStageAgentId(state, stage, options.agentId);
  const agent = resolveAgentConfig(state, agentId);
  assertSafeCommand(agent);

  return {
    dryRun: true,
    stage,
    nextStage,
    agentId: agent.agentId,
    agentIdentity: agent.identity,
    commandPreview: createCommandPreview(agent),
    promptPath: createRunFilePath(state, `${stage}-prompt`, { cwd: options.cwd }).replace(/\\/g, "/"),
    runDirectory: runDirectory.replace(/\\/g, "/"),
    willSpawn: false,
    humanGate: false,
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
  previewWorkflowCommand,
  runWorkflowCommand,
  runWorkflowCommandAndPersist,
};
