import type { PhaserScene } from "../shared/phaserTypes";
import type { LiveAgentProjectStatusDisplay, LiveAgentWorkState } from "./LiveAgentWorkVisualization";
import {
  createRenderedOfficeComposition,
  type RenderedOfficeDepartment,
  type RenderedOfficeFixture,
  type RenderedOfficeSharedSpace,
  type RenderedOfficeWorkstation,
} from "./RenderedOfficeComposition";
import type { OfficeDefinition, OfficeInteractiveObject } from "./officeTypes";

const OFFICE_OVERLAY_DEPTH = 20;
const OFFICE_COMPOSITION_DEPTH = 6;
const EXIT_MARKER_DEPTH = 8;
const INTERACTIVE_OBJECT_DEPTH = 9;

const COLORS = {
  outline: 0x1e293b,
  outerWall: 0x475569,
  innerWall: 0x64748b,
  corridorFloor: 0xb9b7c7,
  engineeringFloor: 0x31445f,
  reviewFloor: 0x25384f,
  validationFloor: 0xcfdce7,
  operationsFloor: 0xc9d7e8,
  loungeFloor: 0xc99663,
  receptionFloor: 0xb9b7c7,
  desk: 0xb87a38,
  darkDesk: 0x7c4f2a,
  chair: 0x1f4f8f,
  monitorFrame: 0x0f172a,
  monitorBlue: 0x38bdf8,
  monitorPurple: 0x8b5cf6,
  board: 0xdbeafe,
  boardInk: 0x2563eb,
  plant: 0x22c55e,
  plantPot: 0x8b5e34,
  glass: 0x7dd3fc,
  sign: 0x111827,
};

export class OfficeVisualLayer {
  private readonly title: Phaser.GameObjects.Text;
  private readonly officeComposition: Phaser.GameObjects.Container;
  private readonly exitMarker: Phaser.GameObjects.Container;
  private readonly projectStatusTexts: Phaser.GameObjects.Text[] = [];
  private interactiveObjectMarkers: Phaser.GameObjects.Container[] = [];

  constructor(
    scene: PhaserScene,
    office: OfficeDefinition,
    interactiveObjects: ReadonlyArray<OfficeInteractiveObject> = [],
  ) {
    const composition = createRenderedOfficeComposition(office);
    this.officeComposition = createOfficeComposition(scene, composition.departments, composition.sharedSpaces, office.companyName);
    this.title = scene.add
      .text(office.worldBounds.width / 2, 18, `${office.companyName} - Autonomous AI Software Company`, {
        backgroundColor: "rgba(17, 24, 39, 0.92)",
        color: "#f8fafc",
        fontFamily: "monospace",
        fontSize: "20px",
        fontStyle: "700",
        padding: { x: 14, y: 7 },
      })
      .setOrigin(0.5, 0)
      .setDepth(OFFICE_OVERLAY_DEPTH);

    this.exitMarker = createExitMarker(scene, office);
    this.projectStatusTexts = createProjectStatusTexts(scene);
    this.refreshInteractiveObjects(scene, interactiveObjects);
  }

  updateLiveAgentWorkState(workState: LiveAgentWorkState | undefined) {
    const display = workState?.projectStatus ?? createEmptyProjectStatusDisplay();
    const lines = [
      display.title.toUpperCase(),
      display.summary,
      ...display.pipeline.map((item) => `${getPipelineMarker(item.state)} ${item.label}`),
      ...display.rows,
    ].slice(0, this.projectStatusTexts.length);
    const color = getStatusTextColor(display.tone);

    this.projectStatusTexts.forEach((text, index) => {
      text
        .setText(lines[index] ?? "")
        .setColor(color);
    });
  }

  refreshInteractiveObjects(scene: PhaserScene, interactiveObjects: ReadonlyArray<OfficeInteractiveObject> = []) {
    this.interactiveObjectMarkers.forEach((marker) => marker.destroy(true));
    this.interactiveObjectMarkers = interactiveObjects
      .filter((object) => object.enabled && (object.type === "computer" || object.type === "desk" || object.type === "workstation"))
      .map((object) => createInteractiveWorkstationMarker(scene, object));
  }

  destroy() {
    this.title.destroy();
    this.officeComposition.destroy(true);
    this.exitMarker.destroy(true);
    this.projectStatusTexts.forEach((text) => text.destroy());
    this.interactiveObjectMarkers.forEach((marker) => marker.destroy(true));
  }
}

function createOfficeComposition(
  scene: PhaserScene,
  departments: RenderedOfficeDepartment[],
  sharedSpaces: RenderedOfficeSharedSpace[],
  companyName: string,
) {
  const container = scene.add.container(0, 0).setDepth(OFFICE_COMPOSITION_DEPTH);
  const graphics = scene.add.graphics();

  drawOuterShell(graphics);
  sharedSpaces.forEach((space) => drawSharedSpace(graphics, space));
  departments.forEach((department) => drawDepartment(graphics, department));
  drawCorridorGlass(graphics);
  drawDecorPlants(graphics);

  const signs = [
    createSign(scene, 220, 104, "ENGINEERING"),
    createSign(scene, 510, 104, "REVIEW"),
    createSign(scene, 774, 104, "VALIDATION / QA"),
    createSign(scene, 762, 318, "PROJECT STATUS"),
    createSign(scene, 220, 404, "LOUNGE"),
    createSign(scene, 478, 492, companyName.toUpperCase()),
  ];

  container.add([graphics, ...signs]);
  return container;
}

function drawOuterShell(graphics: Phaser.GameObjects.Graphics) {
  graphics.fillStyle(COLORS.outerWall, 1);
  graphics.fillRect(28, 40, 904, 532);
  graphics.fillStyle(COLORS.corridorFloor, 1);
  graphics.fillRect(44, 56, 872, 500);

  graphics.fillStyle(0x94a3b8, 0.75);
  for (let x = 76; x <= 860; x += 48) {
    graphics.fillRect(x, 58, 34, 22);
  }
  graphics.fillStyle(COLORS.innerWall, 1);
  graphics.fillRect(386, 56, 12, 318);
  graphics.fillRect(626, 56, 12, 206);
  graphics.fillRect(614, 278, 12, 262);
  graphics.fillRect(44, 366, 344, 12);
  graphics.fillRect(386, 406, 228, 12);
  graphics.fillRect(626, 262, 290, 12);
}

function drawDepartment(graphics: Phaser.GameObjects.Graphics, department: RenderedOfficeDepartment) {
  const floorColor = getDepartmentFloorColor(department.kind);
  drawRoom(graphics, department.bounds, floorColor);
  department.fixtures.forEach((fixture) => drawFixture(graphics, fixture));
  department.workstations.forEach((workstation) => drawWorkstationDetails(graphics, workstation));
}

function drawSharedSpace(graphics: Phaser.GameObjects.Graphics, space: RenderedOfficeSharedSpace) {
  const floorColor = getSharedSpaceFloorColor(space.kind);
  if (space.kind !== "corridor") drawRoom(graphics, space.bounds, floorColor);
  space.fixtures.forEach((fixture) => drawFixture(graphics, fixture));
}

function drawRoom(graphics: Phaser.GameObjects.Graphics, bounds: RenderedOfficeDepartment["bounds"], floorColor: number) {
  graphics.fillStyle(floorColor, 1);
  graphics.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
  graphics.lineStyle(3, COLORS.outline, 0.72);
  graphics.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);

  graphics.lineStyle(1, 0xffffff, 0.08);
  for (let x = bounds.x + 24; x < bounds.x + bounds.width; x += 24) {
    graphics.lineBetween(x, bounds.y, x, bounds.y + bounds.height);
  }
  for (let y = bounds.y + 24; y < bounds.y + bounds.height; y += 24) {
    graphics.lineBetween(bounds.x, y, bounds.x + bounds.width, y);
  }
}

function drawFixture(graphics: Phaser.GameObjects.Graphics, fixture: RenderedOfficeFixture) {
  const { x, y, width, height } = fixture.bounds;

  if (fixture.kind === "monitor") {
    graphics.fillStyle(COLORS.monitorFrame, 1);
    graphics.fillRect(x, y, width, height);
    graphics.fillStyle(fixture.id.endsWith("-2") ? COLORS.monitorPurple : COLORS.monitorBlue, 0.9);
    graphics.fillRect(x + 3, y + 3, Math.max(width - 6, 1), Math.max(height - 7, 1));
    graphics.fillStyle(COLORS.monitorFrame, 1);
    graphics.fillRect(x + width / 2 - 2, y + height, 4, 8);
    return;
  }

  if (fixture.kind === "chair") {
    graphics.fillStyle(COLORS.chair, 1);
    graphics.fillRect(x, y, width, height);
    graphics.lineStyle(2, COLORS.outline, 0.8);
    graphics.strokeRect(x, y, width, height);
    return;
  }

  if (fixture.kind === "board" || fixture.kind === "status-display") {
    graphics.fillStyle(fixture.kind === "status-display" ? 0x123162 : COLORS.board, 1);
    graphics.fillRect(x, y, width, height);
    graphics.lineStyle(2, COLORS.outline, 0.9);
    graphics.strokeRect(x, y, width, height);
    drawBoardMarks(graphics, x, y, width, height, fixture.kind);
    return;
  }

  if (fixture.kind === "shelf" || fixture.kind === "test-rack") {
    graphics.fillStyle(fixture.kind === "test-rack" ? 0x94a3b8 : 0x6b4f37, 1);
    graphics.fillRect(x, y, width, height);
    graphics.lineStyle(2, COLORS.outline, 0.8);
    graphics.strokeRect(x, y, width, height);
    for (let shelfY = y + 14; shelfY < y + height; shelfY += 18) {
      graphics.lineStyle(1, 0xf8fafc, 0.45);
      graphics.lineBetween(x + 4, shelfY, x + width - 4, shelfY);
    }
    return;
  }

  if (fixture.kind === "plant") {
    graphics.fillStyle(COLORS.plantPot, 1);
    graphics.fillRect(x + width * 0.25, y + height * 0.62, width * 0.5, height * 0.3);
    graphics.fillStyle(COLORS.plant, 1);
    graphics.fillRect(x + width * 0.15, y + height * 0.2, width * 0.7, height * 0.48);
    graphics.fillStyle(0x86efac, 0.85);
    graphics.fillRect(x + width * 0.35, y + height * 0.05, width * 0.3, height * 0.42);
    return;
  }

  const deskColor = fixture.kind === "reception-desk" ? COLORS.sign : fixture.kind === "sofa" ? COLORS.chair : COLORS.desk;
  graphics.fillStyle(deskColor, 1);
  graphics.fillRect(x, y, width, height);
  graphics.lineStyle(2, COLORS.outline, 0.86);
  graphics.strokeRect(x, y, width, height);
}

function drawWorkstationDetails(graphics: Phaser.GameObjects.Graphics, workstation: RenderedOfficeWorkstation) {
  graphics.fillStyle(0xf8fafc, 0.9);
  graphics.fillRect(workstation.position.x - 44, workstation.position.y + 8, 12, 8);
  graphics.fillRect(workstation.position.x + 30, workstation.position.y + 8, 10, 10);
  if (workstation.kind === "validation") {
    graphics.fillStyle(0x22c55e, 1);
    graphics.fillRect(workstation.position.x + 42, workstation.position.y - 10, 8, 8);
  }
}

function drawBoardMarks(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  width: number,
  height: number,
  kind: "board" | "status-display",
) {
  const markColor = kind === "status-display" ? 0x22c55e : COLORS.boardInk;
  graphics.fillStyle(markColor, 0.9);
  for (let row = 0; row < 3; row += 1) {
    graphics.fillRect(x + 12, y + 12 + row * 16, Math.max(width - 28 - row * 14, 18), 5);
  }
  if (kind === "status-display") {
    graphics.fillStyle(0x38bdf8, 0.85);
    graphics.fillRect(x + 12, y + height - 18, width - 24, 6);
  }
}

function drawCorridorGlass(graphics: Phaser.GameObjects.Graphics) {
  graphics.fillStyle(COLORS.glass, 0.42);
  graphics.fillRect(392, 222, 222, 14);
  graphics.fillRect(392, 236, 12, 38);
  graphics.fillRect(626, 250, 290, 12);
  graphics.fillRect(392, 514, 194, 24);
  graphics.lineStyle(1, 0xe0f2fe, 0.85);
  graphics.strokeRect(392, 222, 222, 14);
  graphics.strokeRect(392, 514, 194, 24);
}

function drawDecorPlants(graphics: Phaser.GameObjects.Graphics) {
  [
    { x: 64, y: 330 },
    { x: 360, y: 330 },
    { x: 396, y: 252 },
    { x: 602, y: 226 },
    { x: 602, y: 392 },
    { x: 884, y: 236 },
    { x: 884, y: 494 },
    { x: 64, y: 496 },
  ].forEach((plant, index) => {
    drawFixture(graphics, {
      id: `office-plant-${index}`,
      kind: "plant",
      bounds: { x: plant.x, y: plant.y, width: 26, height: 38 },
    });
  });
}

function createSign(scene: PhaserScene, x: number, y: number, label: string) {
  return scene.add
    .text(x, y, label, {
      backgroundColor: "rgba(17, 24, 39, 0.92)",
      color: "#f8fafc",
      fontFamily: "monospace",
      fontSize: "14px",
      fontStyle: "700",
      padding: { x: 8, y: 4 },
    })
    .setOrigin(0.5, 0.5);
}

function createInteractiveWorkstationMarker(scene: PhaserScene, object: OfficeInteractiveObject) {
  const zone = object.interactionZone;
  const centerX = zone.x + zone.width / 2;
  const centerY = zone.y + zone.height / 2;
  const marker = scene.add.container(0, 0).setDepth(INTERACTIVE_OBJECT_DEPTH);
  const graphics = scene.add.graphics();

  graphics.fillStyle(COLORS.desk, 0.95);
  graphics.fillRect(centerX - 50, centerY + 10, 100, 22);
  graphics.lineStyle(2, COLORS.outline, 0.9);
  graphics.strokeRect(centerX - 50, centerY + 10, 100, 22);
  graphics.fillStyle(COLORS.monitorFrame, 1);
  graphics.fillRect(centerX - 28, centerY - 24, 56, 30);
  graphics.fillStyle(COLORS.monitorBlue, 0.95);
  graphics.fillRect(centerX - 23, centerY - 19, 46, 20);
  graphics.fillStyle(0xfacc15, 0.92);
  graphics.fillRect(centerX + 38, centerY - 2, 8, 8);

  marker.add([graphics]);
  return marker;
}

function createExitMarker(scene: PhaserScene, office: OfficeDefinition) {
  const zone = office.exitZone;
  const centerX = zone.x + zone.width / 2;
  const signY = zone.y + zone.height - 28;

  const marker = scene.add.container(0, 0).setDepth(EXIT_MARKER_DEPTH);
  const graphics = scene.add.graphics();

  graphics.fillStyle(0x0f766e, 1);
  graphics.fillRect(zone.x + 16, signY, zone.width - 32, 28);
  graphics.lineStyle(2, 0x67e8f9, 1);
  graphics.strokeRect(zone.x + 16, signY, zone.width - 32, 28);

  const label = scene.add
    .text(centerX, signY + 14, "EXIT", {
      color: "#ecfeff",
      fontFamily: "monospace",
      fontSize: "14px",
      fontStyle: "700",
    })
    .setOrigin(0.5, 0.5);

  marker.add([graphics, label]);
  return marker;
}

function createProjectStatusTexts(scene: PhaserScene) {
  return Array.from({ length: 10 }, (_, index) => scene.add
    .text(664, 326 + index * 15, "", {
      color: "#e0f2fe",
      fontFamily: "monospace",
      fontSize: index === 0 ? "10px" : "9px",
      fontStyle: index === 0 ? "700" : "400",
    })
    .setDepth(OFFICE_OVERLAY_DEPTH - 1));
}

function createEmptyProjectStatusDisplay(): LiveAgentProjectStatusDisplay {
  return {
    title: "Project Status",
    summary: "Idle",
    tone: "idle",
    rows: ["Run No active ADOS run"],
    pipeline: [
      { id: "implementation", label: "Implementation", state: "idle" },
      { id: "validation", label: "Validation", state: "idle" },
      { id: "review", label: "Review", state: "idle" },
      { id: "publication", label: "Publication", state: "idle" },
    ],
  };
}

function getPipelineMarker(state: LiveAgentProjectStatusDisplay["pipeline"][number]["state"]) {
  if (state === "current") return ">";
  if (state === "complete") return "x";
  if (state === "blocked") return "!";
  return "-";
}

function getStatusTextColor(tone: LiveAgentProjectStatusDisplay["tone"]) {
  if (tone === "warning") return "#fecaca";
  if (tone === "complete") return "#bae6fd";
  if (tone === "active") return "#bbf7d0";
  return "#e0f2fe";
}

function getDepartmentFloorColor(kind: RenderedOfficeDepartment["kind"]) {
  if (kind === "engineering") return COLORS.engineeringFloor;
  if (kind === "review") return COLORS.reviewFloor;
  if (kind === "validation-qa") return COLORS.validationFloor;
  return COLORS.operationsFloor;
}

function getSharedSpaceFloorColor(kind: RenderedOfficeSharedSpace["kind"]) {
  if (kind === "lounge") return COLORS.loungeFloor;
  if (kind === "reception") return COLORS.receptionFloor;
  return COLORS.corridorFloor;
}
