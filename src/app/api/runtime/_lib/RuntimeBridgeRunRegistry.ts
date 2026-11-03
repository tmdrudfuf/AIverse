import fs from "node:fs";
import path from "node:path";

import type { RunAuditRecord } from "./RuntimeBridgeTypes";

const DEFAULT_AUDIT_ROOT_DIR = ".agent-workflow/real-runs";

export type RuntimeBridgeActiveRunHandle = {
  cancel(): boolean;
};

type ActiveRunEntry = {
  runId: string;
  handle: RuntimeBridgeActiveRunHandle;
};

/**
 * In-memory, per-process registry enforcing "at most one real run per
 * project" (FR-005) and writing the durable audit record every terminal run
 * leaves behind (FR-009). An in-memory map is sufficient because this
 * feature's explicit assumption is a single operator running a single local
 * server process, not a multi-instance deployment -- see research.md,
 * Decision 5. There is no server-side project registry (the browser's
 * project registry, Spec 137, has no server-side counterpart -- see
 * research.md's FR-011 correction), so a project's own resolved real local
 * path (`workingDirectoryKey`, normalized case-insensitively) is used as
 * the concurrency key directly: it already uniquely and stably identifies
 * the registered project, with no separate project-id concept needed here.
 */
export class RuntimeBridgeRunRegistry {
  private readonly active = new Map<string, ActiveRunEntry>();

  constructor(private readonly auditRootDir: string = DEFAULT_AUDIT_ROOT_DIR) {}

  /** Returns true if this run was accepted (no other run was already active for this working directory). */
  tryStart(workingDirectoryKey: string, runId: string, handle: RuntimeBridgeActiveRunHandle): boolean {
    if (this.active.has(workingDirectoryKey)) return false;
    this.active.set(workingDirectoryKey, { runId, handle });
    return true;
  }

  /** Marks the working directory free for a new run. Safe to call even if no run is active. */
  finish(workingDirectoryKey: string): void {
    this.active.delete(workingDirectoryKey);
  }

  isActive(workingDirectoryKey: string): boolean {
    return this.active.has(workingDirectoryKey);
  }

  /** Requests cancellation of the run with this id, wherever it is active. Returns false if none is found. */
  cancel(runId: string): boolean {
    for (const entry of Array.from(this.active.values())) {
      if (entry.runId === runId) return entry.handle.cancel();
    }
    return false;
  }

  /** Writes one terminal run's durable record to `<auditRootDir>/<runId>.json`. */
  writeAuditRecord(record: RunAuditRecord): string {
    fs.mkdirSync(this.auditRootDir, { recursive: true });
    const filePath = path.join(this.auditRootDir, `${record.runId}.json`);
    fs.writeFileSync(filePath, `${JSON.stringify(record, null, 2)}\n`, "utf8");
    return filePath;
  }
}

let sharedRegistry: RuntimeBridgeRunRegistry | undefined;

/** One registry per running server process -- real runs in one request must be visible to the next. */
export function getSharedRuntimeBridgeRunRegistry(): RuntimeBridgeRunRegistry {
  if (!sharedRegistry) sharedRegistry = new RuntimeBridgeRunRegistry();
  return sharedRegistry;
}
