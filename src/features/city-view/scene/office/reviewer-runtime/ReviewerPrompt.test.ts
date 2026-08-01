import { describe, expect, it } from "vitest";

import { createReviewerPrompt, type ReviewerPromptInput } from "./ReviewerPrompt";

function createInput(overrides: Partial<ReviewerPromptInput> = {}): ReviewerPromptInput {
  return {
    projectId: "project-1",
    reviewTargetId: "review-target-1",
    featureId: "076-codex-reviewer-runtime-foundation",
    specificationPath: "specs/076-codex-reviewer-runtime-foundation/spec.md",
    worktreePath: "C:/worktrees/076",
    baseBranch: "main",
    baseSha: "abc123",
    featureBranch: "codex/076-codex-reviewer-runtime-foundation",
    reviewTargetSha: "def456",
    mergeBaseSha: "ghi789",
    changedFiles: ["src/a.ts", "src/b.ts"],
    approvedImplementerAgent: "claude",
    approvedReviewerAgent: "codex",
    ...overrides,
  };
}

describe("createReviewerPrompt", () => {
  it("produces a deterministic promptId from projectId/reviewTargetId/rulesVersion", () => {
    const first = createReviewerPrompt(createInput());
    const second = createReviewerPrompt(createInput());
    expect(first.promptId).toBe(second.promptId);
    expect(first.promptId).toContain("project-1");
    expect(first.promptId).toContain("review-target-1");
  });

  it("caps the changed files list and notes the overflow count", () => {
    const changedFiles = Array.from({ length: 30 }, (_, index) => `src/file-${index}.ts`);
    const prompt = createReviewerPrompt(createInput({ changedFiles }));
    expect(prompt.text).toContain("+5 more");
  });

  it("bounds the prompt to 4000 characters even with a long changed-files list", () => {
    const changedFiles = Array.from({ length: 25 }, (_, index) => `src/very/long/nested/directory/path/for/file-${index}.ts`);
    const prompt = createReviewerPrompt(createInput({ changedFiles, worktreePath: "C:/" + "x".repeat(500) }));
    expect(prompt.text.length).toBeLessThanOrEqual(4003);
  });

  it("keeps every mandatory prohibition and decision-format clause intact even when variable fields would overflow the 4000-character bound", () => {
    const changedFiles = Array.from({ length: 25 }, (_, index) => `src/very/long/nested/directory/path/for/file-${index}.ts`);
    const prompt = createReviewerPrompt(createInput({
      changedFiles,
      worktreePath: "C:/" + "x".repeat(1000),
      specificationPath: "specs/" + "y".repeat(1000),
    }));

    for (const clause of [
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
      "Decision: Approved",
      "Decision: Changes Requested",
      "Finding: <P1|P2|P3>",
    ]) {
      expect(prompt.text).toContain(clause);
    }
  });
});
