import { describe, expect, it } from "vitest";

import type { CityProjectOperationStatusMap } from "../CityProjectOperationsStatusService";
import { CITY_BUILDINGS } from "../config/cityBuildingConfig";
import { createCityBuildingLayer } from "./CityBuildingLayer";

describe("createCityBuildingLayer", () => {
  it("renders project-scoped city status badges for bound companies", () => {
    const textCalls: Array<{ text: string; style: Record<string, unknown> }> = [];
    const scene = {
      add: {
        text: (_x: number, _y: number, text: string, style: Record<string, unknown>) => {
          textCalls.push({ text, style });
          return {
            setOrigin: () => ({
              setAlpha: () => undefined,
            }),
          };
        },
      },
    };
    const graphics = {
      fillStyle: () => graphics,
      fillRect: () => graphics,
      lineStyle: () => graphics,
      strokeRect: () => graphics,
    };
    const statuses: CityProjectOperationStatusMap = {
      "daily-proof-inc": status("daily-proof-inc", "daily-proof", "implementation", "ACTIVE", "active"),
      "ai-lab": status("ai-lab", "ai-lab", "review", "ACTIVE", "active"),
      "portfolio-studio": status("portfolio-studio", "portfolio", "idle", "IDLE", "idle"),
    };

    createCityBuildingLayer(scene as never, graphics as never, statuses);

    expect(textCalls.map((call) => call.text)).toEqual(expect.arrayContaining([
      "DAILY PROOF INC.",
      "ACTIVE",
      "AI LAB",
      "ACTIVE",
      "PORTFOLIO STUDIO",
      "IDLE",
    ]));
    expect(textCalls.find((call) => call.text === "ACTIVE")?.style.backgroundColor).toBe("#f4c85d");
    expect(textCalls.find((call) => call.text === "IDLE")?.style.backgroundColor).toBe("#596171");
  });

  it("renders concise blocked reasons without marking unrelated buildings blocked", () => {
    const textCalls: string[] = [];
    const scene = {
      add: {
        text: (_x: number, _y: number, text: string) => {
          textCalls.push(text);
          return {
            setOrigin: () => ({
              setAlpha: () => undefined,
            }),
          };
        },
      },
    };
    const graphics = {
      fillStyle: () => graphics,
      fillRect: () => graphics,
      lineStyle: () => graphics,
      strokeRect: () => graphics,
    };
    const statuses: CityProjectOperationStatusMap = {
      "daily-proof-inc": {
        ...status("daily-proof-inc", "daily-proof", "blocked", "BLOCKED", "warning"),
        reasonText: "EXTERNAL ADOS EXECUTION SPAWN FAILED",
      },
      "ai-lab": status("ai-lab", "ai-lab", "review", "REVIEW", "active"),
      "portfolio-studio": status("portfolio-studio", "portfolio", "idle", "IDLE", "idle"),
    };

    createCityBuildingLayer(scene as never, graphics as never, statuses);

    expect(textCalls.filter((text) => text === "BLOCKED")).toHaveLength(1);
    expect(textCalls).toContain("REVIEW");
    expect(textCalls).toContain("EXTERNAL ADOS EXECUTION SPAWN FAILED");
  });

  it("keeps the current city company set available for status rendering", () => {
    expect(CITY_BUILDINGS).toHaveLength(3);
  });

  it("dims buildings outside the active portfolio filter without removing them", () => {
    const alphas: number[] = [];
    const textCalls: string[] = [];
    const scene = {
      add: {
        text: (_x: number, _y: number, text: string) => {
          textCalls.push(text);
          return {
            setOrigin: () => ({
              setAlpha: (alpha: number) => {
                alphas.push(alpha);
              },
            }),
          };
        },
      },
    };
    const graphics = {
      fillStyle: () => graphics,
      fillRect: () => graphics,
      lineStyle: () => graphics,
      strokeRect: () => graphics,
    };
    const statuses: CityProjectOperationStatusMap = {
      "daily-proof-inc": status("daily-proof-inc", "daily-proof", "implementation", "ACTIVE", "active"),
      "ai-lab": status("ai-lab", "ai-lab", "blocked", "BLOCKED", "warning"),
      "portfolio-studio": status("portfolio-studio", "portfolio", "idle", "IDLE", "idle"),
    };

    createCityBuildingLayer(scene as never, graphics as never, statuses, { portfolioFilter: "attention" });

    expect(textCalls).toEqual(expect.arrayContaining(["DAILY PROOF INC.", "AI LAB", "PORTFOLIO STUDIO"]));
    expect(alphas).toContain(0.32);
    expect(alphas).toContain(1);
  });
});

function status(
  buildingId: string,
  projectId: string,
  stage: CityProjectOperationStatusMap[string]["stage"],
  label: string,
  tone: CityProjectOperationStatusMap[string]["tone"],
): CityProjectOperationStatusMap[string] {
  return {
    buildingId,
    projectId,
      projectName: projectId,
      companyName: projectId,
      stage,
      label,
      tone,
      mutationDisabled: false,
      portfolioSummary: {
        buildingId,
        projectId,
        projectName: projectId,
        companyName: projectId,
        bindingStatus: "bound",
        workflowStage: stage,
        attentionState: label === "IDLE" ? "idle" : label === "BLOCKED" ? "blocked" : "active",
        attentionLabel: label,
        tone,
        operatorActionAvailable: true,
      },
    };
}
