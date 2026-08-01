import { createReviewerPromptId } from "./ReviewerRuntimeTypes";

const PROMPT_MAX_LENGTH = 4000;
const MAX_CHANGED_FILES_LISTED = 25;

export type ReviewerPromptInput = {
  projectId: string;
  reviewTargetId: string;
  featureId: string;
  specificationPath: string;
  worktreePath: string;
  baseBranch: string;
  baseSha: string;
  featureBranch: string;
  reviewTargetSha: string;
  mergeBaseSha: string;
  changedFiles: ReadonlyArray<string>;
  approvedImplementerAgent: string;
  approvedReviewerAgent: string;
};

export type ReviewerPrompt = {
  promptId: string;
  text: string;
};

/**
 * Builds a bounded, deterministic Reviewer prompt from approved product
 * state only. Never includes secrets, tokens, raw environment variables,
 * hidden prompts, unrelated transcripts, or an unbounded diff -- the changed
 * file list is capped and no full diff text is ever embedded (see
 * contracts/prompt-contract.md, "Review Input Boundary").
 */
export function createReviewerPrompt(input: ReviewerPromptInput): ReviewerPrompt {
  const promptId = createReviewerPromptId(input.projectId, input.reviewTargetId);
  const changedFiles = input.changedFiles.slice(0, MAX_CHANGED_FILES_LISTED);
  const changedFilesOverflow = input.changedFiles.length - changedFiles.length;

  // Prohibition and output-format clauses are emitted first, deliberately
  // ahead of the unbounded-length context fields (paths, branches, the
  // changed-file list). boundPromptText truncates the tail of the joined
  // text, so anything after these clauses may be cut -- these clauses
  // themselves must never be at risk of truncation.
  const lines = [
    "You are the independent Reviewer.",
    "Do not modify any file.",
    "Do not implement a fix.",
    "Do not stage or commit any change.",
    "Do not push.",
    "Do not create or update a PR.",
    "Do not merge.",
    "Do not perform any GitHub mutation.",
    "Do not invoke Claude.",
    "Do not modify user-level Claude settings.",
    "Do not modify user-level Codex settings.",
    "Do not modify global Git configuration.",
    "Return a clear decision using exactly one of:",
    "Decision: Approved",
    "Decision: Changes Requested",
    "List any findings as: Finding: <P1|P2|P3> | <blocking|non-blocking> | <category> | <path[:line]> | <message> | <suggestion>",
    "Inspect the exact review target commit in the worktree yourself.",
    `Implementer: ${input.approvedImplementerAgent} (Claude CLI)`,
    `Reviewer: ${input.approvedReviewerAgent} (Codex CLI)`,
    `Project: ${input.projectId}`,
    `Feature: ${input.featureId}`,
    `Specification: ${input.specificationPath}`,
    `Worktree: ${input.worktreePath}`,
    `Base branch: ${input.baseBranch} (${input.baseSha})`,
    `Feature branch: ${input.featureBranch}`,
    `Review target commit: ${input.reviewTargetSha}`,
    `Merge base: ${input.mergeBaseSha}`,
    `Changed files: ${changedFiles.join(", ") || "none"}${changedFilesOverflow > 0 ? ` (+${changedFilesOverflow} more)` : ""}`,
  ];

  const text = boundPromptText(lines.join("\n"));
  return { promptId, text };
}

function boundPromptText(text: string) {
  if (text.length <= PROMPT_MAX_LENGTH) return text;
  return `${text.slice(0, PROMPT_MAX_LENGTH)}...`;
}
