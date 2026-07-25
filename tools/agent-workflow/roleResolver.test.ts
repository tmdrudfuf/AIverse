import { describe, expect, it } from "vitest";
import {
  DEFAULT_ROLE_ROSTER,
  describeEffectiveRoles,
  getRoleRoster,
  resolveEffectiveRoles,
} from "./roleResolver.js";

type WorkflowState = {
  stageAgents?: Record<string, string>;
  agentRunners?: Record<string, unknown>;
  roleRoster?: string[];
};

function createState(overrides: Partial<WorkflowState> = {}): WorkflowState {
  return { ...overrides };
}

describe("role roster", () => {
  it("defaults to codex/claude", () => {
    expect(getRoleRoster(createState())).toEqual(["codex", "claude"]);
    expect(DEFAULT_ROLE_ROSTER).toEqual(["codex", "claude"]);
  });

  it("honors a configured roleRoster and deduplicates it", () => {
    const state = createState({ roleRoster: ["codex", "claude", "gemini", "gemini"] });
    expect(getRoleRoster(state)).toEqual(["codex", "claude", "gemini"]);
  });
});

describe("CLI-override resolution (two-agent default)", () => {
  it("resolves --implementer claude to Implementer=claude, Reviewer=codex", () => {
    const result = resolveEffectiveRoles({ state: createState(), requestedImplementerId: "claude" });
    expect(result).toEqual({
      ok: true,
      roles: { implementer: "claude", reviewer: "codex" },
      source: "cli-override",
      diagnostics: [],
    });
  });

  it("resolves --implementer codex to Implementer=codex, Reviewer=claude", () => {
    const result = resolveEffectiveRoles({ state: createState(), requestedImplementerId: "codex" });
    expect(result).toEqual({
      ok: true,
      roles: { implementer: "codex", reviewer: "claude" },
      source: "cli-override",
      diagnostics: [],
    });
  });

  it("is deterministic regardless of agentRunners object insertion order", () => {
    const forward = createState({
      agentRunners: {
        codex: { identity: "A", command: "codex-a", args: [], inputMode: "stdin" },
        claude: { identity: "B", command: "claude-b", args: [], inputMode: "argument" },
      },
    });
    const reversed = createState({
      agentRunners: {
        claude: { identity: "B", command: "claude-b", args: [], inputMode: "argument" },
        codex: { identity: "A", command: "codex-a", args: [], inputMode: "stdin" },
      },
    });
    expect(resolveEffectiveRoles({ state: forward, requestedImplementerId: "claude" }).roles).toEqual({
      implementer: "claude",
      reviewer: "codex",
    });
    expect(resolveEffectiveRoles({ state: reversed, requestedImplementerId: "claude" }).roles).toEqual({
      implementer: "claude",
      reviewer: "codex",
    });
  });

  it("does not mutate the input state", () => {
    const state = createState({ stageAgents: { implement: "implementer", review: "reviewer" } });
    const snapshot = JSON.stringify(state);
    resolveEffectiveRoles({ state, requestedImplementerId: "claude" });
    expect(JSON.stringify(state)).toBe(snapshot);
  });
});

describe("CLI-override validation failures", () => {
  it("rejects an unknown requested implementer and lists the roster", () => {
    const result = resolveEffectiveRoles({ state: createState(), requestedImplementerId: "unknown-agent" });
    expect(result.ok).toBe(false);
    expect(result.roles).toBeNull();
    expect(result.diagnostics.join(" ")).toContain("Requested implementer 'unknown-agent' is not configured.");
    expect(result.diagnostics.join(" ")).toContain("Available eligible agents: codex, claude.");
  });

  it("rejects a disabled requested implementer", () => {
    const state = createState({
      agentRunners: { claude: { identity: "Claude", command: "claude", args: [], inputMode: "argument", enabled: false } },
    });
    const result = resolveEffectiveRoles({ state, requestedImplementerId: "claude" });
    expect(result.ok).toBe(false);
    expect(result.diagnostics.join(" ")).toContain("Requested implementer 'claude' is disabled.");
  });

  it("rejects a requested implementer with missing runner configuration", () => {
    const state = createState({ roleRoster: ["codex", "claude", "ghost"] });
    // "ghost" is not present in agentRunners at all.
    const result = resolveEffectiveRoles({ state, requestedImplementerId: "ghost" });
    expect(result.ok).toBe(false);
    expect(result.diagnostics.join(" ")).toContain("Requested implementer 'ghost' is not configured.");
  });

  it("rejects an unsafe requested implementer runner (remote-mutating)", () => {
    const state = createState({
      agentRunners: { claude: { identity: "Unsafe", command: "gh", args: ["pr", "merge"], inputMode: "stdin" } },
    });
    const result = resolveEffectiveRoles({ state, requestedImplementerId: "claude" });
    expect(result.ok).toBe(false);
    expect(result.diagnostics.join(" ")).toContain("unsafe or invalid runner configuration");
    expect(result.diagnostics.join(" ")).toContain("Remote-mutating");
  });

  it("rejects when the auto-derived reviewer runner is unsafe (remote-mutating)", () => {
    const state = createState({
      agentRunners: { codex: { identity: "Unsafe Reviewer", command: "git", args: ["push"], inputMode: "stdin" } },
    });
    const result = resolveEffectiveRoles({ state, requestedImplementerId: "claude" });
    expect(result.ok).toBe(false);
    expect(result.diagnostics.join(" ")).toContain("Resolved reviewer 'codex'");
    expect(result.diagnostics.join(" ")).toContain("Remote-mutating");
  });

  it("rejects when no distinct Reviewer candidate exists (single-agent roster)", () => {
    const state = createState({ roleRoster: ["claude"] });
    const result = resolveEffectiveRoles({ state, requestedImplementerId: "claude" });
    expect(result.ok).toBe(false);
    expect(result.diagnostics.join(" ")).toContain("No distinct Reviewer candidate exists");
  });

  it("rejects a requested implementer that is not part of the configured roster", () => {
    const state = createState({
      roleRoster: ["codex", "claude"],
      agentRunners: { extra: { identity: "Extra", command: "extra-cli", args: [], inputMode: "stdin" } },
    });
    const result = resolveEffectiveRoles({ state, requestedImplementerId: "extra" });
    expect(result.ok).toBe(false);
    expect(result.diagnostics.join(" ")).toContain("not part of the configured role roster");
  });
});

describe("multi-agent roster ambiguity", () => {
  function multiAgentState(overrides: Partial<WorkflowState> = {}) {
    return createState({
      roleRoster: ["codex", "claude", "gemini"],
      agentRunners: {
        gemini: { identity: "Gemini CLI", command: "gemini-cli", args: [], inputMode: "stdin" },
      },
      ...overrides,
    });
  }

  it("rejects with an ambiguity diagnostic when no configured Reviewer can be preserved", () => {
    const result = resolveEffectiveRoles({ state: multiAgentState(), requestedImplementerId: "claude" });
    expect(result.ok).toBe(false);
    expect(result.diagnostics.join(" ")).toContain("Multiple Reviewer candidates");
    expect(result.diagnostics.join(" ")).toContain("no distinct configured Reviewer could be preserved");
  });

  it("preserves an existing configured distinct Reviewer when more than two agents exist", () => {
    const state = multiAgentState({ stageAgents: { review: "gemini" } });
    const result = resolveEffectiveRoles({ state, requestedImplementerId: "claude" });
    expect(result).toEqual({
      ok: true,
      roles: { implementer: "claude", reviewer: "gemini" },
      source: "cli-override",
      diagnostics: [],
    });
  });

  it("does not preserve a configured Reviewer equal to the requested Implementer", () => {
    const state = multiAgentState({ stageAgents: { review: "claude" } });
    const result = resolveEffectiveRoles({ state, requestedImplementerId: "claude" });
    expect(result.ok).toBe(false);
  });
});

describe("state/default passthrough (no CLI override)", () => {
  it("resolves defaults when no state role override exists", () => {
    const result = resolveEffectiveRoles({ state: createState() });
    expect(result).toEqual({
      ok: true,
      roles: { implementer: "implementer", reviewer: "reviewer" },
      source: "default",
      diagnostics: [],
    });
  });

  it("resolves state-configured roles when stageAgents overrides exist", () => {
    const state = createState({ stageAgents: { implement: "claude", review: "codex" } });
    const result = resolveEffectiveRoles({ state });
    expect(result).toEqual({
      ok: true,
      roles: { implementer: "claude", reviewer: "codex" },
      source: "state",
      diagnostics: [],
    });
  });
});

describe("resume continuity", () => {
  it("preserves pinned roles when no override is supplied", () => {
    const result = resolveEffectiveRoles({
      state: createState(),
      existingRunRoles: { implementer: "claude", reviewer: "codex", source: "cli-override" },
    });
    expect(result).toEqual({
      ok: true,
      roles: { implementer: "claude", reviewer: "codex" },
      source: "cli-override",
      diagnostics: [],
    });
  });

  it("accepts a matching --implementer on resume", () => {
    const result = resolveEffectiveRoles({
      state: createState(),
      requestedImplementerId: "claude",
      existingRunRoles: { implementer: "claude", reviewer: "codex", source: "cli-override" },
    });
    expect(result.ok).toBe(true);
    expect(result.roles).toEqual({ implementer: "claude", reviewer: "codex" });
  });

  it("rejects a conflicting --implementer on resume before spawn", () => {
    const result = resolveEffectiveRoles({
      state: createState(),
      requestedImplementerId: "codex",
      existingRunRoles: { implementer: "claude", reviewer: "codex", source: "cli-override" },
    });
    expect(result.ok).toBe(false);
    expect(result.source).toBe("resume-conflict");
    const message = result.diagnostics.join(" ");
    expect(message).toContain("Existing run roles: Implementer=claude, Reviewer=codex.");
    expect(message).toContain("Requested resume override: Implementer=codex.");
    expect(message).toContain("Rejected before spawn because runtime roles are already fixed for this run.");
  });
});

describe("describeEffectiveRoles", () => {
  it("maps resolved ids to display identities", () => {
    const state = createState();
    const described = describeEffectiveRoles(state, { implementer: "claude", reviewer: "codex" }, "cli-override");
    expect(described).toEqual({
      implementer: { agentId: "claude", displayName: "Claude Code CLI" },
      reviewer: { agentId: "codex", displayName: "OpenAI Codex CLI" },
      source: "cli-override",
    });
  });
});
