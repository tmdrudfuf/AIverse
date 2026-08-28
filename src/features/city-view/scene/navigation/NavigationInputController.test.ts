import { describe, expect, it } from "vitest";

import type { PhaserScene } from "../shared/phaserTypes";
import { NavigationInputController } from "./NavigationInputController";
import { createNavigationState } from "./NavigationState";

type SceneStub = PhaserScene & {
  emit: (event: string, ...args: unknown[]) => void;
};

describe("NavigationInputController", () => {
  it("collects mouse pan and wheel zoom intent without requiring keyboard input", () => {
    const scene = createSceneStub();
    const state = createNavigationState({ x: 0, y: 0, width: 1000, height: 800 }, 1);
    const controller = new NavigationInputController();

    controller.setup(scene, state);
    scene.emit("pointerdown", { x: 100, y: 100, leftButtonDown: () => true });
    scene.emit("pointermove", { x: 64, y: 76, isDown: true, leftButtonDown: () => true });
    scene.emit("wheel", {}, [], 0, -1);

    const intent = controller.getIntent();

    expect(intent).toMatchObject({
      directionX: 0,
      directionY: 0,
      panDeltaX: 36,
      panDeltaY: 24,
      zoomDelta: 0.18,
      isMoving: false,
      isPanning: true,
      source: "mixed",
    });
  });

  it("clears pending pointer pan when pointer navigation is disabled", () => {
    const scene = createSceneStub();
    const state = createNavigationState({ x: 0, y: 0, width: 1000, height: 800 }, 1);
    const controller = new NavigationInputController();

    controller.setup(scene, state);
    scene.emit("pointerdown", { x: 100, y: 100, leftButtonDown: () => true });
    scene.emit("pointermove", { x: 64, y: 76, isDown: true, leftButtonDown: () => true });
    controller.setPointerNavigationEnabled(false);

    expect(controller.getIntent().isPanning).toBe(false);
  });
});

function createSceneStub(): SceneStub {
  const handlers = new Map<string, Array<(...args: unknown[]) => void>>();
  return {
    input: {
      keyboard: undefined,
      on: (event: string, handler: (...args: unknown[]) => void) => {
        handlers.set(event, [...(handlers.get(event) ?? []), handler]);
      },
      off: (event: string, handler: (...args: unknown[]) => void) => {
        handlers.set(
          event,
          (handlers.get(event) ?? []).filter((item) => item !== handler),
        );
      },
    },
    emit: (event: string, ...args: unknown[]) => {
      for (const handler of handlers.get(event) ?? []) handler(...args);
    },
  } as unknown as SceneStub;
}
