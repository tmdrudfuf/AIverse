import { describe, expect, it } from "vitest";

import { EmployeeConversationBubbleOverlay } from "./EmployeeConversationBubbleOverlay";
import type { EmployeeConversationViewModel } from "./EmployeeConversationTypes";

describe("EmployeeConversationBubbleOverlay", () => {
  it("shows speaker and dialogue near the employee position", () => {
    const { scene, rectangles, texts } = createSceneStub();
    const overlay = new EmployeeConversationBubbleOverlay(scene);

    overlay.show(createViewModel(), 1000);

    expect(rectangles[0]).toMatchObject({
      visible: true,
      x: 248,
      y: 104,
    });
    expect(texts.map((text) => text.text)).toEqual([
      "Alex",
      "I'm working on Build talk bubbles.",
    ]);
    expect(texts.every((text) => text.visible)).toBe(true);
  });

  it("auto-hides after the view model display duration", () => {
    const { scene, rectangles, texts } = createSceneStub();
    const overlay = new EmployeeConversationBubbleOverlay(scene);

    overlay.show(createViewModel({ displayDurationMs: 500 }), 1000);
    overlay.update(1499);

    expect(rectangles[0].visible).toBe(true);

    overlay.update(1500);

    expect(rectangles[0].visible).toBe(false);
    expect(texts.every((text) => !text.visible)).toBe(true);
  });

  it("replaces current bubble content and restarts duration", () => {
    const { scene, rectangles, texts } = createSceneStub();
    const overlay = new EmployeeConversationBubbleOverlay(scene);

    overlay.show(createViewModel({ speakerName: "Alex", dialogueText: "First line.", displayDurationMs: 500 }), 1000);
    overlay.show(createViewModel({ speakerName: "Iris", dialogueText: "Second line.", displayDurationMs: 500 }), 1400);
    overlay.update(1899);

    expect(rectangles[0].visible).toBe(true);
    expect(texts.map((text) => text.text)).toEqual(["Iris", "Second line."]);

    overlay.update(1900);

    expect(rectangles[0].visible).toBe(false);
  });

  it("destroys all display objects", () => {
    const { scene, rectangles, texts } = createSceneStub();
    const overlay = new EmployeeConversationBubbleOverlay(scene);

    overlay.destroy();

    expect(rectangles[0].destroyed).toBe(true);
    expect(texts.every((text) => text.destroyed)).toBe(true);
  });
});

function createViewModel(overrides: Partial<EmployeeConversationViewModel> = {}): EmployeeConversationViewModel {
  return {
    employeeId: "employee-working",
    speakerName: "Alex",
    dialogueText: "I'm working on Build talk bubbles.",
    dialogueType: "working",
    displayDurationMs: 3200,
    positionHint: { zone: "workstation", slot: 0 },
    ...overrides,
  };
}

function createSceneStub() {
  const rectangles: RectangleStub[] = [];
  const texts: TextStub[] = [];

  return {
    scene: {
      add: {
        rectangle: (x: number, y: number, width: number, height: number, fillColor: number, fillAlpha: number) => {
          const rectangle = createRectangleStub(x, y, width, height, fillColor, fillAlpha);
          rectangles.push(rectangle);
          return rectangle;
        },
        text: (x: number, y: number, text: string) => {
          const textStub = createTextStub(x, y, text);
          texts.push(textStub);
          return textStub;
        },
      },
    } as unknown as ConstructorParameters<typeof EmployeeConversationBubbleOverlay>[0],
    rectangles,
    texts,
  };
}

type RectangleStub = ReturnType<typeof createRectangleStub>;
type TextStub = ReturnType<typeof createTextStub>;

function createRectangleStub(x: number, y: number, width: number, height: number, fillColor: number, fillAlpha: number) {
  return {
    x,
    y,
    width,
    height,
    fillColor,
    fillAlpha,
    visible: true,
    depth: 0,
    destroyed: false,
    setOrigin() {
      return this;
    },
    setStrokeStyle() {
      return this;
    },
    setDepth(nextDepth: number) {
      this.depth = nextDepth;
      return this;
    },
    setVisible(nextVisible: boolean) {
      this.visible = nextVisible;
      return this;
    },
    setPosition(nextX: number, nextY: number) {
      this.x = nextX;
      this.y = nextY;
      return this;
    },
    destroy() {
      this.destroyed = true;
    },
  };
}

function createTextStub(x: number, y: number, text: string) {
  return {
    x,
    y,
    text,
    visible: true,
    depth: 0,
    destroyed: false,
    setOrigin() {
      return this;
    },
    setDepth(nextDepth: number) {
      this.depth = nextDepth;
      return this;
    },
    setVisible(nextVisible: boolean) {
      this.visible = nextVisible;
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
    destroy() {
      this.destroyed = true;
    },
  };
}
