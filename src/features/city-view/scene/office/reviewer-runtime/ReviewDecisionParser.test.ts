import { describe, expect, it } from "vitest";

import { parseReviewOutput } from "./ReviewDecisionParser";

describe("parseReviewOutput", () => {
  it("maps an explicit Decision: Approved line with no findings to Approved", () => {
    const result = parseReviewOutput("Review looks good.\nDecision: Approved", 0);
    expect(result.decision).toBe("Approved");
    expect(result.findings).toHaveLength(0);
  });

  it("maps a standalone Changes Requested heading to ChangesRequested", () => {
    const result = parseReviewOutput("# Changes Requested\nFix the bug.", 0);
    expect(result.decision).toBe("ChangesRequested");
  });

  it("does not treat an h2+ standalone heading as a decision marker (mirrors agentWorkflow.js#detectDecision)", () => {
    const result = parseReviewOutput("## Approved\nLooks fine so far.", 0);
    expect(result.decision).toBe("Unknown");
  });

  it("still treats a Decision:-prefixed marker as valid at any heading depth", () => {
    const result = parseReviewOutput("## Decision: Changes Requested\nFix the bug.", 0);
    expect(result.decision).toBe("ChangesRequested");
  });

  it("prefers explicit Changes Requested over weaker approval-sounding prose", () => {
    const text = "Overall this could probably be approved once cleaned up.\nDecision: Changes Requested";
    expect(parseReviewOutput(text, 0).decision).toBe("ChangesRequested");
  });

  it("never resolves conflicting explicit Approved and Changes Requested markers to Approved", () => {
    const text = "Decision: Approved\nDecision: Changes Requested";
    expect(parseReviewOutput(text, 0).decision).toBe("Unknown");
  });

  it("downgrades Approved to ChangesRequested when a blocking finding is present", () => {
    const text = [
      "Decision: Approved",
      "Finding: P1 | blocking | safety | src/foo.ts:10 | Unsafe command construction",
    ].join("\n");
    const result = parseReviewOutput(text, 0);
    expect(result.decision).toBe("ChangesRequested");
    expect(result.findings).toHaveLength(1);
    expect(result.findings[0]).toMatchObject({ severity: "P1", blocking: true, filePath: "src/foo.ts", line: 10 });
  });

  it("does not let a decision-less Unknown output override clear Changes Requested text elsewhere", () => {
    const text = "Some unrelated commentary.\nDecision: Changes Requested\nMore commentary.";
    expect(parseReviewOutput(text, 0).decision).toBe("ChangesRequested");
  });

  it("maps empty output to Unknown", () => {
    expect(parseReviewOutput("", 0).decision).toBe("Unknown");
  });

  it("maps malformed/unstructured output with no markers to Unknown", () => {
    expect(parseReviewOutput("Codex produced unstructured commentary with no decision line.", 0).decision).toBe("Unknown");
  });

  it("downgrades Approved to Unknown on a non-zero exit code", () => {
    expect(parseReviewOutput("Decision: Approved", 1).decision).toBe("Unknown");
  });

  it("treats a P3 finding as non-blocking by default", () => {
    const text = "Decision: Approved\nFinding: P3 | | style | src/foo.ts:1 | minor nit";
    const result = parseReviewOutput(text, 0);
    expect(result.decision).toBe("Approved");
    expect(result.findings[0]).toMatchObject({ severity: "P3", blocking: false });
  });

  it("treats an explicitly non-blocking P1 override as still respected", () => {
    const text = "Finding: P1 | non-blocking | style | src/foo.ts:1 | pedantic note";
    const result = parseReviewOutput(text, 0);
    expect(result.findings[0]).toMatchObject({ severity: "P1", blocking: false });
  });

  it("treats a malformed/unrecognized severity as P1 and always blocking, never non-blocking", () => {
    const text = "Finding: X9 | non-blocking | style | src/foo.ts:1 | weird severity";
    const result = parseReviewOutput(text, 0);
    expect(result.findings[0]).toMatchObject({ severity: "P1", blocking: true });
  });

  it("rejects a path-traversal or absolute location and drops the location fields", () => {
    const text = "Finding: P2 | blocking | safety | ../../etc/passwd:1 | traversal attempt";
    const result = parseReviewOutput(text, 0);
    expect(result.findings[0].filePath).toBeUndefined();
    expect(result.findings[0].line).toBeUndefined();
  });

  it("bounds the number of parsed findings", () => {
    const lines = Array.from({ length: 30 }, (_, index) => `Finding: P2 | blocking | cat | file.ts:${index} | msg`);
    const result = parseReviewOutput(lines.join("\n"), 0);
    expect(result.findings.length).toBeLessThanOrEqual(20);
  });

  it("bounds an overlong finding message", () => {
    const longMessage = "x".repeat(1000);
    const text = `Finding: P2 | blocking | cat | file.ts:1 | ${longMessage}`;
    const result = parseReviewOutput(text, 0);
    expect(result.findings[0].message.length).toBeLessThanOrEqual(300);
  });
});
