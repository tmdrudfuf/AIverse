/**
 * Generates the commit message and pull-request title/body from the
 * changed-file list alone -- no operator free-text input in this feature's
 * v1 (research.md Decision 5). Used identically by the preview endpoint
 * and the real publish sequence, so the preview the operator sees is
 * exactly what gets committed.
 */
export function generatePublishMessage(changedFiles: readonly string[]): {
  commitMessage: string;
  prTitle: string;
  prBody: string;
} {
  const fileCount = changedFiles.length;
  const summary = fileCount === 1 ? "1 file changed" : `${fileCount} files changed`;
  const commitMessage = `AIverse maintenance update: ${summary}`;
  const fileList = changedFiles.map((file) => `- ${file}`).join("\n");
  return {
    commitMessage,
    prTitle: commitMessage,
    prBody: fileCount === 0
      ? "AIverse maintenance update."
      : `AIverse maintenance update.\n\nChanged files:\n${fileList}`,
  };
}
