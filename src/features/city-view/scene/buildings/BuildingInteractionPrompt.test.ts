import { describe, expect, it } from "vitest";

import type { CityProjectOperationStatus } from "../CityProjectOperationsStatusService";
import { BuildingInteractionPrompt } from "./BuildingInteractionPrompt";
import type { CityBuildingDefinition } from "./buildingTypes";

describe("BuildingInteractionPrompt", () => {
  it("shows a concise project-scoped portfolio summary for the active building", () => {
    const texts = createTextHarness();
    const prompt = new BuildingInteractionPrompt(createScene(texts) as never);

    prompt.update(building("company-b", "COMPANY B", "project-b"), status({
      buildingId: "company-b",
      projectId: "project-b",
      companyName: "Company B",
      label: "NEEDS ATTENTION",
      reason: "REVIEWER RUNTIME DECISION UNKNOWN",
      requestStatus: "Prepared",
      runId: "project-b:ados-run",
      mutationDisabled: false,
    }));

    expect(texts[0].text).toBe("Company B");
    expect(texts[1].text).toContain("Project project-b");
    expect(texts[1].text).toContain("NEEDS ATTENTION");
    expect(texts[1].text).toContain("Request Prepared");
    expect(texts[1].text).toContain("Reason REVIEWER RUNTIME DECISION UNK...");
    expect(texts[2].text).toBe("Press Space to enter");
  });

  it("fails closed in the prompt for disconnected project summaries", () => {
    const texts = createTextHarness();
    const prompt = new BuildingInteractionPrompt(createScene(texts) as never);

    prompt.update(building("company-z", "COMPANY Z", "project-z"), status({
      buildingId: "company-z",
      projectId: "project-z",
      companyName: "COMPANY Z",
      label: "DISCONNECTED",
      reason: "MISSING PROJECT",
      mutationDisabled: true,
    }));

    expect(texts[1].text).toContain("DISCONNECTED");
    expect(texts[1].text).toContain("No request");
    expect(texts[2].text).toBe("Coming soon");
  });
});

function createTextHarness() {
  return [] as Array<{ text: string; visible: boolean }>;
}

function createScene(texts: Array<{ text: string; visible: boolean }>) {
  return {
    add: {
      text: (_x: number, _y: number, text: string) => {
        const record = { text, visible: false };
        texts.push(record);
        const chain = {
          setScrollFactor: () => chain,
          setDepth: () => chain,
          setVisible: (visible: boolean) => {
            record.visible = visible;
            return chain;
          },
          setText: (nextText: string) => {
            record.text = nextText;
            return chain;
          },
          destroy: () => undefined,
        };
        return chain;
      },
    },
  };
}

function building(id: string, name: string, projectId: string): CityBuildingDefinition {
  return {
    id,
    name,
    type: "company",
    worldPosition: { x: 0, y: 0 },
    size: { width: 1, height: 1 },
    interactionZone: { x: 0, y: 0, width: 1, height: 1 },
    entrancePoint: { x: 0, y: 0 },
    destination: { sceneKey: "office-daily-proof", routeId: "lobby", enabled: true },
    projectBinding: { projectId, bindingId: id },
    active: true,
    visual: { wall: 0, roof: 0, accent: 0 },
  };
}

function status(input: {
  buildingId: string;
  projectId: string;
  companyName: string;
  label: string;
  reason?: string;
  requestStatus?: string;
  runId?: string;
  mutationDisabled: boolean;
}): CityProjectOperationStatus {
  return {
    buildingId: input.buildingId,
    projectId: input.projectId,
    projectName: input.projectId,
    companyName: input.companyName,
    stage: input.label === "DISCONNECTED" ? "disconnected" : "review",
    label: input.label,
    tone: input.label === "DISCONNECTED" ? "disconnected" : "warning",
    reasonText: input.reason,
    mutationDisabled: input.mutationDisabled,
    portfolioSummary: {
      buildingId: input.buildingId,
      projectId: input.projectId,
      projectName: input.projectId,
      companyName: input.companyName,
      bindingStatus: input.label === "DISCONNECTED" ? "unavailable" : "bound",
      workflowStage: input.label === "DISCONNECTED" ? "disconnected" : "review",
      attentionState: input.label === "DISCONNECTED" ? "disconnected" : "needs-attention",
      attentionLabel: input.label,
      tone: input.label === "DISCONNECTED" ? "disconnected" : "warning",
      activeOrResumableRunId: input.runId,
      developmentRequest: input.requestStatus ? { status: input.requestStatus } : undefined,
      blockedReasonSummary: input.reason,
      operatorActionAvailable: !input.mutationDisabled,
    },
  };
}
