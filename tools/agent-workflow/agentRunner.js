const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const {
  WORKFLOW_STAGES,
  createRunFilePath,
  detectDecision,
  determineNextStage,
  generatePrompt,
  listForbiddenExecutablePatterns,
  recordAgentResult,
  writeState,
} = require("./agentWorkflow.js");

const DEFAULT_AGENT_RUNNER_TIMEOUT_MS = 5 * 60 * 1000;

const DEFAULT_AGENT_RUNNERS = {
  codex: {
    agentId: "codex",
    identity: "OpenAI Codex CLI",
    command: "codex",
    args: [],
    inputMode: "stdin",
    timeoutMs: DEFAULT_AGENT_RUNNER_TIMEOUT_MS,
  },
  claude: {
    agentId: "claude",
    identity: "Claude Code CLI",
    command: "claude",
    args: [],
    inputMode: "stdin",
    timeoutMs: DEFAULT_AGENT_RUNNER_TIMEOUT_MS,
  },
};

const DEFAULT_STAGE_AGENTS = {
  implement: "codex",
  review: "claude",
  fix: "codex",
  "re-review": "claude",
  "final-verification": "codex",
};

function normalizeAgentConfig(config) {
  if (!config || typeof config !== "object") {
    throw new Error("Agent runner config is required");
  }

  return {
    agentId: String(config.agentId || "agent"),
    identity: String(config.identity || config.agentId || "Agent CLI"),
    command: String(config.command || ""),
    args: Array.isArray(config.args) ? config.args.map((arg) => String(arg)) : [],
    inputMode: config.inputMode || "stdin",
    timeoutMs: Number.isFinite(config.timeoutMs) && config.timeoutMs > 0
      ? config.timeoutMs
      : DEFAULT_AGENT_RUNNER_TIMEOUT_MS,
  };
}

function getAgentRunners(state) {
  return {
    ...DEFAULT_AGENT_RUNNERS,
    ...(state.agentRunners || {}),
  };
}

function getStageAgents(state) {
  return {
    ...DEFAULT_STAGE_AGENTS,
    ...(state.stageAgents || {}),
  };
}

function resolveAgentConfig(state, agentId) {
  const runners = getAgentRunners(state);
  const config = runners[agentId];
  if (!config) throw new Error(`No agent runner configured for ${agentId}`);
  return normalizeAgentConfig({ ...config, agentId: config.agentId || agentId });
}

function resolveStageAgentId(state, stage, explicitAgentId) {
  if (explicitAgentId) return explicitAgentId;
  const stageAgents = getStageAgents(state);
  const agentId = stageAgents[stage];
  if (!agentId) throw new Error(`No default agent configured for stage ${stage}`);
  return agentId;
}

function assertRunnableStage(stage) {
  if (!WORKFLOW_STAGES.includes(stage)) throw new Error(`Unsupported workflow stage: ${stage}`);
  if (stage === "human-merge-decision") {
    throw new Error("human-merge-decision is human-only and must not invoke an agent CLI");
  }
}

function isRemoteMutatingCommand(command, args = []) {
  const normalizedCommand = path.basename(String(command || "")).toLowerCase().replace(/\.(cmd|exe)$/i, "");
  const normalizedArgs = args.map((arg) => String(arg).toLowerCase());
  if (normalizedCommand === "git") {
    if (normalizedArgs[0] === "push") return true;
    if (normalizedArgs[0] === "branch" && ["-d", "-D", "--delete"].includes(normalizedArgs[1])) return true;
  }
  if (normalizedCommand === "gh" && normalizedArgs[0] === "pr") {
    return ["create", "ready", "merge"].includes(normalizedArgs[1]);
  }
  return false;
}

function assertSafeCommand(config) {
  if (!config.command) throw new Error("Agent runner command is required");
  if (isRemoteMutatingCommand(config.command, config.args)) {
    throw new Error("Remote-mutating commands are human-only and cannot be executed by the agent runner");
  }
}

function createDefaultProcessAdapter() {
  return {
    run(command, args = [], options = {}) {
      return new Promise((resolve) => {
        const startedAtMs = Date.now();
        const child = spawn(command, args, {
          cwd: options.cwd,
          shell: false,
          windowsHide: true,
          stdio: ["pipe", "pipe", "pipe"],
        });
        let stdout = "";
        let stderr = "";
        let settled = false;
        let timedOut = false;

        const timeout = setTimeout(() => {
          timedOut = true;
          child.kill("SIGTERM");
        }, options.timeoutMs || DEFAULT_AGENT_RUNNER_TIMEOUT_MS);

        child.stdout.on("data", (chunk) => {
          stdout += chunk.toString();
        });
        child.stderr.on("data", (chunk) => {
          stderr += chunk.toString();
        });
        child.on("error", (error) => {
          if (settled) return;
          settled = true;
          clearTimeout(timeout);
          resolve({
            stdout,
            stderr: stderr || error.message,
            exitCode: null,
            signal: null,
            timedOut,
            interrupted: false,
            durationMs: Date.now() - startedAtMs,
            errorMessage: error.message,
          });
        });
        child.on("close", (exitCode, signal) => {
          if (settled) return;
          settled = true;
          clearTimeout(timeout);
          resolve({
            stdout,
            stderr,
            exitCode,
            signal,
            timedOut,
            interrupted: Boolean(signal) && !timedOut,
            durationMs: Date.now() - startedAtMs,
          });
        });

        if (options.input) child.stdin.write(options.input);
        child.stdin.end();
      });
    },
  };
}

async function detectAgentCli(config, options = {}) {
  const agent = normalizeAgentConfig(config);
  assertSafeCommand({ ...agent, args: ["--version"] });
  const adapter = options.processAdapter || createDefaultProcessAdapter();
  const startedAt = new Date().toISOString();
  const result = await adapter.run(agent.command, ["--version"], {
    cwd: options.cwd || process.cwd(),
    timeoutMs: options.timeoutMs || Math.min(agent.timeoutMs, 30_000),
  });

  return {
    agentId: agent.agentId,
    identity: agent.identity,
    command: agent.command,
    installed: result.exitCode === 0,
    exitCode: result.exitCode,
    signal: result.signal || null,
    timedOut: Boolean(result.timedOut),
    interrupted: Boolean(result.interrupted),
    stdout: result.stdout || "",
    stderr: result.stderr || "",
    errorMessage: result.errorMessage || "",
    durationMs: result.durationMs || 0,
    startedAt,
    completedAt: new Date().toISOString(),
  };
}

function classifyOutput(result) {
  if (result.timedOut) return "timeout";
  if (result.interrupted || result.signal) return "interrupted";
  if (result.exitCode !== 0) return "non-zero";
  if (!String(result.stdout || "").trim() && !String(result.stderr || "").trim()) return "empty";
  return "ok";
}

async function runWorkflowAgent(state, options = {}) {
  const stage = options.stage || determineNextStage(state);
  assertRunnableStage(stage);
  const agentId = resolveStageAgentId(state, stage, options.agentId);
  const agent = resolveAgentConfig(state, agentId);
  const timeoutMs = options.timeoutMs || agent.timeoutMs;
  assertSafeCommand(agent);

  const adapter = options.processAdapter || createDefaultProcessAdapter();
  const generated = generatePrompt(state, { stage });
  const startedAt = new Date().toISOString();
  const result = await adapter.run(agent.command, agent.args, {
    cwd: options.cwd || process.cwd(),
    input: generated.prompt,
    timeoutMs,
  });
  const completedAt = new Date().toISOString();
  const outputText = [result.stdout || "", result.stderr || ""].filter(Boolean).join("\n");
  const executionRecord = {
    featureId: state.featureId,
    stage,
    agentId: agent.agentId,
    agentIdentity: agent.identity,
    command: agent.command,
    args: agent.args,
    startedAt,
    completedAt,
    durationMs: result.durationMs || 0,
    exitCode: result.exitCode,
    signal: result.signal || null,
    timedOut: Boolean(result.timedOut),
    interrupted: Boolean(result.interrupted),
    outputState: classifyOutput(result),
    stdout: result.stdout || "",
    stderr: result.stderr || "",
    errorMessage: result.errorMessage || "",
    decision: detectDecision(outputText),
  };

  const recordPath = createRunFilePath(state, `${stage}-${agent.agentId}-execution`, {
    cwd: options.cwd || process.cwd(),
    now: options.now,
  });
  fs.mkdirSync(path.dirname(recordPath), { recursive: true });
  fs.writeFileSync(recordPath, `${JSON.stringify(executionRecord, null, 2)}\n`, "utf8");

  const recorded = recordAgentResult(
    state,
    {
      stage,
      agent: agent.identity,
      resultText: outputText,
      outputPath: createRunFilePath(state, `${stage}-${agent.agentId}-result`, {
        cwd: options.cwd || process.cwd(),
        now: options.now,
      }),
    },
    {
      cwd: options.cwd || process.cwd(),
      recordedAt: completedAt,
      now: options.now,
    },
  );
  const nextState = {
    ...recorded.state,
    agentExecutions: [
      ...(Array.isArray(state.agentExecutions) ? state.agentExecutions : []),
      {
        path: path.relative(options.cwd || process.cwd(), recordPath).replace(/\\/g, "/"),
        stage,
        agentId: agent.agentId,
        outputState: executionRecord.outputState,
        exitCode: executionRecord.exitCode,
        timedOut: executionRecord.timedOut,
        interrupted: executionRecord.interrupted,
      },
    ],
  };

  return { state: nextState, prompt: generated.prompt, executionRecord, recordPath, resultPath: recorded.outputPath };
}

async function runWorkflowAgentAndPersist(statePath, options = {}) {
  const state = JSON.parse(fs.readFileSync(statePath, "utf8"));
  const run = await runWorkflowAgent(state, options);
  writeState(statePath, run.state);
  return run;
}

module.exports = {
  DEFAULT_AGENT_RUNNER_TIMEOUT_MS,
  DEFAULT_AGENT_RUNNERS,
  DEFAULT_STAGE_AGENTS,
  assertRunnableStage,
  assertSafeCommand,
  createDefaultProcessAdapter,
  detectAgentCli,
  isRemoteMutatingCommand,
  normalizeAgentConfig,
  resolveAgentConfig,
  runWorkflowAgent,
  runWorkflowAgentAndPersist,
};
