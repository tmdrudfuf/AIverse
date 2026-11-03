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
 * registered project" (FR-005) and writing the durable audit record every
 * terminal run leaves behind (FR-009). An in-memory map is sufficient
 * because this feature's explicit assumption is a single operator running a
 * single local server process, not a multi-instance deployment -- see
 * research.md, Decision 5.
 */
export class RuntimeBridgeRunRegistry {
  private readonly active = new Map<string, ActiveRunEntry>();

  constructor(private readonly auditRootDir: string = DEFAULT_AUDIT_ROOT_DIR) {}

  /** Returns true if this run was accepted (no other run was already active for this project). */
  tryStart(projectId: string, runId: string, handle: RuntimeBridgeActiveRunHandle): boolean {
    if (this.active.has(projectId)) return false;
    this.active.set(projectId, { runId, handle });
    return true;
  }

  /** Marks the project free for a new run. Safe to call even if no run is active. */
  finish(projectId: string): void {
    this.active.delete(projectId);
  }

  isActive(projectId: string): boolean {
    return this.active.has(projectId);
  }

  /** Requests cancellation of the run with this id, wherever it is active. Returns false if none is found. */
  cancel(runId: string): boolean {
    for (const entry of this.active.values()) {
      if (entry.runId === runId) return entry.handle.cancel();
    }
    return false;
  }

  /** Writes one terminal run's durable record to `<auditRootDir>/<projectId>/<runId>.json`. */
  writeAuditRecord(record: RunAuditRecord): string {
    const dir = path.join(this.auditRootDir, record.projectId);
    fs.mkdirSync(dir, { recursive: true });
    const filePath = path.join(dir, `${record.runId}.json`);
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
