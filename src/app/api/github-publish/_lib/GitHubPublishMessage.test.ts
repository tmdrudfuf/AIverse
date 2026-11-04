import { describe, expect, it } from "vitest";
import { generatePublishMessage } from "./GitHubPublishMessage";

describe("generatePublishMessage", () => {
  it("handles zero changed files", () => {
    const result = generatePublishMessage([]);
    expect(result.commitMessage).toContain("0 files changed");
    expect(result.prBody).not.toContain("Changed files:");
  });

  it("handles exactly one changed file (singular wording)", () => {
    const result = generatePublishMessage(["src/foo.ts"]);
    expect(result.commitMessage).toContain("1 file changed");
    expect(result.prBody).toContain("- src/foo.ts");
  });

  it("handles many changed files", () => {
    const result = generatePublishMessage(["a.ts", "b.ts", "c.ts"]);
    expect(result.commitMessage).toContain("3 files changed");
    expect(result.prBody).toContain("- a.ts");
    expect(result.prBody).toContain("- b.ts");
    expect(result.prBody).toContain("- c.ts");
  });

  it("uses the commit message as the PR title", () => {
    const result = generatePublishMessage(["a.ts"]);
    expect(result.prTitle).toBe(result.commitMessage);
  });
});
