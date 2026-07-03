import { describe, expect, it } from "vitest";

import { CompanyInfluencePlanningService } from "./CompanyInfluencePlanningService";

describe("CompanyInfluencePlanningService", () => {
  it("provides the fixed focus options in deterministic order", () => {
    const service = new CompanyInfluencePlanningService();

    expect(service.getFocusOptions().map((option) => option.label)).toEqual([
      "Improve delivery speed",
      "Improve quality",
      "Improve team morale",
      "Reduce project risk",
      "Prepare for company growth",
    ]);
  });

  it("creates an initial unset advisory state", () => {
    const service = new CompanyInfluencePlanningService();

    const summary = service.createFocusSummary(service.createInitialState());

    expect(summary).toMatchObject({
      isSet: false,
      currentFocus: undefined,
      summary: "No company focus selected. The company is observing current conditions.",
    });
    expect(summary.options).toHaveLength(5);
  });

  it("selects one valid focus at a time", () => {
    const service = new CompanyInfluencePlanningService();

    const firstState = service.selectFocus(service.createInitialState(), "delivery-speed", "2026-01-01T09:00:00.000Z");
    const secondState = service.selectFocus(firstState, "quality", "2026-01-01T09:05:00.000Z");

    expect(firstState).toEqual({
      selectedFocusId: "delivery-speed",
      updatedAt: "2026-01-01T09:00:00.000Z",
    });
    expect(secondState).toEqual({
      selectedFocusId: "quality",
      updatedAt: "2026-01-01T09:05:00.000Z",
    });
    expect(service.createFocusSummary(secondState).currentFocus?.label).toBe("Improve quality");
  });

  it("keeps same-focus selection idempotent when timestamp is unchanged", () => {
    const service = new CompanyInfluencePlanningService();
    const state = service.selectFocus(service.createInitialState(), "team-morale", "2026-01-01T09:00:00.000Z");

    expect(service.selectFocus(state, "team-morale", "2026-01-01T09:00:00.000Z")).toEqual(state);
  });

  it("ignores invalid focus identifiers without side effects", () => {
    const service = new CompanyInfluencePlanningService();
    const state = service.selectFocus(service.createInitialState(), "project-risk", "2026-01-01T09:00:00.000Z");

    expect(service.selectFocus(state, "assign-everyone", "2026-01-01T10:00:00.000Z")).toEqual(state);
  });

  it("returns cloned option metadata so callers cannot mutate canonical options", () => {
    const service = new CompanyInfluencePlanningService();
    const options = service.getFocusOptions();

    options[0].futureMetadataTags.push("mutated");

    expect(service.getFocusOptions()[0].futureMetadataTags).toEqual(["delivery", "throughput"]);
  });
});
