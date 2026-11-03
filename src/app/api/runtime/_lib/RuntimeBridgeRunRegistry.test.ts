import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { RuntimeBridgeRunRegistry } from "./RuntimeBridgeRunRegistry";
import type { RunAuditRecord } from "./RuntimeBridgeTypes";

function createTempAuditDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "runtime-bridge-registry-"));
}

function createRecord(overrides: Partial<RunAuditRecord> = {}): RunAuditRecord {
  return {
    runId: "run-1",
    projectId: "project-a",
    role: "implementer",
    status: "completed",
    refusalReason: null,
    startedAt: "2026-11-03T00:00:00.000Z",
    completedAt: "2026-11-03T00:00:01.000Z",
    command: "claude -p prompt",
    workingDirectory: "C:/scratch/project-a",
    evidence: {
      started: true,
      completed: true,
      timedOut: false,
      cancelled: false,
      exitCode: 0,
      stdoutSummary: "ok",
      stderrSummary: "",
      commandDisplay: "claude -p prompt",
      workingDirectory: "C:/scratch/project-a",
    },
    ...overrides,
  };
}

describe("RuntimeBridgeRunRegistry", () => {
  it("allows only one active run per project", () => {
    const registry = new RuntimeBridgeRunRegistry(createTempAuditDir());

    const firstAccepted = registry.tryStart("project-a", "run-1", { cancel: () => true });
    const secondAccepted = registry.tryStart("project-a", "run-2", { cancel: () => true });

    expect(firstAccepted).toBe(true);
    expect(secondAccepted).toBe(false);
    expect(registry.isActive("project-a")).toBe(true);
  });

  it("frees the project for a new run once the prior one finishes", () => {
    const registry = new RuntimeBridgeRunRegistry(createTempAuditDir());

    registry.tryStart("project-a", "run-1", { cancel: () => true });
    registry.finish("project-a");
    const accepted = registry.tryStart("project-a", "run-2", { cancel: () => true });

    expect(accepted).toBe(true);
  });

  it("different projects never block each other", () => {
    const registry = new RuntimeBridgeRunRegistry(createTempAuditDir());

    const a = registry.tryStart("project-a", "run-1", { cancel: () => true });
    const b = registry.tryStart("project-b", "run-2", { cancel: () => true });

    expect(a).toBe(true);
    expect(b).toBe(true);
  });

  it("cancel() delegates to the matching run's handle by runId", () => {
    const registry = new RuntimeBridgeRunRegistry(createTempAuditDir());
    let cancelled = false;

    registry.tryStart("project-a", "run-1", { cancel: () => { cancelled = true; return true; } });

    const accepted = registry.cancel("run-1");

    expect(accepted).toBe(true);
    expect(cancelled).toBe(true);
  });

  it("cancel() on an unknown runId returns false without throwing", () => {
    const registry = new RuntimeBridgeRunRegistry(createTempAuditDir());

    expect(registry.cancel("unknown-run")).toBe(false);
  });

  it("writes a terminal run's audit record to <auditRootDir>/<projectId>/<runId>.json", () => {
    const auditRootDir = createTempAuditDir();
    const registry = new RuntimeBridgeRunRegistry(auditRootDir);
    const record = createRecord();

    const filePath = registry.writeAuditRecord(record);

    expect(fs.existsSync(filePath)).toBe(true);
    const written = JSON.parse(fs.readFileSync(filePath, "utf8"));
    expect(written).toEqual(record);
    expect(filePath).toBe(path.join(auditRootDir, "project-a", "run-1.json"));
  });
});
