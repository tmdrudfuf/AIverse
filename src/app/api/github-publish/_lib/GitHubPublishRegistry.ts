import fs from "node:fs";
import path from "node:path";

import type { PublishAuditRecord } from "./GitHubPublishTypes";

const DEFAULT_AUDIT_ROOT_DIR = ".agent-workflow/github-publishes";

/**
 * In-memory, per-process registry enforcing "at most one publish attempt
 * per project at a time" (FR-008) and writing the durable audit record
 * every terminal attempt leaves behind (FR-007). Mirrors
 * `src/app/api/runtime/_lib/RuntimeBridgeRunRegistry.ts`'s proven shape
 * exactly (same single-operator/single-process assumption, same
 * path-traversal defense, same exclusive-write collision defense) --
 * see research.md Decision 6.
 */
export class GitHubPublishRegistry {
  private readonly active = new Set<string>();

  constructor(private readonly auditRootDir: string = DEFAULT_AUDIT_ROOT_DIR) {}

  /** Returns true if this attempt was accepted (no other attempt was already active for this working directory). */
  tryStart(workingDirectoryKey: string): boolean {
    if (this.active.has(workingDirectoryKey)) return false;
    this.active.add(workingDirectoryKey);
    return true;
  }

  /** Marks the working directory free for a new attempt. Safe to call even if none is active. */
  finish(workingDirectoryKey: string): void {
    this.active.delete(workingDirectoryKey);
  }

  isActive(workingDirectoryKey: string): boolean {
    return this.active.has(workingDirectoryKey);
  }

  /**
   * Writes one terminal attempt's durable record to `<auditRootDir>/<attemptId>.json`.
   * Defense in depth: refuses to write outside `auditRootDir` regardless of
   * what `record.attemptId` contains, and writes exclusively (`wx`) so a
   * repeated id can never silently overwrite an earlier record.
   */
  writeAuditRecord(record: PublishAuditRecord): string {
    fs.mkdirSync(this.auditRootDir, { recursive: true });
    const auditRoot = path.resolve(this.auditRootDir);
    const filePath = path.resolve(auditRoot, `${record.attemptId}.json`);
    const isInsideAuditRoot = filePath === auditRoot || filePath.startsWith(`${auditRoot}${path.sep}`);
    if (!isInsideAuditRoot) {
      throw new Error(`Refusing to write audit record outside auditRootDir for attemptId "${record.attemptId}".`);
    }
    fs.writeFileSync(filePath, `${JSON.stringify(record, null, 2)}\n`, { encoding: "utf8", flag: "wx" });
    return filePath;
  }
}

let sharedRegistry: GitHubPublishRegistry | undefined;

/** One registry per running server process -- attempts in one request must be visible to the next. */
export function getSharedGitHubPublishRegistry(): GitHubPublishRegistry {
  if (!sharedRegistry) sharedRegistry = new GitHubPublishRegistry();
  return sharedRegistry;
}
