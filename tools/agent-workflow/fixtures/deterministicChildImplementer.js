#!/usr/bin/env node
// Deterministic stand-in for a real Claude/Codex CLI implementer process,
// spawned by the real tools/agent-workflow/cli.js `orchestrate` loop against
// a disposable verification repository (see externalAdosChildRunGateway.js).
// It reads the real implement/fix-stage prompt from stdin (ignored -- the
// change is deterministic by design, see authoritative Spec 148 requirement
// 23) and performs one small, real, committed file change so the real
// orchestrator can compute a genuine candidate SHA. It never writes any
// .agent-workflow/ durable artifact itself -- those are produced solely by
// the real orchestrateCommand.js code that spawns this process.
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

let input = "";
process.stdin.on("data", (chunk) => { input += chunk; });
process.stdin.on("end", () => {
  try {
    const notePath = path.join(process.cwd(), "VERIFICATION.md");
    const existing = fs.existsSync(notePath) ? fs.readFileSync(notePath, "utf8") : "";
    fs.writeFileSync(notePath, `${existing}Deterministic child implementer change at ${new Date().toISOString()}.\n`, "utf8");
    execFileSync("git", ["add", "-A"], { cwd: process.cwd(), stdio: "ignore" });
    execFileSync("git", ["commit", "-q", "-m", "Deterministic child implementer commit"], { cwd: process.cwd(), stdio: "ignore" });
    process.exit(0);
  } catch (error) {
    process.stderr.write(String(error && error.message ? error.message : error));
    process.exit(1);
  }
});
