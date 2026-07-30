import type {
  HumanExecutionApprovalCollection,
  HumanExecutionApprovalResult,
  HumanExecutionApprovalResultCollection,
} from "./HumanExecutionApprovalTypes";

export type HumanExecutionApprovalDisplayRows = {
  statusText: string;
  resultText?: string;
  approvalText?: string;
};

export function createHumanExecutionApprovalDisplayRows(
  approvals: HumanExecutionApprovalCollection | undefined,
  results: HumanExecutionApprovalResultCollection | undefined,
): HumanExecutionApprovalDisplayRows {
  const approvalCount = approvals?.approvalCount ?? 0;
  const resultCount = results?.resultCount ?? 0;
  const latestApproval = approvals?.approvals[approvals.approvals.length - 1];
  const latestResult = results?.results[results.results.length - 1];

  if (approvalCount === 0 && resultCount === 0) {
    return {
      statusText: "Human Approval Required; Execution Not Approved; Execution Not Started; Approve Execution",
    };
  }

  return {
    statusText: `${approvalCount} human execution approval${approvalCount === 1 ? "" : "s"}`,
    resultText: latestResult ? formatResult(latestResult, Math.max(0, resultCount - 1)) : undefined,
    approvalText: latestApproval
      ? `Human Execution Approval Recorded; approved by ${latestApproval.approvedBy}; Execution Approved; Execution Not Started; Awaiting Runtime Preflight`
      : undefined,
  };
}

function formatResult(result: HumanExecutionApprovalResult, hiddenCount: number) {
  const more = hiddenCount > 0 ? `; +${hiddenCount} more` : "";
  if (result.status === "Approved") {
    return `Human Execution Approval Recorded; Execution Approved; Execution Not Started; Awaiting Runtime Preflight${more}`;
  }
  if (result.status === "AlreadyApproved") {
    return `Human Execution Approval Already Recorded; Execution Approved; Execution Not Started; Awaiting Runtime Preflight${more}`;
  }
  if (result.status === "Failed") {
    return `Approval Validation Failed; Execution Not Started; ${result.reasonCodes[0] ?? "APPROVAL_MALFORMED"}${more}`;
  }
  return `Approval Unavailable; Resolve Readiness Requirements; Execution Not Started; ${result.reasonCodes[0] ?? "READINESS_NOT_READY"}${more}`;
}
