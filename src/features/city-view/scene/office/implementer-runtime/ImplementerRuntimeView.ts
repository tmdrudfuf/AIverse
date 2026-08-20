import type { RuntimeStartResultCollection } from "../runtime-start/RuntimeStartTypes";
import type { ImplementerRuntimeResultCollection } from "./ImplementerRuntimeTypes";

export type ImplementerRuntimeDisplayRows = {
  statusText: string;
};

/**
 * Row text is deliberately compact (verified against the existing 78-char
 * lower-panel wrap budget before writing, the same way Spec 062's issue rows
 * were bounded) so every state fits on one line without relying on the
 * shared ellipsis clamp to cut off "Codex Reviewer Not Started" or "Remote
 * Mutation Disabled" mid-phrase.
 */
export function createImplementerRuntimeDisplayRows(
  runtimeStartResults: RuntimeStartResultCollection | undefined,
  results: ImplementerRuntimeResultCollection | undefined,
): ImplementerRuntimeDisplayRows {
  const hasRuntimeStart = runtimeStartResults?.results.some(
    (item) => item.status === "Started" || item.status === "AlreadyStarted",
  ) ?? false;

  if (!hasRuntimeStart) {
    return { statusText: "Implementer unavailable; needs Start; not started" };
  }

  const latestResult = results?.results[results.results.length - 1];
  if (!latestResult) {
    return { statusText: "Claude ready; press I to start; Codex not started" };
  }

  switch (latestResult.status) {
    case "Completed":
      return { statusText: "Completed; not validated; Codex not started; no mutation" };
    case "TimedOut":
      return { statusText: "Timed out; inspect; Codex not started; no mutation" };
    case "Cancelled":
      return { statusText: "Cancelled; Codex not started; no mutation" };
    case "Failed":
      return { statusText: "Failed; inspect needed; Codex not started; no mutation" };
    case "Blocked":
    default:
      return { statusText: "Claude blocked; resolve requirements; Codex not started" };
  }
}
