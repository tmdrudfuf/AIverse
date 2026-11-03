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

  /**
   * Writes one terminal run's durable record to `<auditRootDir>/<runId>.json`.
   *
   * Defense in depth (round-3 review finding P1-001): `record.runId` can
   * originate from the caller (an operator-supplied id, see
   * `RuntimeBridgeTypes.RuntimeBridgeExecuteRequest.runId`). The route layer
   * already restricts it to a safe charset before it ever reaches here, but
   * this method independently refuses to write outside `auditRootDir`
   * regardless, so a future caller of this method is never the one place a
   * traversal could slip through.
   *
   * Writes exclusively (round-5 review finding N-001, non-blocking): a
   * caller-supplied runId reused across two separate requests must not be
   * able to silently overwrite an earlier run's real audit record. Throws
   * if one already exists for this runId; callers decide how to handle
   * that (the route's own callers treat it as best-effort and do not let
   * it corrupt the actual run's own already-genuine result).
   */
  writeAuditRecord(record: RunAuditRecord): string {
    fs.mkdirSync(this.auditRootDir, { recursive: true });
    const auditRoot = path.resolve(this.auditRootDir);
    const filePath = path.resolve(auditRoot, `${record.runId}.json`);
    const isInsideAuditRoot = filePath === auditRoot || filePath.startsWith(`${auditRoot}${path.sep}`);
    if (!isInsideAuditRoot) {
      throw new Error(`Refusing to write audit record outside auditRootDir for runId "${record.runId}".`);
    }
    fs.writeFileSync(filePath, `${JSON.stringify(record, null, 2)}\n`, { encoding: "utf8", flag: "wx" });
    return filePath;
  }
}

let sharedRegistry: RuntimeBridgeRunRegistry | undefined;

/** One registry per running server process -- real runs in one request must be visible to the next. */
export function getSharedRuntimeBridgeRunRegistry(): RuntimeBridgeRunRegistry {
  if (!sharedRegistry) sharedRegistry = new RuntimeBridgeRunRegistry();
  return sharedRegistry;
}
