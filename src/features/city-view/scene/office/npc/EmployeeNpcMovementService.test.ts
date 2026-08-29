import { describe, expect, it } from "vitest";

import { EmployeeNpcMovementService } from "./EmployeeNpcMovementService";

describe("EmployeeNpcMovementService", () => {
  it("settles stale movement timestamps instead of leaving employees permanently moving", () => {
    const service = new EmployeeNpcMovementService();

    service.deriveSnapshots([
      snapshot("engineer", "idle"),
    ], "2026-08-29T00:00:00.000Z", {
      engineer: { zone: "idleSpot", slot: 0 },
    });
    service.deriveSnapshots([
      snapshot("engineer", "working"),
    ], "2026-08-29T00:00:01.000Z", {
      engineer: { zone: "workstation", slot: 0 },
    });
    service.deriveSnapshots([
      snapshot("engineer", "working"),
    ], "2026-08-29T00:15:00.000Z", {
      engineer: { zone: "workstation", slot: 0 },
    });

    expect(service.getSnapshots()[0]).toMatchObject({
      movementState: "arrived",
      currentPosition: { zone: "workstation", slot: 0 },
      positionHint: { zone: "workstation", slot: 0 },
    });
  });
});

function snapshot(employeeId: string, currentState: "idle" | "working") {
  return {
    employeeId,
    currentState,
    displayLabel: currentState === "working" ? "Working" : "Idle",
    lastStateChangeAt: "2026-08-29T00:00:00.000Z",
  };
}
