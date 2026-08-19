import { describe, expect, it } from "vitest";

import { OfficeInteractiveObjectRegistry } from "./OfficeInteractiveObjectRegistry";
import type { OfficeInteractiveObject } from "./officeTypes";

describe("OfficeInteractiveObjectRegistry", () => {
  it("registers interactables after construction and selects the nearest active object", () => {
    const registry = new OfficeInteractiveObjectRegistry([]);

    registry.registerObject(createObject("far", { x: 0, y: 0, width: 100, height: 100 }));
    registry.registerObject(createObject("near", { x: 40, y: 40, width: 20, height: 20 }));

    expect(registry.findActiveObject({ x: 50, y: 50 })?.id).toBe("near");
  });

  it("replaces objects with the same id without creating duplicates", () => {
    const registry = new OfficeInteractiveObjectRegistry([
      createObject("computer-1", { x: 0, y: 0, width: 20, height: 20 }),
    ]);

    registry.registerObject(createObject("computer-1", { x: 80, y: 80, width: 20, height: 20 }, "Updated Computer"));

    expect(registry.getObjects()).toHaveLength(1);
    expect(registry.findActiveObject({ x: 90, y: 90 })).toMatchObject({
      id: "computer-1",
      displayName: "Updated Computer",
    });
    expect(registry.findActiveObject({ x: 10, y: 10 })).toBeUndefined();
  });

  it("updates existing objects while preserving unchanged fields", () => {
    const registry = new OfficeInteractiveObjectRegistry([
      createObject("whiteboard-1", { x: 0, y: 0, width: 20, height: 20 }, "Whiteboard", {
        type: "whiteboard",
        action: "inspect",
      }),
    ]);

    const updated = registry.updateObject("whiteboard-1", { enabled: false, displayName: "Planning Board" });

    expect(updated).toMatchObject({
      id: "whiteboard-1",
      type: "whiteboard",
      action: "inspect",
      enabled: false,
      displayName: "Planning Board",
    });
    expect(registry.findActiveObject({ x: 10, y: 10 })).toBeUndefined();
  });

  it("removes objects by id and reports whether removal occurred", () => {
    const registry = new OfficeInteractiveObjectRegistry([
      createObject("computer-1", { x: 0, y: 0, width: 20, height: 20 }),
    ]);

    expect(registry.removeObject("computer-1")).toBe(true);
    expect(registry.removeObject("computer-1")).toBe(false);
    expect(registry.getObjects()).toEqual([]);
  });

  it("returns defensive object copies", () => {
    const registry = new OfficeInteractiveObjectRegistry([
      createObject("computer-1", { x: 0, y: 0, width: 20, height: 20 }),
    ]);
    const [object] = registry.getObjects();

    object.displayName = "Mutated";
    object.interactionZone.x = 999;

    expect(registry.getObject("computer-1")).toMatchObject({
      displayName: "Computer",
      interactionZone: { x: 0 },
    });
  });
});

function createObject(
  id: string,
  interactionZone: OfficeInteractiveObject["interactionZone"],
  displayName = "Computer",
  overrides: Partial<OfficeInteractiveObject> = {},
): OfficeInteractiveObject {
  return {
    id,
    type: "computer",
    displayName,
    interactionZone,
    enabled: true,
    action: "use_computer",
    markerId: id,
    ...overrides,
  };
}
