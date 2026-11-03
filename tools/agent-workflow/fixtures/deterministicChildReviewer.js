#!/usr/bin/env node
// Deterministic stand-in for a real Codex CLI reviewer process (see
// deterministicChildImplementer.js for the implementer half of this
// boundary). It reads the real review-stage prompt from stdin (ignored) and
// prints an Approved decision in the exact format tools/agent-workflow's
// real detectDecision()/extractReviewFindings() parse -- the real reviewer
// stage machinery (not this script) is what turns that stdout into the
// durable review record.
let input = "";
process.stdin.on("data", (chunk) => { input += chunk; });
process.stdin.on("end", () => {
  process.stdout.write([
    "# Review Decision: Approved",
    "",
    "## Blocking Findings",
    "(none)",
    "## Non-Blocking Improvements",
    "(none)",
    "## Validation Performed",
    "Deterministic child reviewer: verification-only disposable repository.",
    "## Final Recommendation",
    "Approve.",
    "",
  ].join("\n"));
  process.exit(0);
});
