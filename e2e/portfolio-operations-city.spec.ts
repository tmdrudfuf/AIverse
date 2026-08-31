import { expect, test } from "@playwright/test";

const SESSION_KEY = "aiverse.office.session";

test("city renders multiple project portfolio operations states from scoped session data", async ({ page }) => {
  await page.addInitScript((snapshot) => {
    window.localStorage.setItem("aiverse.office.session", JSON.stringify(snapshot));
  }, createPortfolioSessionSnapshot());

  await page.goto("/");

  const canvasHost = page.locator(".city-scene-canvas");
  await expect(canvasHost).toBeVisible();
  await expect(canvasHost.locator("canvas")).toBeVisible();
  await expect(canvasHost).toHaveAttribute("data-aiverse-city-canvas-state", "ready");
  await expect(canvasHost).toHaveAttribute("data-aiverse-city-canvas-portfolio-labels", /daily-proof:ACTIVE/);
  const portfolioLabels = await canvasHost.getAttribute("data-aiverse-city-canvas-portfolio-labels");
  expect(portfolioLabels).toContain("daily-proof:ACTIVE");
  expect(portfolioLabels).toContain("ai-lab:NEEDS ATTENTION");
  expect(portfolioLabels).toContain("portfolio:RECENTLY COMPLETED");

  await page.screenshot({
    path: "specs/140-project-portfolio-operations/runtime-portfolio-city.png",
    fullPage: true,
  });

  const storedSnapshot = await page.evaluate((key) => window.localStorage.getItem(key), SESSION_KEY);
  expect(storedSnapshot).toBe(JSON.stringify(createPortfolioSessionSnapshot()));
});

function createPortfolioSessionSnapshot() {
  return {
    version: "browser-office-session-v1",
    savedAt: "2026-08-31T00:00:00.000Z",
    selectedProjectId: "daily-proof",
    selectedProjectDashboardActiveWorkIndex: 0,
    projectRegistryEntries: [
      project("daily-proof", "Daily Proof", "DAILY PROOF INC."),
      project("ai-lab", "AI Lab", "AI LAB"),
      project("portfolio", "Portfolio", "PORTFOLIO STUDIO"),
    ],
    projectCompanyBindings: [
      binding("daily-proof-inc", "daily-proof", "DAILY PROOF INC."),
      binding("ai-lab", "ai-lab", "AI LAB"),
      binding("portfolio-studio", "portfolio", "PORTFOLIO STUDIO"),
    ],
    candidateTaskCollections: {},
    candidateAssignmentCollections: {},
    candidatePromotionReviewCollections: {},
    candidatePromotionDecisionRecords: {},
    candidateProjectTaskPromotionResultCollections: {},
    taskCollections: {},
    employees: [],
    confirmedEmployeeAssignmentRecords: {},
    confirmedEmployeeAssignmentResultCollections: {},
    preparedWorkSessionRecords: {},
    preparedWorkSessionResultCollections: {},
    activeWorkSessionStartResultCollections: {},
    externalProjectDevelopmentRequestDrafts: {
      "ai-lab": {
        id: "ai-lab-draft",
        projectId: "ai-lab",
        projectName: "AI Lab",
        companyName: "AI LAB",
        status: "Prepared",
        title: "Address review feedback",
        summary: "Resolve a scoped review issue for AI Lab.",
        adosRunId: "ai-lab-run",
        repositoryProvider: "local",
        createdAt: "2026-08-31T00:15:00.000Z",
        updatedAt: "2026-08-31T00:15:00.000Z",
        sideEffectBoundary: "Playwright fixture only.",
      },
    },
    externalProjectAdosRunPreparations: {},
    externalProjectAdosExecutions: {},
    externalProjectAdosExecutionResults: {},
    externalProjectAdosRunStatuses: {
      "daily-proof": runStatus("daily-proof", "Started", "Started"),
      "portfolio": runStatus("portfolio", "Completed", "Completed"),
    },
    implementerRuntimeCollections: {},
    implementerRuntimeResultCollections: {},
    reviewerRuntimeCollections: {},
    reviewerRuntimeResultCollections: {
      "ai-lab": {
        projectId: "ai-lab",
        results: [{
          id: "ai-lab-review-result",
          projectId: "ai-lab",
          status: "Completed",
          decision: "ChangesRequested",
          blockingFindingCount: 1,
          nonBlockingFindingCount: 0,
          reasonCodes: ["REVIEWER_RUNTIME_DECISION_UNKNOWN"],
          started: true,
          duplicateActiveAttempt: false,
          agentStarted: true,
          implementerStarted: true,
          reviewerStarted: true,
          validationStarted: false,
          repositoryMutationStarted: false,
          githubMutationStarted: false,
          resultAt: "2026-08-31T00:20:00.000Z",
          rulesVersion: "codex-reviewer-v1",
        }],
        resultCount: 1,
        rulesVersion: "codex-reviewer-v1",
      },
    },
    reviewPromotionCollections: {},
    reviewPromotionResultCollections: {},
    reviewFixRuntimeCollections: {},
    reviewFixRuntimeResultCollections: {},
    validationRuntimeCollections: {},
    validationRuntimeResultCollections: {},
    postValidationReviewTargetCollections: {},
    postValidationReviewTargetResultCollections: {},
    workSessions: {},
  };
}

function project(id: string, displayName: string, companyName: string) {
  return {
    id,
    displayName,
    shortDescription: `${displayName} software project.`,
    lifecycleStatus: "Active",
    projectType: "Company",
    localRepository: {
      connected: true,
      label: "Bound (local)",
    },
    localRepositoryBinding: {
      projectId: id,
      repositoryPath: `C:/repos/${id}`,
      worktreePath: `C:/worktrees/${id}`,
    },
    repositoryIdentity: {
      provider: "local",
      localPath: `C:/worktrees/${id}`,
      connectionState: "Configured",
    },
    owner: { companyName },
    createdAt: "2026-08-31T00:00:00.000Z",
    lastActivityAt: "2026-08-31T00:00:00.000Z",
  };
}

function binding(buildingId: string, projectId: string, companyName: string) {
  return {
    bindingId: buildingId,
    buildingId,
    projectId,
    companyName,
    status: "bound",
  };
}

function runStatus(projectId: string, stage: "Started" | "Completed", status: string) {
  return {
    id: `${projectId}:external-ados-run-status:external-ados-run-status-v1`,
    projectId,
    stage,
    status,
    source: "execution",
    reasonCodes: [],
    executionId: `${projectId}-run`,
    updatedAt: "2026-08-31T00:10:00.000Z",
    validationStarted: false,
    reviewStarted: false,
    repositoryMutationStarted: false,
    githubMutationStarted: false,
    publishStarted: false,
    mergeStarted: false,
    deployStarted: false,
    rulesVersion: "external-ados-run-status-v1",
  };
}
