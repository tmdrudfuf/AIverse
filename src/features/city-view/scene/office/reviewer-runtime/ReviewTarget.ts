import type { ExecutionPlan } from "../execution-plans/ExecutionPlanTypes";
import type { ImplementerRuntime } from "../implementer-runtime/ImplementerRuntimeTypes";
import type { RuntimeStart } from "../runtime-start/RuntimeStartTypes";

export const REVIEW_TARGET_RULES_VERSION = "review-target-v1";

export type ReviewTargetWorkingTreeState = "Clean" | "Uncommitted";

export type ReviewTarget = {
  reviewTargetId: string;
  projectId: string;
  runtimeStartId: string;
  implementerRuntimeId: string;
  repositoryId: string;
  worktreePath: string;
  baseBranch: string;
  baseSha: string;
  featureBranch: string;
  reviewTargetSha: string;
  mergeBaseSha: string;
  workingTreeState: ReviewTargetWorkingTreeState;
  changedFiles: ReadonlyArray<string>;
  specificationPath: string;
  resolvedAt: string;
  rulesVersion: string;
};

export function createReviewTargetId(
  projectId: string,
  runtimeStartId: string,
  reviewTargetSha: string,
  rulesVersion = REVIEW_TARGET_RULES_VERSION,
) {
  return `${projectId}:review-target:${runtimeStartId}:${reviewTargetSha}:${rulesVersion}`;
}

export function copyReviewTarget(target: ReviewTarget): ReviewTarget {
  return { ...target, changedFiles: [...target.changedFiles] };
}

/**
 * Deterministic, zero-I/O review target resolution -- the same "represented"
 * pattern every pre-Spec-075 stage uses (see plan.md, Architecture Decision
 * 1). This repository's simulated pipeline has no product-side "create a
 * commit" stage, so a represented resolution cannot honestly claim a clean,
 * committed tree: it always reports `workingTreeState: "Uncommitted"`,
 * matching the spec's explicit fallback ("mark clearly Uncommitted, never
 * satisfy the exact-HEAD gate") rather than fabricating a committed target
 * the way earlier stages fabricate `workingTree.clean: true`. Only a real,
 * double-gated git inspection (out of scope for this feature, mirroring how
 * only the concrete Claude provider ever does real I/O) could honestly
 * produce `"Clean"`. Tests exercise the `"Clean"` path directly by
 * constructing a `ReviewTarget` fixture rather than through this function.
 */
export function resolveReviewTarget(
  plan: ExecutionPlan,
  runtimeStart: RuntimeStart,
  implementerRuntime: ImplementerRuntime,
): ReviewTarget {
  const reviewTargetSha = representedSha(implementerRuntime.implementerRuntimeId);
  const baseSha = representedSha(`${plan.projectId}:${plan.planId}:base`);
  return {
    reviewTargetId: createReviewTargetId(plan.projectId, runtimeStart.runtimeStartId, reviewTargetSha),
    projectId: plan.projectId,
    runtimeStartId: runtimeStart.runtimeStartId,
    implementerRuntimeId: implementerRuntime.implementerRuntimeId,
    repositoryId: plan.repositoryId,
    worktreePath: plan.worktreePath,
    baseBranch: "main",
    baseSha,
    featureBranch: plan.branchName,
    reviewTargetSha,
    mergeBaseSha: baseSha,
    workingTreeState: "Uncommitted",
    changedFiles: [],
    specificationPath: plan.specPath,
    resolvedAt: implementerRuntime.startedAt,
    rulesVersion: REVIEW_TARGET_RULES_VERSION,
  };
}

function representedSha(seed: string) {
  let hash1 = 0x811c9dc5;
  let hash2 = 0x9e3779b9;
  for (let index = 0; index < seed.length; index += 1) {
    const code = seed.charCodeAt(index);
    hash1 = (hash1 ^ code) >>> 0;
    hash1 = Math.imul(hash1, 0x01000193) >>> 0;
    hash2 = Math.imul(hash2 ^ code, 0x85ebca6b) >>> 0;
  }
  return `${hash1.toString(16).padStart(8, "0")}${hash2.toString(16).padStart(8, "0")}`.padEnd(40, "0").slice(0, 40);
}
