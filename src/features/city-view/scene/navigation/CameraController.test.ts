import { describe, expect, it } from "vitest";

import { CameraController } from "./CameraController";
import { createNavigationState } from "./NavigationState";

describe("CameraController", () => {
  it("pans the camera from pointer drag intent without requiring a Founder target", () => {
    const scene = createSceneStub();
    const state = createNavigationState({ x: 0, y: 0, width: 1000, height: 800 }, 1);
    const controller = new CameraController(scene, state);
    controller.setBounds(state.bounds);
    controller.focusWorldPoint({ x: 120, y: 120 }, { targetId: "founder" });

    controller.update(16, {
      directionX: 0,
      directionY: 0,
      panDeltaX: 80,
      panDeltaY: 40,
      zoomDelta: 0,
      isMoving: false,
      isPanning: true,
      source: "pointer",
    });

    expect(scene.cameras.main.scrollX).toBe(80);
    expect(scene.cameras.main.scrollY).toBe(40);
    expect(state.activeCameraTarget).toBeUndefined();
  });
});

function createSceneStub() {
  const camera = {
    width: 400,
    height: 300,
    zoom: 1,
    scrollX: 0,
    scrollY: 0,
    setBounds: () => camera,
    setZoom: (zoom: number) => {
      camera.zoom = zoom;
      return camera;
    },
    setScroll: (x: number, y: number) => {
      camera.scrollX = x;
      camera.scrollY = y;
      return camera;
    },
  };
  return {
    cameras: {
      main: camera,
    },
  } as unknown as ConstructorParameters<typeof CameraController>[0];
}
