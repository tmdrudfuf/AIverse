import { describe, expect, it, vi } from "vitest";

import { LocalValidationRuntimeProvider, isSafeValidationCommandLine } from "./ValidationRuntimeProvider";

describe("LocalValidationRuntimeProvider", () => {
  it("rejects unsafe validation command lines before spawn", async () => {
    const spawn = vi.fn();
    const provider = new LocalValidationRuntimeProvider(spawn);

    const result = await provider.invoke({
      workingDirectory: "C:/repo/worktree",
      expectedHead: "sha-1",
      commands: ["npm test && git push"],
      timeoutMs: 1000,
    });

    expect(result.status).toBe("Blocked");
    expect(result.evidence.commands[0]?.started).toBe(false);
    expect(spawn).not.toHaveBeenCalled();
    expect(isSafeValidationCommandLine("npm test")).toBe(true);
    expect(isSafeValidationCommandLine("git push")).toBe(false);
  });

  it("executes safe configured commands without a shell and records parity", async () => {
    const spawn = vi.fn(() => ({ status: 0, signal: null, stdout: "ok", stderr: "" }));
    const provider = new LocalValidationRuntimeProvider(spawn);

    const result = await provider.invoke({
      workingDirectory: "C:/repo/worktree",
      expectedHead: "sha-1",
      commands: ["npx tsc --noEmit"],
      timeoutMs: 1000,
    });

    expect(result.status).toBe("Completed");
    expect(spawn).toHaveBeenCalledWith("npx", ["tsc", "--noEmit"], {
      cwd: "C:/repo/worktree",
      timeout: 1000,
      killSignal: "SIGTERM",
    });
    expect(result.evidence.commandCount).toBe(1);
    expect(result.evidence.completedCommandCount).toBe(1);
  });
});
