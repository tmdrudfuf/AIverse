import { createImplementerPromptId } from "./ImplementerRuntimeTypes";

const PROMPT_MAX_LENGTH = 4000;

export type ImplementerPromptInput = {
  projectId: string;
  runtimeStartId: string;
  featureId: string;
  specificationPath: string;
  taskId: string;
  worktreePath: string;
  branch: string;
  implementerRoleLabel: string;
  reviewerRoleLabel: string;
  approvedImplementerAgent: string;
  approvedReviewerAgent: string;
  validationCommands: ReadonlyArray<string>;
  mutationScope: ReadonlyArray<string>;
};

export type ImplementerPrompt = {
  promptId: string;
  text: string;
};

/**
 * Builds a bounded, deterministic prompt from approved product state only.
 * Never includes secrets, tokens, raw environment variables, or unrelated
 * dashboard/issue data.
 */
export function createImplementerPrompt(input: ImplementerPromptInput): ImplementerPrompt {
  const promptId = createImplementerPromptId(input.projectId, input.runtimeStartId);

  const lines = [
    "You are the Implementer.",
    `Implementer: ${input.approvedImplementerAgent} (role: ${input.implementerRoleLabel})`,
    `Reviewer: ${input.approvedReviewerAgent} (role: ${input.reviewerRoleLabel})`,
    `Project: ${input.projectId}`,
    `Feature: ${input.featureId}`,
    `Specification: ${input.specificationPath}`,
    `Task: ${input.taskId}`,
    `Worktree: ${input.worktreePath}`,
    `Branch: ${input.branch}`,
    `Approved validation commands: ${input.validationCommands.join(", ") || "none"}`,
    `Approved mutation scope: ${input.mutationScope.join(", ") || "none"}`,
    "Do not invoke Codex.",
    "Do not perform the independent review yourself.",
    "Do not push.",
    "Do not create a PR.",
    "Do not mark a PR Ready.",
    "Do not merge.",
    "Do not perform GitHub mutation.",
    "Do not modify user-level Claude settings.",
    "Do not modify user-level Codex settings.",
    "Do not modify global Git configuration.",
  ];

  const text = boundPromptText(lines.join("\n"));
  return { promptId, text };
}

function boundPromptText(text: string) {
  if (text.length <= PROMPT_MAX_LENGTH) return text;
  return `${text.slice(0, PROMPT_MAX_LENGTH)}...`;
}
