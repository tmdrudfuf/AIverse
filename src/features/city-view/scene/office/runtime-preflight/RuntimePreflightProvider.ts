import type {
  RuntimeEnvironmentProvider,
  RuntimePreflightEvidence,
  RuntimePreflightProviderRequest,
} from "./RuntimePreflightTypes";

export class RepresentedRuntimeEnvironmentProvider implements RuntimeEnvironmentProvider {
  inspect(request: RuntimePreflightProviderRequest): RuntimePreflightEvidence {
    const plan = request.executionPlan;
    const validationCommands = [...request.approvedCommands];
    const mutationScope = [...request.approvedMutationScope];
    return {
      repository: {
        projectId: request.projectId,
        repositoryId: plan.repositoryId,
        pathExists: Boolean(plan.repositoryPath),
        isDirectory: Boolean(plan.repositoryPath),
        isGitRepository: Boolean(plan.repositoryId),
        normalizedPath: plan.repositoryPath,
      },
      worktree: {
        pathExists: Boolean(plan.worktreePath),
        isDirectory: Boolean(plan.worktreePath),
        isGitWorktree: Boolean(plan.repositoryId && plan.worktreePath),
        normalizedPath: plan.worktreePath,
        isPrimaryWorktree: plan.worktreePath === plan.repositoryPath && plan.branchName === "main",
      },
      branch: {
        currentBranch: plan.branchName,
        detached: false,
      },
      workingTree: {
        clean: true,
        stagedChanges: false,
        unstagedChanges: false,
        untrackedFiles: false,
        mergeState: false,
        rebaseState: false,
        conflicts: false,
      },
      specification: {
        pathExists: Boolean(plan.specPath),
        normalizedPath: plan.specPath,
        insideWorktree: Boolean(plan.specPath && !plan.specPath.includes("..") && !isAbsolutePath(plan.specPath)),
        featureMatches: Boolean(plan.specPath && plan.specPath.includes(plan.featureId)),
        requiredArtifactsPresent: Boolean(plan.specPath),
      },
      implementer: {
        role: "Implementer",
        agentLabel: plan.implementerAgent,
        configuredCommand: normalizeAgentCommand(plan.implementerAgent),
        configuredArguments: ["--version"],
        available: Boolean(plan.implementerAgent),
        commandSafe: isSafeCommandLine(`${normalizeAgentCommand(plan.implementerAgent)} --version`),
        detectionExitCode: 0,
      },
      reviewer: {
        role: "Reviewer",
        agentLabel: plan.reviewerAgent,
        configuredCommand: normalizeAgentCommand(plan.reviewerAgent),
        configuredArguments: ["--version"],
        available: Boolean(plan.reviewerAgent),
        commandSafe: isSafeCommandLine(`${normalizeAgentCommand(plan.reviewerAgent)} --version`),
        detectionExitCode: 0,
      },
      validationCommands: {
        commands: validationCommands,
        commandsSafe: validationCommands.every(isSafeCommandLine),
      },
      mutationScope: {
        scope: mutationScope,
        scopeSafe: mutationScope.every(isSafeMutationScope),
      },
      runtimeEnvironment: {
        supported: true,
        spawnAvailable: true,
        safeWorkingDirectory: Boolean(plan.worktreePath),
      },
    };
  }
}

export function isSafeCommandLine(command: string) {
  const normalized = command.trim().toLowerCase();
  if (!normalized) return false;
  if (/(^|\s)(git\s+push|git\s+commit|git\s+checkout|git\s+switch|git\s+reset|git\s+clean|git\s+merge|git\s+rebase|git\s+cherry-pick)(\s|$)/.test(normalized)) {
    return false;
  }
  if (/(^|\s)(gh\s+pr\s+(create|merge|ready)|gh\s+issue\s+edit|gh\s+repo\s+edit)(\s|$)/.test(normalized)) {
    return false;
  }
  if (/(rm\s+-rf|del\s+\/s|format\s|shutdown|invoke-webrequest|curl\s+.*github|powershell\s+.*git\s+push)/.test(normalized)) {
    return false;
  }
  return true;
}

function normalizeAgentCommand(agentLabel: string) {
  const normalized = agentLabel.trim().toLowerCase();
  if (normalized.includes("codex") || normalized === "implementer") return "codex";
  if (normalized.includes("claude") || normalized === "reviewer") return "claude";
  return agentLabel.trim();
}

function isSafeMutationScope(entry: string) {
  const normalized = entry.toLowerCase();
  if (normalized.startsWith("no-")) return true;
  return !/(github|remote|push|runtime|subprocess|execution|codex|claude|primary-worktree)/.test(normalized);
}

function isAbsolutePath(value: string) {
  return /^[a-z]:[\\/]/i.test(value) || value.startsWith("/") || value.startsWith("\\\\");
}
