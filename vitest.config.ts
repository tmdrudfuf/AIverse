import { configDefaults, defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Spec 056 (Agent Workflow Performance and Review Convergence), Part A:
// this repository's working directory can contain harness-managed git
// worktrees under .claude/worktrees/ (gitignored, created by other sessions/
// tasks). Vitest's default file discovery has no git-boundary awareness and
// would otherwise pick up a nested worktree's own copy of
// tools/agent-workflow/*.test.ts as additional test files, silently
// duplicating and inflating both test counts and measured duration for
// anyone running `npm test` from this directory. This exclusion is purely
// about which files Vitest treats as tests to run from this checkout; it
// does not read, modify, or delete anything under .claude/worktrees/.
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    exclude: [...configDefaults.exclude, "**/.claude/**", "e2e/**"],
  },
});
