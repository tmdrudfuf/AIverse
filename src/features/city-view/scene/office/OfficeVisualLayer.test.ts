import { describe, expect, it } from "vitest";

import { OfficeVisualLayer } from "./OfficeVisualLayer";
import type { OfficeDefinition, OfficeInteractiveObject } from "./officeTypes";

describe("OfficeVisualLayer", () => {
  it("renders a physical office composition and refreshes interactive workstation markers", () => {
    const { scene, containers, texts, graphics } = createSceneStub();
    const layer = new OfficeVisualLayer(scene, createOffice(), [
      createObject("computer-1", { x: 0, y: 0, width: 80, height: 60 }),
      createObject("desk-1", { x: 120, y: 0, width: 80, height: 60 }, { type: "desk", action: "inspect" }),
    ]);

    expect(containers).toHaveLength(4);
    expect(texts.map((text) => text.text)).toEqual(
      expect.arrayContaining([
        "Daily Proof - Autonomous AI Software Company",
        "ENGINEERING",
        "REVIEW",
        "VALIDATION / QA",
        "PROJECT STATUS",
        "DAILY PROOF",
        "EXIT",
      ]),
    );
    expect(graphics.some((item) => item.fillRects.length > 80)).toBe(true);

    layer.refreshInteractiveObjects(scene, [
      createObject("computer-2", { x: 200, y: 0, width: 80, height: 60 }),
      createObject("disabled-computer", { x: 300, y: 0, width: 80, height: 60 }, { enabled: false }),
    ]);

    expect(containers[0].destroyedWithChildren).toBe(false);
    expect(containers[1].destroyedWithChildren).toBe(false);
    expect(containers[2].destroyedWithChildren).toBe(true);
    expect(containers[3].destroyedWithChildren).toBe(true);
    expect(containers).toHaveLength(5);

    layer.destroy();

    expect(containers.every((container) => container.destroyedWithChildren)).toBe(true);
  });

  it("renders dynamic company signage without relying on Daily Proof text", () => {
    const { scene, texts } = createSceneStub();
    const office = createOffice();
    office.companyName = "Northstar Tools";

    const layer = new OfficeVisualLayer(scene, office);

    expect(texts.map((text) => text.text)).toEqual(expect.arrayContaining([
      "Northstar Tools - Autonomous AI Software Company",
      "NORTHSTAR TOOLS",
    ]));
    expect(texts.map((text) => text.text)).not.toContain("DAILY PROOF");
    layer.destroy();
  });

  it("renders normally when legacy metadata is absent", () => {
    const { scene, containers } = createSceneStub();
    const office = createOffice();
    delete office.interiorFoundation;
    delete office.visualEnvironment;

    const layer = new OfficeVisualLayer(scene, office, [
      createObject("computer-1", { x: 0, y: 0, width: 80, height: 60 }),
    ]);

    expect(containers).toHaveLength(3);

    layer.destroy();

    expect(containers.every((container) => container.destroyedWithChildren)).toBe(true);
  });

  it("renders selected-project live ADOS state into the Project Status area", () => {
    const { scene, texts } = createSceneStub();
    const layer = new OfficeVisualLayer(scene, createOffice());

    layer.updateLiveAgentWorkState({
      projectId: "external-crm",
      projectName: "External CRM",
      lifecycle: "active",
      stage: "publication",
      stageLabel: "Publishing",
      rawStatus: "publication_gate",
      featureBranch: "codex/136-live-agent-work-visualization",
      specPath: "specs/136-live-agent-work-visualization/spec.md",
      updatedAt: "2026-08-29T00:00:00.000Z",
      assignments: [],
      projectStatus: {
        title: "External CRM",
        summary: "Publishing - publication_gate",
        tone: "active",
        rows: [
          "Spec 136-live-agent-work-visualization",
          "Branch codex/136-live-agent-work-visualization",
          "Run publication_gate",
        ],
        pipeline: [
          { id: "implementation", label: "Implementation", state: "complete" },
          { id: "validation", label: "Validation", state: "complete" },
          { id: "review", label: "Review", state: "complete" },
          { id: "publication", label: "Publication", state: "current" },
        ],
      },
    });

    expect(texts.map((text) => text.text)).toEqual(expect.arrayContaining([
      "EXTERNAL CRM",
      "Publishing - publication_gate",
      "> Publication",
      "Run publication_gate",
    ]));
    expect(texts.find((text) => text.text === "EXTERNAL CRM")?.color).toBe("#bbf7d0");

    layer.destroy();
  });
});

function createSceneStub() {
  const containers: ContainerStub[] = [];
  const texts: TextStub[] = [];
  const graphics: GraphicsStub[] = [];

  return {
    scene: {
      add: {
        text: (_x: number, _y: number, text: string) => {
          const textStub = createTextStub(text);
          texts.push(textStub);
          return textStub;
        },
        graphics: () => {
          const graphicsStub = createGraphicsStub();
          graphics.push(graphicsStub);
          return graphicsStub;
        },
        container: () => {
          const container = createContainerStub();
          containers.push(container);
          return container;
        },
      },
    } as unknown as ConstructorParameters<typeof OfficeVisualLayer>[0],
    containers,
    texts,
    graphics,
  };
}

type ContainerStub = ReturnType<typeof createContainerStub>;
type TextStub = ReturnType<typeof createTextStub>;
type GraphicsStub = ReturnType<typeof createGraphicsStub>;

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

function createTextStub(text: string) {
  return {
    text,
    color: "",
    style: {
      backgroundColor: "",
      setBackgroundColor(nextBackgroundColor: string) {
        this.backgroundColor = nextBackgroundColor;
        return this;
      },
    },
    setOrigin() {
      return this;
    },
    setDepth() {
      return this;
    },
    setText(nextText: string) {
      this.text = nextText;
      return this;
    },
    setColor(nextColor: string) {
      this.color = nextColor;
      return this;
    },
    destroy() {
      return undefined;
    },
  };
}

function createGraphicsStub() {
  return {
    fillRects: [] as Array<{ x: number; y: number; width: number; height: number }>,
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
    fillRect(x: number, y: number, width: number, height: number) {
      this.fillRects.push({ x, y, width, height });
      return this;
    },
    strokeRect() {
      return this;
    },
    lineBetween() {
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
    interiorFoundation: {
      zones: [
        {
          id: "reception",
          label: "Reception",
          role: "reception",
          bounds: { x: 100, y: 80, width: 120, height: 40 },
          accentColor: 0x5f7f8d,
          enabled: true,
        },
        {
          id: "workspace",
          label: "Workspace",
          role: "workspace",
          bounds: { x: 300, y: 160, width: 120, height: 40 },
          accentColor: 0x9de2e4,
          enabled: true,
        },
      ],
    },
    visualEnvironment: {
      details: [
        {
          id: "proof-wall",
          kind: "brand-sign",
          label: "Proof Wall",
          bounds: { x: 100, y: 130, width: 120, height: 24 },
          accentColor: 0x253247,
          enabled: true,
        },
        {
          id: "plant",
          kind: "plant",
          label: "Plant",
          bounds: { x: 300, y: 210, width: 48, height: 48 },
          accentColor: 0x4f9f67,
          enabled: true,
        },
      ],
    },
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
