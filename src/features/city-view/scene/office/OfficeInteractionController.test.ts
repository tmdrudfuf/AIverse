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

  it("consumes direct clicked object interactions without founder proximity", () => {
    const registry = new OfficeInteractiveObjectRegistry([
      createObject("computer-1", { x: 0, y: 0, width: 20, height: 20 }),
    ]);
    const controller = new OfficeInteractionController(registry);

    (controller as unknown as { handlePointerUp: (pointer: { worldX: number; worldY: number; x: number; y: number; downX: number; downY: number }) => void }).handlePointerUp({
      worldX: 10,
      worldY: 10,
      x: 32,
      y: 48,
      downX: 32,
      downY: 48,
    });

    expect(controller.consumeClickedInteraction()).toEqual({
      objectId: "computer-1",
      action: "use_computer",
      status: "placeholder",
      message: "Computer interaction is a placeholder.",
    });
  });

  it("ignores pointer drags when resolving clicked object interactions", () => {
    const registry = new OfficeInteractiveObjectRegistry([
      createObject("computer-1", { x: 0, y: 0, width: 20, height: 20 }),
    ]);
    const controller = new OfficeInteractionController(registry);

    (controller as unknown as { handlePointerUp: (pointer: { worldX: number; worldY: number; x: number; y: number; downX: number; downY: number }) => void }).handlePointerUp({
      worldX: 10,
      worldY: 10,
      x: 80,
      y: 48,
      downX: 32,
      downY: 48,
    });

    expect(controller.consumeClickedInteraction()).toBeUndefined();
  });

  it("does not queue stale object clicks while pointer interaction is disabled", () => {
    const registry = new OfficeInteractiveObjectRegistry([
      createObject("computer-1", { x: 0, y: 0, width: 20, height: 20 }),
    ]);
    const controller = new OfficeInteractionController(registry);

    controller.setPointerInteractionEnabled(false);
    (controller as unknown as { handlePointerUp: (pointer: { worldX: number; worldY: number; x: number; y: number; downX: number; downY: number }) => void }).handlePointerUp({
      worldX: 10,
      worldY: 10,
      x: 32,
      y: 48,
      downX: 32,
      downY: 48,
    });
    controller.setPointerInteractionEnabled(true);

    expect(controller.consumeClickedInteraction()).toBeUndefined();
  });

  it("clears already queued object clicks when pointer interaction is disabled", () => {
    const registry = new OfficeInteractiveObjectRegistry([
      createObject("computer-1", { x: 0, y: 0, width: 20, height: 20 }),
    ]);
    const controller = new OfficeInteractionController(registry);

    (controller as unknown as { handlePointerUp: (pointer: { worldX: number; worldY: number; x: number; y: number; downX: number; downY: number }) => void }).handlePointerUp({
      worldX: 10,
      worldY: 10,
      x: 32,
      y: 48,
      downX: 32,
      downY: 48,
    });
    controller.setPointerInteractionEnabled(false);
    controller.setPointerInteractionEnabled(true);

    expect(controller.consumeClickedInteraction()).toBeUndefined();
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
