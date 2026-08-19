import { describe, expect, it } from "vitest";

import { OfficeInteractiveObjectRegistry } from "./OfficeInteractiveObjectRegistry";
import { OfficeInteractionController } from "./OfficeInteractionController";
import type { OfficeInteractiveObject } from "./officeTypes";

describe("OfficeInteractionController", () => {
  it("clears active interaction when the registered object is removed before action consumption", () => {
    const registry = new OfficeInteractiveObjectRegistry([
      createObject("computer-1", { x: 0, y: 0, width: 20, height: 20 }),
    ]);
    const controller = new OfficeInteractionController(registry);

    controller.update({ x: 10, y: 10 });
    expect(controller.getActiveObject()?.id).toBe("computer-1");

    registry.removeObject("computer-1");

    expect(controller.consumePlaceholderInteraction()).toBeUndefined();
    expect(controller.getActiveObject()).toBeUndefined();
  });

  it("clears active interaction when the registered object is disabled before action consumption", () => {
    const registry = new OfficeInteractiveObjectRegistry([
      createObject("computer-1", { x: 0, y: 0, width: 20, height: 20 }),
    ]);
    const controller = new OfficeInteractionController(registry);

    controller.update({ x: 10, y: 10 });
    registry.updateObject("computer-1", { enabled: false });

    expect(controller.consumePlaceholderInteraction()).toBeUndefined();
    expect(controller.getActiveObject()).toBeUndefined();
  });

  it("uses the latest registered object details for placeholder interactions", () => {
    const registry = new OfficeInteractiveObjectRegistry([
      createObject("computer-1", { x: 0, y: 0, width: 20, height: 20 }),
    ]);
    const controller = new OfficeInteractionController(registry);

    controller.update({ x: 10, y: 10 });
    registry.updateObject("computer-1", { displayName: "Build Station", action: "open_workspace" });

    expect(controller.consumePlaceholderInteraction()).toEqual({
      objectId: "computer-1",
      action: "open_workspace",
      status: "placeholder",
      message: "Build Station interaction is a placeholder.",
    });
  });
});

function createObject(
  id: string,
  interactionZone: OfficeInteractiveObject["interactionZone"],
): OfficeInteractiveObject {
  return {
    id,
    type: "computer",
    displayName: "Computer",
    interactionZone,
    enabled: true,
    action: "use_computer",
    markerId: id,
  };
}
