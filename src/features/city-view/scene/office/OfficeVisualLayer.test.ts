import { describe, expect, it } from "vitest";

import { OfficeVisualLayer } from "./OfficeVisualLayer";
import type { OfficeDefinition, OfficeInteractiveObject } from "./officeTypes";

describe("OfficeVisualLayer", () => {
  it("refreshes interactive markers from the current enabled computer objects", () => {
    const { scene, containers } = createSceneStub();
    const layer = new OfficeVisualLayer(scene, createOffice(), [
      createObject("computer-1", { x: 0, y: 0, width: 80, height: 60 }),
      createObject("desk-1", { x: 120, y: 0, width: 80, height: 60 }, { type: "desk", action: "inspect" }),
    ]);

    expect(containers).toHaveLength(2);

    layer.refreshInteractiveObjects(scene, [
      createObject("computer-2", { x: 200, y: 0, width: 80, height: 60 }),
      createObject("disabled-computer", { x: 300, y: 0, width: 80, height: 60 }, { enabled: false }),
    ]);

    expect(containers[1].destroyedWithChildren).toBe(true);
    expect(containers).toHaveLength(3);

    layer.destroy();

    expect(containers.every((container) => container.destroyedWithChildren)).toBe(true);
  });
});

function createSceneStub() {
  const containers: ContainerStub[] = [];

  return {
    scene: {
      add: {
        text: () => createTextStub(),
        graphics: () => createGraphicsStub(),
        container: () => {
          const container = createContainerStub();
          containers.push(container);
          return container;
        },
      },
    } as unknown as ConstructorParameters<typeof OfficeVisualLayer>[0],
    containers,
  };
}

type ContainerStub = ReturnType<typeof createContainerStub>;

function createContainerStub() {
  return {
    destroyedWithChildren: false,
    setDepth() {
      return this;
    },
    add() {
      return this;
    },
    destroy(destroyChildren?: boolean) {
      this.destroyedWithChildren = destroyChildren === true;
    },
  };
}

function createTextStub() {
  return {
    setOrigin() {
      return this;
    },
    setDepth() {
      return this;
    },
    destroy() {
      return undefined;
    },
  };
}

function createGraphicsStub() {
  return {
    fillStyle() {
      return this;
    },
    fillRoundedRect() {
      return this;
    },
    lineStyle() {
      return this;
    },
    strokeRoundedRect() {
      return this;
    },
    fillRect() {
      return this;
    },
  };
}

function createOffice(): OfficeDefinition {
  return {
    sceneKey: "office-daily-proof",
    buildingId: "daily-proof",
    companyName: "Daily Proof",
    worldBounds: { x: 0, y: 0, width: 960, height: 640 },
    walkableBounds: { x: 0, y: 0, width: 960, height: 640 },
    founderSpawn: { x: 10, y: 10 },
    exitZone: { x: 20, y: 20, width: 80, height: 40 },
    tilemap: {
      mapKey: "office-map",
      mapUrl: "/office.json",
      tilesets: [],
      layers: {
        floor: "floor",
        wall: "wall",
        decoration: "decoration",
        collision: "collision",
        objects: "objects",
        interaction: "interaction",
      },
    },
  };
}

function createObject(
  id: string,
  interactionZone: OfficeInteractiveObject["interactionZone"],
  overrides: Partial<OfficeInteractiveObject> = {},
): OfficeInteractiveObject {
  return {
    id,
    type: "computer",
    displayName: "Computer",
    interactionZone,
    enabled: true,
    action: "use_computer",
    markerId: id,
    ...overrides,
  };
}
