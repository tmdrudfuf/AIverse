import type { ReviewFixPlan } from "../review-fix-plans/ReviewFixPlanTypes";
import { createReviewFixRuntimePromptId } from "./ReviewFixRuntimeTypes";

const PROMPT_MAX_LENGTH = 4000;

export function createReviewFixRuntimePrompt(plan: ReviewFixPlan) {
  const promptId = createReviewFixRuntimePromptId(plan.projectId, plan.reviewFixPlanId);
  const text = [
    "You are the configured Implementer for a bounded Review Fix Runtime.",
    "",
    "Execute only the exact current Review Fix Plan context below.",
    `Project: ${plan.projectId}`,
    `Review Fix Plan: ${plan.reviewFixPlanId}`,
    `Review Fix Request: ${plan.reviewFixRequestId}`,
    `Execution Plan: ${plan.planId}`,
    `Project Task: ${plan.projectTaskId}`,
    `Repository: ${plan.repositoryId}`,
    `Worktree: ${plan.worktreePath}`,
    `Branch: ${plan.branch}`,
    `Review Target: ${plan.reviewTargetId}`,
    `Expected review decision: ${plan.decision}`,
    `Blocking findings: ${plan.blockingFindingCount}`,
    `Implementer role: ${plan.implementer}`,
    `Reviewer role: ${plan.reviewer}`,
    "",
    "Allowed mutation scope:",
    ...plan.mutationScope.map((scope) => `- ${scope}`),
    "",
    "Validation commands are recorded for later validation only; do not start Validation Runtime from this feature:",
    ...plan.validationCommands.map((command) => `- ${command}`),
    "",
    "Do not push, mutate GitHub, create or update a PR, mark Ready for Review, merge, deploy, delete branches, delete worktrees, start a reviewer runtime, or promote any review result.",
  ].join("\n");

  return {
    promptId,
    text: text.length <= PROMPT_MAX_LENGTH ? text : text.slice(0, PROMPT_MAX_LENGTH),
  };
}
