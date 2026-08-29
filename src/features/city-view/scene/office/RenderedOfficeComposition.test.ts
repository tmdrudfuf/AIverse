import { describe, expect, it } from "vitest";

import {
  createRenderedOfficeComposition,
  getRenderedOfficeWorkplacePosition,
} from "./RenderedOfficeComposition";

describe("createRenderedOfficeComposition", () => {
  it("defines all required physical departments with recognizable fixtures", () => {
    const composition = createRenderedOfficeComposition(createOffice("Example Labs"));

    expect(composition.departments.map((department) => department.kind)).toEqual([
      "engineering",
      "review",
      "validation-qa",
      "project-status-operations",
    ]);
    expect(composition.density).toMatchObject({
      departments: 4,
      workstations: 8,
      monitors: 23,
    });
    expect(composition.density.fixtures).toBeGreaterThan(40);
  });

  it("renders Engineering as multiple developer workstations", () => {
    const composition = createRenderedOfficeComposition(createOffice("Example Labs"));
    const engineering = composition.departments.find((department) => department.kind === "engineering");

    expect(engineering?.workstations).toHaveLength(4);
    expect(engineering?.fixtures.map((fixture) => fixture.kind)).toEqual(
      expect.arrayContaining(["developer-desk", "monitor", "chair", "board", "shelf"]),
    );
  });

  it("renders Review, Validation, and Operations as dedicated physical work areas", () => {
    const composition = createRenderedOfficeComposition(createOffice("Example Labs"));
    const review = composition.departments.find((department) => department.kind === "review");
    const validation = composition.departments.find((department) => department.kind === "validation-qa");
    const operations = composition.departments.find((department) => department.kind === "project-status-operations");

    expect(review?.fixtures.map((fixture) => fixture.kind)).toEqual(
      expect.arrayContaining(["reviewer-desk", "monitor", "chair", "board"]),
    );
    expect(validation?.workstations).toHaveLength(2);
    expect(validation?.fixtures.map((fixture) => fixture.kind)).toEqual(
      expect.arrayContaining(["qa-desk", "test-rack", "board"]),
    );
    expect(operations?.fixtures.map((fixture) => fixture.kind)).toEqual(
      expect.arrayContaining(["status-display", "planning-table", "operations-desk"]),
    );
  });

  it("uses dynamic project identity for signage data", () => {
    const composition = createRenderedOfficeComposition(createOffice("Northstar Tools"));

    expect(composition.companyName).toBe("Northstar Tools");
    expect(composition.sharedSpaces.find((space) => space.kind === "reception")?.label).toBe("Northstar Tools");
    expect(JSON.stringify(composition)).not.toContain("Daily Proof");
  });

  it("maps NPC workplace destinations to visible rendered office anchors", () => {
    expect(getRenderedOfficeWorkplacePosition("workstation", 0)).toEqual({ x: 136, y: 206 });
    expect(getRenderedOfficeWorkplacePosition("workstation", 3)).toEqual({ x: 282, y: 328 });
    expect(getRenderedOfficeWorkplacePosition("review", 0)).toEqual({ x: 510, y: 200 });
    expect(getRenderedOfficeWorkplacePosition("meetingArea", 0)).toEqual({ x: 738, y: 470 });
    expect(getRenderedOfficeWorkplacePosition("breakArea", 1)).toEqual({ x: 282, y: 462 });
  });
});

function createOffice(companyName: string) {
  return {
    companyName,
    worldBounds: { x: 0, y: 0, width: 960, height: 600 },
  };
}
