import { expect, test, type Locator, type Page } from "@playwright/test";

const SESSION_KEY = "aiverse.office.session";

test("office backlog keeps project-scoped tasks isolated through switch and reload", async ({ page }) => {
  await page.addInitScript((snapshot) => {
    if (!window.localStorage.getItem("aiverse.office.session")) {
      window.localStorage.setItem("aiverse.office.session", JSON.stringify(snapshot));
    }
  }, createBacklogSessionSnapshot());

  await page.goto("/");

  const canvasHost = page.locator(".city-scene-canvas");
  await expect(canvasHost).toBeVisible();
  await expect(canvasHost.locator("canvas")).toBeVisible();
  await expect(canvasHost).toHaveAttribute("data-aiverse-city-canvas-state", "ready");

  await clickWorldPoint(page, canvasHost, 244, 282);
  await expect(canvasHost).toHaveAttribute("data-aiverse-office-project-id", "daily-proof");
  await openBacklogFromOfficeDashboard(page, canvasHost);
  await expectBacklog(canvasHost, {
    projectId: "daily-proof",
    taskCount: 2,
    includes: ["Add customer search", "Fix invoice export"],
    excludes: ["Add photo tagging"],
  });

  await page.getByLabel("Backlog task title").fill("Improve onboarding checklist");
  await page.getByLabel("Backlog task description").fill("Add an operator onboarding checklist to the admin page.");
  await page.getByLabel("Backlog task priority").selectOption("high");
  await page.getByRole("button", { name: "Create backlog task" }).evaluate((button) => {
    (button as HTMLButtonElement).click();
  });
  await expectBacklog(canvasHost, {
    projectId: "daily-proof",
    taskCount: 3,
    includes: ["Improve onboarding checklist"],
    excludes: ["Add photo tagging"],
  });

  await page.getByLabel("Backlog task priority").selectOption("urgent");
  await page.getByLabel("Backlog task planning status").selectOption("ready");
  await page.getByRole("button", { name: "Update selected task" }).evaluate((button) => {
    (button as HTMLButtonElement).click();
  });
  await expect(canvasHost).toHaveAttribute("data-aiverse-office-backlog-selected-task-status", "ready");
  await expect(canvasHost).toHaveAttribute("data-aiverse-office-backlog-selected-task-priority", "urgent");

  await closePortalAndReturnToCity(page, canvasHost);
  await clickWorldPoint(page, canvasHost, 898, 276);
  await expect(canvasHost).toHaveAttribute("data-aiverse-office-project-id", "ai-lab");
  await openBacklogFromOfficeDashboard(page, canvasHost);
  await expectBacklog(canvasHost, {
    projectId: "ai-lab",
    taskCount: 1,
    includes: ["Add photo tagging"],
    excludes: ["Add customer search", "Fix invoice export", "Improve onboarding checklist"],
  });

  await closePortalAndReturnToCity(page, canvasHost);
  await moveLeftToDailyProof(page, canvasHost);
  await page.keyboard.press("Space");
  await expect(canvasHost).toHaveAttribute("data-aiverse-office-project-id", "daily-proof");
  await openBacklogFromOfficeDashboard(page, canvasHost);
  await expectBacklog(canvasHost, {
    projectId: "daily-proof",
    taskCount: 3,
    includes: ["Add customer search", "Fix invoice export", "Improve onboarding checklist"],
    excludes: ["Add photo tagging"],
  });

  await page.reload();
  await expect(canvasHost).toHaveAttribute("data-aiverse-city-canvas-state", "ready");
  await clickWorldPoint(page, canvasHost, 244, 282);
  await expect(canvasHost).toHaveAttribute("data-aiverse-office-project-id", "daily-proof");
  await openBacklogFromOfficeDashboard(page, canvasHost);
  await expectBacklog(canvasHost, {
    projectId: "daily-proof",
    taskCount: 3,
    includes: ["Add customer search", "Fix invoice export", "Improve onboarding checklist"],
    excludes: ["Add photo tagging"],
  });
  await expect(canvasHost).toHaveAttribute("data-aiverse-office-backlog-selected-task-status", "ready");
  await expect(canvasHost).toHaveAttribute("data-aiverse-office-backlog-selected-task-priority", "urgent");

  const storedSnapshot = await page.evaluate((key) => window.localStorage.getItem(key), SESSION_KEY);
  const restored = JSON.parse(storedSnapshot ?? "{}") as ReturnType<typeof createBacklogSessionSnapshot>;
  expect(restored.projectBacklogCollections["daily-proof"].tasks).toHaveLength(3);
  expect(restored.projectBacklogCollections["ai-lab"].tasks.map((task) => task.title)).toEqual(["Add photo tagging"]);
  expect(restored.externalProjectDevelopmentRequestDrafts["daily-proof"]).toBeUndefined();
  expect(restored.externalProjectAdosRunStatuses["daily-proof"]).toBeUndefined();

  await page.screenshot({
    path: "specs/141-operator-task-planning-project-backlog-foundation/runtime-project-backlog-office.png",
    fullPage: true,
  });
});

async function openBacklogFromOfficeDashboard(page: Page, canvasHost: Locator) {
  await clickOfficeWorldPoint(page, canvasHost, 480, 300);
  await expect(canvasHost).toHaveAttribute("data-aiverse-office-portal-view-mode", "list");
  await pressUntilPortalMode(page, canvasHost, "KeyC", "project-backlog");
  await expect(canvasHost).toHaveAttribute("data-aiverse-office-portal-view-mode", "project-backlog");
}

async function pressUntilPortalMode(
  page: Page,
  canvasHost: Locator,
  key: string,
  expectedMode: string,
) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await page.keyboard.press(key);
    try {
      await expect(canvasHost).toHaveAttribute("data-aiverse-office-portal-view-mode", expectedMode, { timeout: 1000 });
      return;
    } catch {
      if (await canvasHost.getAttribute("data-aiverse-office-portal-view-mode") === expectedMode) return;
    }
  }
}

async function closePortalAndReturnToCity(page: Page, canvasHost: Locator) {
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  });
  await page.keyboard.press("Escape");
  await expect(canvasHost).toHaveAttribute("data-aiverse-office-portal-view-mode", "workspace");
  await page.keyboard.press("Escape");
  await expect(canvasHost).toHaveAttribute("data-aiverse-office-portal-view-mode", "detail");
  await page.keyboard.press("Escape");
  await expect(canvasHost).toHaveAttribute("data-aiverse-office-portal-view-mode", "list");
  await page.keyboard.press("Escape");
  await expect(canvasHost).toHaveAttribute("data-aiverse-office-portal-view-mode", "");
  await page.keyboard.down("s");
  try {
    await expect(canvasHost).toHaveAttribute("data-aiverse-office-exit-active", "true", { timeout: 5000 });
  } finally {
    await page.keyboard.up("s");
  }
  await page.keyboard.press("Space");
  await expect(canvasHost).toHaveAttribute("data-aiverse-active-scene", "city");
}

async function clickWorldPoint(page: Page, canvasHost: Locator, worldX: number, worldY: number) {
  const box = await canvasHost.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.click(
    box!.x + (worldX / 1200) * box!.width,
    box!.y + (worldY / 720) * box!.height,
  );
}

async function clickOfficeWorldPoint(page: Page, canvasHost: Locator, worldX: number, worldY: number) {
  const box = await canvasHost.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.click(
    box!.x + (worldX / 960) * box!.width,
    box!.y + (worldY / 600) * box!.height,
  );
}

async function moveLeftToDailyProof(page: Page, canvasHost: Locator) {
  await page.keyboard.down("a");
  try {
    await expect(canvasHost).toHaveAttribute("data-aiverse-city-canvas-active-project-id", "daily-proof", { timeout: 5000 });
  } finally {
    await page.keyboard.up("a");
  }
}

async function expectBacklog(
  canvasHost: Locator,
  expected: {
    projectId: string;
    taskCount: number;
    includes: string[];
    excludes: string[];
  },
) {
  await expect(canvasHost).toHaveAttribute("data-aiverse-office-backlog-project-id", expected.projectId);
  await expect(canvasHost).toHaveAttribute("data-aiverse-office-backlog-task-count", String(expected.taskCount));
  const titles = JSON.parse(
    await canvasHost.getAttribute("data-aiverse-office-backlog-task-titles") ?? "[]",
  ) as string[];
  for (const title of expected.includes) expect(titles).toContain(title);
  for (const title of expected.excludes) expect(titles).not.toContain(title);
}

function createBacklogSessionSnapshot() {
  return {
    version: "browser-office-session-v1",
    savedAt: "2026-08-31T00:00:00.000Z",
    selectedProjectId: "daily-proof",
    selectedProjectDashboardActiveWorkIndex: 0,
    projectRegistryEntries: [
      project("daily-proof", "Daily Proof", "DAILY PROOF INC."),
      project("ai-lab", "AI Lab", "AI LAB"),
    ],
    projectCompanyBindings: [
      binding("daily-proof-inc", "daily-proof", "DAILY PROOF INC."),
      binding("ai-lab", "ai-lab", "AI LAB"),
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
    externalProjectDevelopmentRequestDrafts: {},
    externalProjectAdosRunPreparations: {},
    externalProjectAdosExecutions: {},
    externalProjectAdosExecutionResults: {},
    externalProjectAdosRunStatuses: {},
    projectBacklogCollections: {
      "daily-proof": {
        projectId: "daily-proof",
        tasks: [
          backlogTask("daily-proof", "daily-proof:backlog:1", "Add customer search", "Add customer search to the admin page.", "high", "backlog"),
          backlogTask("daily-proof", "daily-proof:backlog:2", "Fix invoice export", "Keep selected filters in exported invoices.", "normal", "blocked", "Waiting on finance sample."),
        ],
      },
      "ai-lab": {
        projectId: "ai-lab",
        tasks: [
          backlogTask("ai-lab", "ai-lab:backlog:1", "Add photo tagging", "Create manual tagging for uploaded photos.", "urgent", "ready"),
        ],
      },
    },
    implementerRuntimeCollections: {},
    implementerRuntimeResultCollections: {},
    reviewerRuntimeCollections: {},
    reviewerRuntimeResultCollections: {},
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

function backlogTask(
  projectId: string,
  id: string,
  title: string,
  description: string,
  priority: "low" | "normal" | "high" | "urgent",
  status: "backlog" | "ready" | "in_progress" | "blocked" | "completed" | "cancelled",
  blockedReason?: string,
) {
  return {
    id,
    projectId,
    title,
    description,
    status,
    priority,
    createdAt: "2026-08-31T00:00:00.000Z",
    updatedAt: "2026-08-31T00:00:00.000Z",
    ...(blockedReason ? { blockedReason } : {}),
  };
}
