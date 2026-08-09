import { describe, expect, it } from "vitest";

import { createValidationRuntimeDisplayRows } from "./ValidationRuntimeView";

describe("ValidationRuntimeView", () => {
  it("reports unavailable, ready, completed, and blocked states truthfully", () => {
    expect(createValidationRuntimeDisplayRows(undefined, undefined, undefined).statusText).toContain("Unavailable");

    const fixRuntime = { status: "Completed" } as Parameters<typeof createValidationRuntimeDisplayRows>[0];
    const fixResult = { status: "Completed" } as Parameters<typeof createValidationRuntimeDisplayRows>[1];
    expect(createValidationRuntimeDisplayRows(fixRuntime, fixResult, undefined).statusText).toContain("Start validation runtime (V)");

    const runtime = {
      status: "Completed",
      evidence: { completedCommandCount: 2, commandCount: 2 },
    } as Parameters<typeof createValidationRuntimeDisplayRows>[2];
    expect(createValidationRuntimeDisplayRows(fixRuntime, fixResult, runtime).statusText).toContain("review not started");

    const blocked = {
      status: "Blocked",
      reasonCodes: ["VALIDATION_RUNTIME_CONTEXT_STALE"],
    } as Parameters<typeof createValidationRuntimeDisplayRows>[3];
    expect(createValidationRuntimeDisplayRows(fixRuntime, fixResult, undefined, blocked).statusText).toContain("commands not run");
  });
});
