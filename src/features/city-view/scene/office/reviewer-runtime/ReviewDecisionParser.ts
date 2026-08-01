import type { ReviewerFindingSeverity, ReviewerRuntimeDecision, ReviewerRuntimeFinding } from "./ReviewerRuntimeTypes";

const MAX_FINDINGS = 20;
const MAX_MESSAGE_LENGTH = 300;
const MAX_PATH_LENGTH = 200;

// Matches this feature's own prompt contract (see contracts/output-decision-contract.md):
// `Finding: <P1|P2|P3> | <blocking|non-blocking> | <category> | <path[:line]> | <message> [| <suggestion>]`
const FINDING_LINE_PATTERN = /^Finding:\s*(.+)$/i;

export type ParsedReviewOutput = {
  decision: ReviewerRuntimeDecision;
  findings: ReviewerRuntimeFinding[];
};

/**
 * Bounded, deterministic parser for Codex's reviewer output. Mirrors the
 * precedence used by `tools/agent-workflow/agentWorkflow.js#detectDecision`
 * (the repo's existing classifier that this feature's regression tests are
 * required to guard against regressing): only explicit decision markers are
 * ever consulted, never free-form approval-sounding prose, and more than one
 * conflicting explicit marker never resolves to Approved.
 */
export function parseReviewOutput(rawText: string, exitCode: number | undefined): ParsedReviewOutput {
  const text = String(rawText || "");
  const findings = parseFindings(text);
  const hasBlockingFinding = findings.some((finding) => finding.blocking);
  const decision = parseDecisionText(text);

  if (decision === "Approved" && hasBlockingFinding) {
    return { decision: "ChangesRequested", findings };
  }
  // A non-zero exit code is never sufficient evidence of a safe Approved
  // outcome without an explicit repo policy permitting it -- none exists
  // today, so any non-zero exit downgrades a parsed Approved to Unknown
  // rather than trusting text the process may not have finished emitting.
  if (decision === "Approved" && typeof exitCode === "number" && exitCode !== 0) {
    return { decision: "Unknown", findings };
  }
  return { decision, findings };
}

function parseDecisionText(text: string): ReviewerRuntimeDecision {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const normalizeInline = (line: string) => line.replace(/^\*\*(.+)\*\*$/, "$1").trim();
  // Mirrors agentWorkflow.js#detectDecision's two distinct normalizers: the
  // `Decision:`-prefixed marker form strips any heading depth, but a
  // standalone bare-line marker (no `Decision:` prefix) only strips a single
  // `#` -- an h2+ heading (`## Approved`) never counts as a standalone
  // marker, since headings routinely restate section titles that are not
  // decisions.
  const normalizeDecisionHeading = (line: string) => normalizeInline(line.replace(/^#+\s*/, "").trim());
  const normalizeStandaloneDecision = (line: string) => {
    if (/^#{2,}\s*/.test(line)) return "";
    return normalizeInline(line.replace(/^#\s*/, "").trim());
  };

  const isMarker = (line: string, label: string) => {
    if (new RegExp(`^(Review\\s+)?Decision:\\s*${label}\\b`, "i").test(normalizeDecisionHeading(line))) return true;
    const standalone = normalizeStandaloneDecision(line);
    return standalone === label || standalone.startsWith(`${label} `);
  };

  const hasChangesRequested = lines.some((line) => isMarker(line, "Changes Requested"));
  const hasApproved = lines.some((line) => isMarker(line, "Approved"));

  if (hasChangesRequested && hasApproved) return "Unknown";
  if (hasChangesRequested) return "ChangesRequested";
  if (hasApproved) return "Approved";
  return "Unknown";
}

function parseFindings(text: string): ReviewerRuntimeFinding[] {
  const lines = text.split(/\r?\n/);
  const findings: ReviewerRuntimeFinding[] = [];

  for (const line of lines) {
    if (findings.length >= MAX_FINDINGS) break;
    const match = FINDING_LINE_PATTERN.exec(line.trim());
    if (!match) continue;

    const parts = match[1].split("|").map((part) => part.trim());
    const [severityToken, blockingToken, categoryToken, locationToken, messageToken, suggestionToken] = parts;

    const { severity, severityValid } = parseSeverity(severityToken);
    const blocking = parseBlocking(blockingToken, severity, severityValid);
    const { filePath, line: lineNumber } = parseLocation(locationToken);

    findings.push({
      findingId: `finding-${findings.length + 1}`,
      severity,
      blocking,
      category: (categoryToken || "general").slice(0, 50),
      filePath,
      line: lineNumber,
      message: (messageToken || "").slice(0, MAX_MESSAGE_LENGTH),
      suggestion: suggestionToken ? suggestionToken.slice(0, MAX_MESSAGE_LENGTH) : undefined,
    });
  }

  return findings;
}

function parseSeverity(token: string | undefined): { severity: ReviewerFindingSeverity; severityValid: boolean } {
  const normalized = (token || "").trim().toUpperCase();
  if (normalized === "P1" || normalized === "P2" || normalized === "P3") {
    return { severity: normalized, severityValid: true };
  }
  // Fail-safe: an unrecognized severity token must not silently become
  // non-blocking, so it is treated as the most severe, always-blocking tier.
  return { severity: "P1", severityValid: false };
}

function parseBlocking(token: string | undefined, severity: ReviewerFindingSeverity, severityValid: boolean): boolean {
  if (!severityValid) return true;
  const normalized = (token || "").trim().toLowerCase();
  if (normalized === "blocking") return true;
  if (normalized === "non-blocking") return false;
  return severity !== "P3";
}

function parseLocation(token: string | undefined): { filePath?: string; line?: number } {
  const normalized = (token || "").trim();
  if (!normalized) return {};
  if (normalized.includes("..") || /^[a-z]:[\\/]/i.test(normalized) || normalized.startsWith("/")) {
    return {};
  }
  const match = /^(.+?):(\d+)$/.exec(normalized);
  if (match) {
    return { filePath: match[1].slice(0, MAX_PATH_LENGTH), line: Number(match[2]) };
  }
  return { filePath: normalized.slice(0, MAX_PATH_LENGTH) };
}
