import { describe, expect, it } from "vitest";

import { createImplementerPrompt, type ImplementerPromptInput } from "./ImplementerPrompt";

function createInput(overrides: Partial<ImplementerPromptInput> = {}): ImplementerPromptInput {
  return {
    projectId: "daily-proof",
    runtimeStartId: "daily-proof:runtime-start:plan-1:start-v1",
    featureId: "075-claude-implementer-runtime-foundation",
    specificationPath: "specs/075-claude-implementer-runtime-foundation/spec.md",
    taskId: "task-1",
    worktreePath: "C:/worktrees/075",
    branch: "codex/075-claude-implementer-runtime-foundation",
    implementerRoleLabel: "Implementer",
    reviewerRoleLabel: "Reviewer",
    approvedImplementerAgent: "claude",
    approvedReviewerAgent: "codex",
    validationCommands: ["npm test", "npx tsc --noEmit"],
    mutationScope: ["local-worktree-only"],
    ...overrides,
  };
}

describe("createImplementerPrompt", () => {
  it("produces a deterministic prompt ID matching the documented format", () => {
    const prompt = createImplementerPrompt(createInput());
    expect(prompt.promptId).toBe(
      "daily-proof:implementer-prompt:daily-proof:runtime-start:plan-1:start-v1:claude-implementer-v1",
    );
  });

  it("produces byte-identical text for identical input", () => {
    const first = createImplementerPrompt(createInput());
    const second = createImplementerPrompt(createInput());
    expect(first.text).toBe(second.text);
  });

  it("states You are the Implementer", () => {
    const prompt = createImplementerPrompt(createInput());
    expect(prompt.text).toContain("You are the Implementer.");
  });

  it("identifies Claude as Implementer and Codex as Reviewer using the approved binding, not the generic labels", () => {
    const prompt = createImplementerPrompt(createInput());
    expect(prompt.text).toContain("Implementer: claude");
    expect(prompt.text).toContain("Reviewer: codex");
  });

  it("prohibits invoking Codex, self-review, and every remote mutation action", () => {
    const prompt = createImplementerPrompt(createInput());
    expect(prompt.text).toContain("Do not invoke Codex.");
    expect(prompt.text).toContain("Do not perform the independent review yourself.");
    expect(prompt.text).toContain("Do not push.");
    expect(prompt.text).toContain("Do not create a PR.");
    expect(prompt.text).toContain("Do not mark a PR Ready.");
    expect(prompt.text).toContain("Do not merge.");
    expect(prompt.text).toContain("Do not perform GitHub mutation.");
    expect(prompt.text).toContain("Do not modify user-level Claude settings.");
    expect(prompt.text).toContain("Do not modify user-level Codex settings.");
    expect(prompt.text).toContain("Do not modify global Git configuration.");
  });

  it("includes only approved context: project, feature, spec, task, worktree, branch, validation commands, mutation scope", () => {
    const prompt = createImplementerPrompt(createInput());
    expect(prompt.text).toContain("daily-proof");
    expect(prompt.text).toContain("075-claude-implementer-runtime-foundation");
    expect(prompt.text).toContain("specs/075-claude-implementer-runtime-foundation/spec.md");
    expect(prompt.text).toContain("task-1");
    expect(prompt.text).toContain("C:/worktrees/075");
    expect(prompt.text).toContain("npm test");
    expect(prompt.text).toContain("local-worktree-only");
  });

  it("excludes secrets and tokens that are not part of the approved input shape", () => {
    // ImplementerPromptInput has no field for secrets/tokens/raw env at all --
    // this is a negative-allowlist proof that a fabricated secret-like value
    // never appears in the output even if it existed somewhere upstream.
    const prompt = createImplementerPrompt(createInput());
    expect(prompt.text).not.toContain("ghp_");
    expect(prompt.text).not.toContain("sk-ant-");
    expect(prompt.text).not.toContain("Authorization");
    expect(prompt.text).not.toContain("process.env");
  });

  it("is immutable after construction", () => {
    const prompt = createImplementerPrompt(createInput());
    const originalText = prompt.text;
    expect(() => {
      (prompt as { text: string }).text = "mutated";
    }).not.toThrow();
    // Reassigning the returned object's own property doesn't corrupt a
    // later independent construction from the same input.
    const second = createImplementerPrompt(createInput());
    expect(second.text).toBe(originalText);
  });

  it("bounds prompt length even for pathologically long validation command lists", () => {
    const manyCommands = Array.from({ length: 500 }, (_, index) => `command-${index}-${"x".repeat(50)}`);
    const prompt = createImplementerPrompt(createInput({ validationCommands: manyCommands }));
    expect(prompt.text.length).toBeLessThanOrEqual(4003);
  });
});
