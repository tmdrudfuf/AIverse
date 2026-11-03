import { isSafeCommandLine } from "../runtime-preflight/RuntimePreflightProvider";
import { SPAWN_ALLOW_ENV_VAR, hasPathTraversal } from "./ClaudeImplementerRuntimeProvider";
import type {
  ImplementerRuntimeProvider,
  ImplementerRuntimeProviderCommand,
  ImplementerRuntimeProviderResult,
} from "./ImplementerRuntimeProvider";

const PROVIDER_UNAVAILABLE_MESSAGE = "The external ADOS child-run gateway is not available in this environment.";
const SPAWN_NOT_EXPLICITLY_ALLOWED_MESSAGE =
  `Real ADOS child-run spawn requires ${SPAWN_ALLOW_ENV_VAR}=1 to be set explicitly.`;

type ChildRunReadiness = {
  childRunId: string;
  candidateSha: string;
  reviewDecision: "Approved" | "Changes Requested" | "Questions" | "Unknown";
  validatedMatchesCandidate: boolean;
  reviewedMatchesCandidate: boolean;
  exactHeadMatch: boolean;
  ready: boolean;
};

type ChildRunCycleResult = {
  childRunId: string;
  repoPath: string;
  statePath: string;
  exitCode: number | null;
  timedOut: boolean;
  stdout: string;
  stderr: string;
  durableAdosRunId: string;
  readiness: ChildRunReadiness;
};

export type ExternalAdosChildRunGatewayModule = {
  runExternalAdosChildRunCycle: (input: {
    appRoot?: string;
    disposableRoot?: string;
    repositoryHint?: string;
    taskScope?: string;
    timeoutMs?: number;
  }) => ChildRunCycleResult;
  FORBIDDEN_REPOSITORY_HINTS: Set<string>;
};

/**
 * Real ADOS child-run gateway for the Spec 148 human-authorized child-run
 * architecture: drives tools/agent-workflow/externalAdosChildRunGateway.js
 * (the real, unmodified `cli.js orchestrate` engine against a fresh
 * disposable local repository) and surfaces re-verified readiness as
 * evidence.
 *
 * Unlike ClaudeImplementerRuntimeProvider, this provider never dynamically
 * imports its Node module itself: `tools/agent-workflow/*.js` is not a
 * `node:`-prefixed builtin, so a relative import of it (even a dynamic one)
 * is a real module specifier webpack would try to resolve and bundle at
 * `npm run build` time -- transitively pulling in `child_process`/`fs` and
 * breaking the browser build (see plan.md, Architecture Decision 2, and
 * project memory on the represented-provider pattern). Instead the gateway
 * module is constructor-injected, mirroring the controller's existing
 * `options.projectBacklogSuggestionProvider` override pattern: production
 * browser wiring never supplies one (this provider then reports `Blocked`,
 * identically to ClaudeImplementerRuntimeProvider's browser guard), and only
 * a genuine Node context (a Vitest suite, or a manual smoke script) requires
 * the real .js file and passes it in.
 */
export class ExternalAdosChildRunImplementerProvider implements ImplementerRuntimeProvider {
  readonly providerId = "external-ados-child-run";

  constructor(private readonly gatewayModule?: ExternalAdosChildRunGatewayModule) {}

  async invoke(command: ImplementerRuntimeProviderCommand): Promise<ImplementerRuntimeProviderResult> {
    const commandDisplay = [command.command, ...command.arguments].join(" ");

    if (!isSafeCommandLine(commandDisplay) || hasPathTraversal(command.workingDirectory)) {
      return blocked(command, commandDisplay, "Command rejected by safety validation.");
    }

    const gatewayModule = this.resolveGatewayModule();
    if (!gatewayModule) {
      const message = typeof window !== "undefined" ? PROVIDER_UNAVAILABLE_MESSAGE : SPAWN_NOT_EXPLICITLY_ALLOWED_MESSAGE;
      return blocked(command, commandDisplay, message);
    }

    const repositoryHint = (command.workingDirectory.split(/[\\/]/).filter(Boolean).pop() ?? "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
    if (gatewayModule.FORBIDDEN_REPOSITORY_HINTS.has(repositoryHint)) {
      return blocked(command, commandDisplay, "Refusing to bind the ADOS child run to a forbidden repository.");
    }

    const startedAt = Date.now();
    let cycle: ChildRunCycleResult;
    try {
      cycle = gatewayModule.runExternalAdosChildRunCycle({
        taskScope: command.prompt,
        timeoutMs: command.timeoutMs,
      });
    } catch (error) {
      return {
        status: "Failed",
        evidence: createEvidence(command, commandDisplay, {
          started: false,
          completed: false,
          timedOut: false,
          cancelled: false,
          durationMs: Date.now() - startedAt,
          stdoutSummary: "",
          stderrSummary: error instanceof Error ? error.message : "The ADOS child run could not be started.",
          outputTruncated: false,
        }),
      };
    }

    const durationMs = Date.now() - startedAt;
    if (cycle.timedOut) {
      return {
        status: "TimedOut",
        evidence: createEvidence(command, commandDisplay, {
          started: true,
          completed: false,
          timedOut: true,
          cancelled: false,
          durationMs,
          stdoutSummary: cycle.stdout,
          stderrSummary: cycle.stderr,
          outputTruncated: false,
          durableAdosRunId: cycle.durableAdosRunId,
        }),
      };
    }

    // "Completed" means the real child-run cycle ran to a bounded result --
    // it does not by itself mean the run reached technical publication
    // readiness. That is exactly what `readiness.ready` (re-derived from the
    // real engine's own summary, never a caller confirmation) is for.
    return {
      status: "Completed",
      evidence: createEvidence(command, commandDisplay, {
        started: true,
        completed: true,
        timedOut: false,
        cancelled: false,
        exitCode: cycle.exitCode ?? undefined,
        durationMs,
        stdoutSummary: cycle.stdout,
        stderrSummary: cycle.stderr,
        outputTruncated: false,
        durableAdosRunId: cycle.durableAdosRunId,
        childRunTechnicalReadiness: cycle.readiness,
      }),
    };
  }

  private resolveGatewayModule(): ExternalAdosChildRunGatewayModule | undefined {
    if (!this.gatewayModule) return undefined;
    if (typeof window !== "undefined") return undefined;
    if (process.env[SPAWN_ALLOW_ENV_VAR] !== "1") return undefined;
    return this.gatewayModule;
  }
}

function blocked(
  command: ImplementerRuntimeProviderCommand,
  commandDisplay: string,
  message: string,
): ImplementerRuntimeProviderResult {
  return {
    status: "Blocked",
    evidence: createEvidence(command, commandDisplay, {
      started: false,
      completed: false,
      timedOut: false,
      cancelled: false,
      durationMs: 0,
      stdoutSummary: "",
      stderrSummary: message,
      outputTruncated: false,
    }),
  };
}

function createEvidence(
  command: ImplementerRuntimeProviderCommand,
  commandDisplay: string,
  fields: {
    started: boolean;
    completed: boolean;
    timedOut: boolean;
    cancelled: boolean;
    exitCode?: number;
    durationMs: number;
    stdoutSummary: string;
    stderrSummary: string;
    outputTruncated: boolean;
    durableAdosRunId?: string;
    childRunTechnicalReadiness?: ChildRunReadiness;
  },
) {
  return {
    providerId: "external-ados-child-run",
    agentId: "Claude",
    role: "Implementer" as const,
    commandDisplay,
    workingDirectory: command.workingDirectory,
    ...fields,
  };
}
