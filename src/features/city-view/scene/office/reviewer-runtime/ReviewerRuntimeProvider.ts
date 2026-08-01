import type { ReviewerRuntimeDecision, ReviewerRuntimeEvidence, ReviewerRuntimeFinding, ReviewerRuntimeStatus } from "./ReviewerRuntimeTypes";

export type ReviewerRuntimeProviderCommand = {
  command: string;
  arguments: ReadonlyArray<string>;
  inputMode: "argument" | "stdin";
  workingDirectory: string;
  prompt: string;
  timeoutMs: number;
  reviewTargetSha: string;
};

export type ReviewerRuntimeProviderResult = {
  status: ReviewerRuntimeStatus;
  decision: ReviewerRuntimeDecision;
  findings: ReviewerRuntimeFinding[];
  evidence: ReviewerRuntimeEvidence;
};

/**
 * Provider-neutral boundary for invoking a Reviewer agent process.
 * No mutation methods exist on this contract by design -- only a single,
 * bounded, terminal invocation. See contracts/provider-contract.md.
 */
export type ReviewerRuntimeProvider = {
  readonly providerId: string;
  invoke(command: ReviewerRuntimeProviderCommand): Promise<ReviewerRuntimeProviderResult>;
};
