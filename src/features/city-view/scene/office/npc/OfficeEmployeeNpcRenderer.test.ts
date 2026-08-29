import { describe, expect, it } from "vitest";

import type { EmployeeNpcViewModel } from "./EmployeeNpcTypes";
import { OfficeEmployeeNpcRenderer } from "./OfficeEmployeeNpcRenderer";

describe("OfficeEmployeeNpcRenderer", () => {
  it("shows a visible work indicator for active workstation task animation", () => {
    const { scene, rectangles, texts, containers } = createSceneStub();
    const renderer = new OfficeEmployeeNpcRenderer(scene);

    renderer.render([createViewModel({
      workAnimation: {
        kind: "workstationTask",
        active: true,
        taskId: "task-active",
        taskTitle: "Build workstation animation",
      },
    })]);

    expect(rectangles).toHaveLength(2);
    expect(containers[0]).toMatchObject({
      x: 136,
      y: 206,
    });
    expect(rectangles[1]).toMatchObject({
      visible: true,
      fillColor: 0x22c55e,
    });
    expect(rectangles[1].fillAlpha).toBeGreaterThan(0);
    expect(texts.map((text) => text.text)).toEqual([
      "Alex",
      "Alex - Working: Build workstation anima...",
    ]);
  });

  it("clears stale work indicators when a view model becomes inactive", () => {
    const { scene, rectangles } = createSceneStub();
    const renderer = new OfficeEmployeeNpcRenderer(scene);

    renderer.render([createViewModel({
      workAnimation: {
        kind: "workstationTask",
        active: true,
        taskId: "task-active",
        taskTitle: "Build workstation animation",
      },
    })]);
    expect(rectangles[1].visible).toBe(true);

    renderer.render([createViewModel({
      state: "assigned",
      displayLabel: "Alex - Assigned",
      currentTaskTitle: "Build workstation animation",
      movementState: "arrived",
      workAnimation: undefined,
    })]);

    expect(rectangles[1]).toMatchObject({
      visible: false,
      fillAlpha: 0,
    });
  });

  it("destroys NPC containers and indicators when employees are removed", () => {
    const { scene, containers } = createSceneStub();
    const renderer = new OfficeEmployeeNpcRenderer(scene);

    renderer.render([createViewModel({
      workAnimation: {
        kind: "workstationTask",
        active: true,
      },
    })]);
    renderer.render([]);

    expect(containers[0].destroyed).toBe(true);
    expect(containers[0].destroyChildren).toBe(true);
  });

  it("places review and operations NPCs on the rendered department anchors", () => {
    const { scene, containers } = createSceneStub();
    const renderer = new OfficeEmployeeNpcRenderer(scene);

    renderer.render([
      createViewModel({ employeeId: "reviewer", positionHint: { zone: "review", slot: 0 } }),
      createViewModel({ employeeId: "operator", positionHint: { zone: "meetingArea", slot: 0 } }),
    ]);

    expect(containers.map((container) => ({ x: container.x, y: container.y }))).toEqual([
      { x: 510, y: 200 },
      { x: 738, y: 470 },
    ]);
  });
});

function createViewModel(overrides: Partial<EmployeeNpcViewModel> = {}): EmployeeNpcViewModel {
  return {
    employeeId: "employee-working",
    displayName: "Alex",
    displayLabel: "Alex - Working",
    state: "working",
    currentTaskTitle: "Build workstation animation",
    positionHint: { zone: "workstation", slot: 0 },
    movementState: "arrived",
    placeholderStyle: {
      fillColor: 0x64748b,
      borderColor: 0xf8fafc,
      labelColor: "#f8fafc",
    },
    ...overrides,
  };
}

function createSceneStub() {
  const rectangles: RectangleStub[] = [];
  const texts: TextStub[] = [];
  const containers: ContainerStub[] = [];

  return {
    scene: {
      time: { now: 240 },
      add: {
        rectangle: (x: number, y: number, width: number, height: number, fillColor: number, fillAlpha: number) => {
          const rectangle = createRectangleStub(x, y, width, height, fillColor, fillAlpha);
          rectangles.push(rectangle);
          return rectangle;
        },
        text: (_x: number, _y: number, text: string) => {
          const textStub = createTextStub(text);
          texts.push(textStub);
          return textStub;
        },
        container: (x: number, y: number, children: unknown[]) => {
          const container = createContainerStub(x, y, children);
          containers.push(container);
          return container;
        },
      },
    } as unknown as ConstructorParameters<typeof OfficeEmployeeNpcRenderer>[0],
    rectangles,
    texts,
    containers,
  };
}

type RectangleStub = ReturnType<typeof createRectangleStub>;
type TextStub = ReturnType<typeof createTextStub>;
type ContainerStub = ReturnType<typeof createContainerStub>;

function createRectangleStub(x: number, y: number, width: number, height: number, fillColor: number, fillAlpha: number) {
  return {
    x,
    y,
    width,
    height,
    fillColor,
    fillAlpha,
    visible: true,
    setFillStyle(nextFillColor: number, nextFillAlpha = 1) {
      this.fillColor = nextFillColor;
      this.fillAlpha = nextFillAlpha;
      return this;
    },
    setStrokeStyle() {
      return this;
    },
    setPosition(nextX: number, nextY: number) {
      this.x = nextX;
      this.y = nextY;
      return this;
    },
    setVisible(nextVisible: boolean) {
      this.visible = nextVisible;
      return this;
    },
  };
}

function createTextStub(text: string) {
  return {
    text,
    x: 0,
    y: 0,
    color: "",
    setOrigin() {
      return this;
    },
    setPosition(nextX: number, nextY: number) {
      this.x = nextX;
      this.y = nextY;
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
  };
}

function createContainerStub(x: number, y: number, children: unknown[]) {
  return {
    x,
    y,
    children,
    depth: 0,
    destroyed: false,
    destroyChildren: false,
    setPosition(nextX: number, nextY: number) {
      this.x = nextX;
      this.y = nextY;
      return this;
    },
    setDepth(nextDepth: number) {
      this.depth = nextDepth;
      return this;
    },
    destroy(destroyChildren?: boolean) {
      this.destroyed = true;
      this.destroyChildren = Boolean(destroyChildren);
    },
  };
}
