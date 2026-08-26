import { describe, expect, it } from "vitest";

import type { ExternalProjectAdosRunPreparation } from "./ExternalProjectAdosRunPreparationTypes";
import { createExternalProjectAdosRunPreparationDisplayRows } from "./ExternalProjectAdosRunPreparationView";

describe("ExternalProjectAdosRunPreparationView", () => {
  it("formats compact preparation display rows", () => {
    expect(createExternalProjectAdosRunPreparationDisplayRows(createPreparation())).toEqual({
      statusText: "Prepared - codex/129-trusted-local-ados-execution-bridge",
      contextText: "base 00f22e1; specs/129-trusted-local-ados-execution-bridge/spec.md; 6 validation commands; reviewer claude -p; policy v1",
      boundaryText: "Local preparation only.",
    });
  });

  it("returns no rows when preparation is missing", () => {
    expect(createExternalProjectAdosRunPreparationDisplayRows(undefined)).toBeUndefined();
  });
});

function createPreparation(): ExternalProjectAdosRunPreparation {
  return {
    id: "external-project-draft:external-ados-run-preparation",
    projectId: "external-project-draft",
    developmentRequestDraftId: "external-project-draft:external-development-request-draft",
    status: "Prepared",
    featureBranch: "codex/129-trusted-local-ados-execution-bridge",
    authoritativeBaseSha: "00f22e1997979c087a1d85f9a6b01fe5450bfdf5",
    specPath: "specs/129-trusted-local-ados-execution-bridge/spec.md",
    validationCommands: [
      "npm test",
      "npx tsc --noEmit",
      "npm run build",
      "npm run test:e2e:home-canvas",
      "git diff --check",
      "git diff --cached --check",
    ],
    reviewerCommand: "claude -p",
    executionPolicyVersion: 1,
    createdAt: "2026-08-24T01:00:00.000Z",
    updatedAt: "2026-08-24T01:00:00.000Z",
    sideEffectBoundary: "Local preparation only.",
  };
}
