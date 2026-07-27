// Test-only dependency seams for tools/agent-workflow's own test suite.
//
// This module is intentionally never imported by cli.js or any production
// entry point: the fakes it exports are not selectable via any CLI flag or
// state field, only via the `gitAdapter`/`processAdapter` options that
// orchestrateCommand.js/reviewCommand.js already accept for dependency
// injection (see spec.md FR-001/FR-002).
//
// createFakeGitAdapter implements the exact `{ run(args, cwd), verify(ref, cwd) }`
// shape createDefaultGitAdapter (reviewCommand.js) already exposes, matching
// every distinct `git` invocation pattern collectGitContext() issues, so it is
// a drop-in replacement with no change to production code's call sites.

function cloneState(state) {
  return { ...state };
}

const DEFAULT_GIT_STATE = {
  repositoryPath: "C:/fake/repo",
  currentBranch: "codex/fake-branch",
  headCommit: "a".repeat(40),
  baseBranchRef: "main",
  mergeBase: "b".repeat(40),
  stagedDiffStat: "",
  stagedDiff: "",
  stagedDiffNumstat: "",
  unstagedDiffStat: "",
  unstagedDiff: "",
  unstagedDiffNumstat: "",
  committedLog: "",
  committedDiffStat: "",
  committedDiff: "",
  committedDiffNumstat: "",
  statusPorcelain: "",
};

function createFakeGitAdapter(config = {}) {
  let state = { ...DEFAULT_GIT_STATE, ...(config.state || {}) };
  const verifyResults = { ...(config.verifyResults || {}) };
  const calls = [];

  function run(args, cwd) {
    calls.push({ args: [...args], cwd });
    const key = args.join(" ");
    if (key === "rev-parse --show-toplevel") return state.repositoryPath;
    if (key === "rev-parse --abbrev-ref HEAD") return state.currentBranch;
    if (key === "rev-parse HEAD") return state.headCommit;
    if (args[0] === "merge-base") return state.mergeBase;
    if (key === "diff --cached --stat") return state.stagedDiffStat;
    if (key === "diff --cached --numstat") return state.stagedDiffNumstat;
    if (key === "diff --cached") return state.stagedDiff;
    if (key === "diff --stat") return state.unstagedDiffStat;
    if (key === "diff --numstat") return state.unstagedDiffNumstat;
    if (key === "diff") return state.unstagedDiff;
    if (args[0] === "log") return state.committedLog;
    if (args[0] === "diff" && args.length === 3 && args[2] === "--stat") return state.committedDiffStat;
    if (args[0] === "diff" && args.length === 3 && args[2] === "--numstat") return state.committedDiffNumstat;
    if (args[0] === "diff" && args.length === 2) return state.committedDiff;
    if (key === "status --porcelain") return state.statusPorcelain;
    return "";
  }

  function verify(ref) {
    if (Object.prototype.hasOwnProperty.call(verifyResults, ref)) return verifyResults[ref];
    return ref === state.baseBranchRef || ref === "main";
  }

  return {
    run,
    verify,
    calls,
    getState: () => cloneState(state),
    setState(patch) {
      state = { ...state, ...patch };
    },
    setVerifyResult(ref, result) {
      verifyResults[ref] = result;
    },
  };
}

// Promoted from the test-local `createSequenceAdapter` pattern already used
// across orchestrateCommand.test.ts: a deterministic fake process adapter
// that replays a scripted sequence of results (success, failure, timeout,
// interruption) and tracks every spawn/kill for assertions, with no real
// subprocess ever created.
function createFakeCommandRunner(initialSequence = []) {
  const sequence = [...initialSequence];
  const calls = [];
  const spawned = [];
  const killed = [];

  async function run(command, args, options = {}) {
    const callIndex = calls.length;
    calls.push({ command, args, options });
    spawned.push({ command, args, index: callIndex });
    const next = sequence.shift();
    if (!next) {
      throw new Error(`createFakeCommandRunner: unexpected process call for ${command} ${args.join(" ")}`);
    }
    if (next.interrupted || next.timedOut) {
      killed.push({ command, args, index: callIndex, reason: next.interrupted ? "interrupted" : "timeout" });
    }
    if (typeof next.mutate === "function") next.mutate(options.cwd, options.input);
    return {
      stdout: "",
      stderr: "",
      exitCode: 0,
      signal: null,
      timedOut: false,
      interrupted: false,
      durationMs: 1,
      ...next,
    };
  }

  return {
    run,
    calls,
    spawned,
    killed,
    remaining: () => sequence.length,
    enqueue(result) {
      sequence.push(result);
    },
  };
}

function createFakeClock(startIso = "2026-01-01T00:00:00.000Z") {
  let current = new Date(startIso).getTime();
  return {
    now() {
      const iso = new Date(current).toISOString();
      current += 1;
      return iso;
    },
    advance(ms) {
      current += ms;
    },
  };
}

module.exports = {
  DEFAULT_GIT_STATE,
  createFakeClock,
  createFakeCommandRunner,
  createFakeGitAdapter,
};
