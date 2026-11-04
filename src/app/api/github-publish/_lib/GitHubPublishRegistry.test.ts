import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { GitHubPublishRegistry } from "./GitHubPublishRegistry";
import type { PublishAuditRecord } from "./GitHubPublishTypes";

function createTempAuditDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "github-publish-registry-"));
}

function createRecord(overrides: Partial<PublishAuditRecord> = {}): PublishAuditRecord {
  return {
    attemptId: "attempt-1",
    workingDirectory: "C:/scratch/project-a",
    status: "published",
    refusalReason: null,
    branchName: "aiverse/publish-1",
    commitMessage: "AIverse maintenance update: 1 file changed",
    pullRequestUrl: "https://github.com/example/repo/pull/1",
    startedAt: "2026-11-04T00:00:00.000Z",
    completedAt: "2026-11-04T00:00:05.000Z",
    evidence: { stdoutSummary: "ok", stderrSummary: "", failureStep: null },
    ...overrides,
  };
}

describe("GitHubPublishRegistry", () => {
  it("allows only one active attempt per working directory key", () => {
    const registry = new GitHubPublishRegistry(createTempAuditDir());

    expect(registry.tryStart("c:/scratch/project-a")).toBe(true);
    expect(registry.tryStart("c:/scratch/project-a")).toBe(false);
    expect(registry.isActive("c:/scratch/project-a")).toBe(true);
  });

  it("frees the working directory once finished", () => {
    const registry = new GitHubPublishRegistry(createTempAuditDir());

    registry.tryStart("c:/scratch/project-a");
    registry.finish("c:/scratch/project-a");

    expect(registry.tryStart("c:/scratch/project-a")).toBe(true);
  });

  it("different working directories never block each other", () => {
    const registry = new GitHubPublishRegistry(createTempAuditDir());

    expect(registry.tryStart("c:/scratch/project-a")).toBe(true);
    expect(registry.tryStart("c:/scratch/project-b")).toBe(true);
  });

  it("writes a terminal attempt's audit record to <auditRootDir>/<attemptId>.json", () => {
    const auditRootDir = createTempAuditDir();
    const registry = new GitHubPublishRegistry(auditRootDir);
    const record = createRecord();

    const filePath = registry.writeAuditRecord(record);

    expect(fs.existsSync(filePath)).toBe(true);
    expect(JSON.parse(fs.readFileSync(filePath, "utf8"))).toEqual(record);
    expect(filePath).toBe(path.join(auditRootDir, "attempt-1.json"));
  });

  it("refuses to write an audit record whose attemptId would escape auditRootDir", () => {
    const auditRootDir = createTempAuditDir();
    const registry = new GitHubPublishRegistry(auditRootDir);

    expect(() => registry.writeAuditRecord(createRecord({ attemptId: "../../escaped" }))).toThrow();
  });

  it("refuses to overwrite an existing audit record for a reused attemptId", () => {
    const registry = new GitHubPublishRegistry(createTempAuditDir());
    registry.writeAuditRecord(createRecord());

    expect(() => registry.writeAuditRecord(createRecord())).toThrow();
  });
});
