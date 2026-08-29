import type { Rect } from "../buildings/buildingTypes";
import type { Point } from "../shared/geometry";
import type { OfficeDefinition } from "./officeTypes";

export type RenderedOfficeDepartmentKind = "engineering" | "review" | "validation-qa" | "project-status-operations";
export type RenderedOfficeSharedSpaceKind = "reception" | "central-shared" | "lounge" | "corridor";
export type RenderedOfficeFixtureKind =
  | "developer-desk"
  | "reviewer-desk"
  | "qa-desk"
  | "operations-desk"
  | "monitor"
  | "chair"
  | "board"
  | "shelf"
  | "test-rack"
  | "status-display"
  | "planning-table"
  | "sofa"
  | "plant"
  | "reception-desk";

export type RenderedOfficeWorkstation = {
  id: string;
  kind: "engineering" | "review" | "validation" | "operations";
  position: Point;
  monitorCount: number;
};

export type RenderedOfficeFixture = {
  id: string;
  kind: RenderedOfficeFixtureKind;
  bounds: Rect;
};

export type RenderedOfficeDepartment = {
  kind: RenderedOfficeDepartmentKind;
  label: string;
  bounds: Rect;
  workstations: RenderedOfficeWorkstation[];
  fixtures: RenderedOfficeFixture[];
};

export type RenderedOfficeSharedSpace = {
  kind: RenderedOfficeSharedSpaceKind;
  label: string;
  bounds: Rect;
  fixtures: RenderedOfficeFixture[];
};

export type RenderedOfficeWorkplaceAnchor = {
  id: string;
  zone: "desk" | "collaboration" | "review" | "idle" | "entrance" | "workstation" | "meetingArea" | "breakArea" | "idleSpot";
  slot: number;
  position: Point;
};

export type RenderedOfficeComposition = {
  companyName: string;
  bounds: Rect;
  departments: RenderedOfficeDepartment[];
  sharedSpaces: RenderedOfficeSharedSpace[];
  workplaceAnchors: RenderedOfficeWorkplaceAnchor[];
  density: {
    departments: number;
    workstations: number;
    monitors: number;
    fixtures: number;
  };
};

const OFFICE_BOUNDS: Rect = { x: 36, y: 48, width: 888, height: 516 };

const ENGINEERING_WORKSTATIONS: RenderedOfficeWorkstation[] = [
  workstation("engineering-workstation-1", "engineering", 136, 170, 3),
  workstation("engineering-workstation-2", "engineering", 282, 170, 3),
  workstation("engineering-workstation-3", "engineering", 136, 292, 4),
  workstation("engineering-workstation-4", "engineering", 282, 292, 4),
];

const REVIEW_WORKSTATIONS: RenderedOfficeWorkstation[] = [
  workstation("review-workstation", "review", 510, 160, 3),
];

const VALIDATION_WORKSTATIONS: RenderedOfficeWorkstation[] = [
  workstation("validation-workstation-1", "validation", 742, 168, 2),
  workstation("validation-workstation-2", "validation", 846, 168, 2),
];

const OPERATIONS_WORKSTATIONS: RenderedOfficeWorkstation[] = [
  workstation("operations-workstation", "operations", 738, 438, 2),
];

export const RENDERED_OFFICE_WORKPLACE_ANCHORS: RenderedOfficeWorkplaceAnchor[] = [
  anchor("engineering-workstation-1", "workstation", 0, 136, 206),
  anchor("engineering-workstation-2", "workstation", 1, 282, 206),
  anchor("engineering-workstation-3", "workstation", 2, 136, 328),
  anchor("engineering-workstation-4", "workstation", 3, 282, 328),
  anchor("review-workstation", "review", 0, 510, 200),
  anchor("validation-workstation-1", "workstation", 4, 742, 208),
  anchor("validation-workstation-2", "workstation", 5, 846, 208),
  anchor("operations-workstation", "meetingArea", 0, 738, 470),
  anchor("central-collaboration", "collaboration", 0, 486, 350),
  anchor("lounge-seat-1", "breakArea", 0, 205, 462),
  anchor("lounge-seat-2", "breakArea", 1, 282, 462),
  anchor("idle-lounge", "idle", 0, 268, 500),
  anchor("idle-shared", "idleSpot", 0, 470, 390),
  anchor("entrance-reception", "entrance", 0, 480, 512),
  anchor("legacy-desk-anchor", "desk", 0, 136, 206),
];

export function createRenderedOfficeComposition(office: Pick<OfficeDefinition, "companyName" | "worldBounds">): RenderedOfficeComposition {
  const departments: RenderedOfficeDepartment[] = [
    {
      kind: "engineering",
      label: "Engineering",
      bounds: { x: 58, y: 82, width: 320, height: 276 },
      workstations: ENGINEERING_WORKSTATIONS,
      fixtures: [
        ...createDeskFixtures(ENGINEERING_WORKSTATIONS, "developer-desk"),
        fixture("engineering-whiteboard", "board", 224, 104, 112, 54),
        fixture("engineering-shelf-left", "shelf", 78, 112, 34, 128),
        fixture("engineering-shelf-right", "shelf", 338, 172, 26, 132),
      ],
    },
    {
      kind: "review",
      label: "Review",
      bounds: { x: 406, y: 82, width: 210, height: 168 },
      workstations: REVIEW_WORKSTATIONS,
      fixtures: [
        ...createDeskFixtures(REVIEW_WORKSTATIONS, "reviewer-desk"),
        fixture("review-board", "board", 436, 104, 150, 34),
        fixture("review-side-shelf", "shelf", 586, 146, 20, 70),
      ],
    },
    {
      kind: "validation-qa",
      label: "Validation / QA",
      bounds: { x: 648, y: 82, width: 252, height: 168 },
      workstations: VALIDATION_WORKSTATIONS,
      fixtures: [
        ...createDeskFixtures(VALIDATION_WORKSTATIONS, "qa-desk"),
        fixture("validation-status-board", "board", 788, 104, 92, 76),
        fixture("validation-test-rack-1", "test-rack", 668, 112, 34, 88),
        fixture("validation-test-rack-2", "test-rack", 884, 132, 12, 78),
      ],
    },
    {
      kind: "project-status-operations",
      label: "Project Status",
      bounds: { x: 626, y: 292, width: 274, height: 222 },
      workstations: OPERATIONS_WORKSTATIONS,
      fixtures: [
        fixture("operations-status-display", "status-display", 652, 318, 220, 72),
        fixture("operations-pipeline-board", "board", 782, 404, 94, 78),
        fixture("operations-planning-table", "planning-table", 660, 420, 104, 56),
        ...createDeskFixtures(OPERATIONS_WORKSTATIONS, "operations-desk"),
      ],
    },
  ];

  const sharedSpaces: RenderedOfficeSharedSpace[] = [
    {
      kind: "central-shared",
      label: "Shared Space",
      bounds: { x: 406, y: 276, width: 188, height: 126 },
      fixtures: [
        fixture("central-sofa-north", "sofa", 450, 292, 102, 28),
        fixture("central-sofa-west", "sofa", 422, 326, 32, 58),
        fixture("central-table", "planning-table", 478, 334, 54, 34),
        fixture("central-plant", "plant", 532, 336, 24, 36),
      ],
    },
    {
      kind: "lounge",
      label: "Lounge",
      bounds: { x: 58, y: 384, width: 318, height: 130 },
      fixtures: [
        fixture("lounge-coffee-bar", "planning-table", 82, 408, 112, 34),
        fixture("lounge-round-table-1", "planning-table", 218, 434, 54, 54),
        fixture("lounge-round-table-2", "planning-table", 292, 434, 54, 54),
        fixture("lounge-plant", "plant", 350, 396, 24, 40),
        fixture("lounge-sofa", "sofa", 92, 456, 76, 26),
      ],
    },
    {
      kind: "reception",
      label: office.companyName,
      bounds: { x: 356, y: 420, width: 236, height: 94 },
      fixtures: [
        fixture("reception-desk", "reception-desk", 388, 458, 172, 32),
        fixture("reception-monitor", "monitor", 458, 438, 44, 28),
        fixture("reception-plant", "plant", 562, 432, 24, 42),
      ],
    },
    {
      kind: "corridor",
      label: "Corridor",
      bounds: { x: 392, y: 258, width: 218, height: 148 },
      fixtures: [
        fixture("corridor-plant-1", "plant", 394, 244, 22, 36),
        fixture("corridor-plant-2", "plant", 596, 252, 22, 36),
        fixture("corridor-plant-3", "plant", 598, 390, 22, 36),
      ],
    },
  ];

  const compositionBounds = {
    x: office.worldBounds.x + OFFICE_BOUNDS.x,
    y: office.worldBounds.y + OFFICE_BOUNDS.y,
    width: OFFICE_BOUNDS.width,
    height: OFFICE_BOUNDS.height,
  };
  const fixtureCount = [...departments, ...sharedSpaces].reduce((count, area) => count + area.fixtures.length, 0);
  const workstations = departments.flatMap((department) => department.workstations);

  return {
    companyName: office.companyName,
    bounds: compositionBounds,
    departments,
    sharedSpaces,
    workplaceAnchors: RENDERED_OFFICE_WORKPLACE_ANCHORS.map((item) => ({ ...item, position: { ...item.position } })),
    density: {
      departments: departments.length,
      workstations: workstations.length,
      monitors: workstations.reduce((count, item) => count + item.monitorCount, 0),
      fixtures: fixtureCount,
    },
  };
}

export function getRenderedOfficeWorkplacePosition(zone: RenderedOfficeWorkplaceAnchor["zone"], slot: number): Point {
  const exactAnchor = RENDERED_OFFICE_WORKPLACE_ANCHORS.find((item) => item.zone === zone && item.slot === slot);
  if (exactAnchor) return { ...exactAnchor.position };

  const zoneAnchors = RENDERED_OFFICE_WORKPLACE_ANCHORS.filter((item) => item.zone === zone);
  const fallbackAnchor = zoneAnchors[slot % zoneAnchors.length] ?? RENDERED_OFFICE_WORKPLACE_ANCHORS[0];
  return { ...fallbackAnchor.position };
}

function workstation(id: string, kind: RenderedOfficeWorkstation["kind"], x: number, y: number, monitorCount: number): RenderedOfficeWorkstation {
  return { id, kind, position: { x, y }, monitorCount };
}

function anchor(id: string, zone: RenderedOfficeWorkplaceAnchor["zone"], slot: number, x: number, y: number): RenderedOfficeWorkplaceAnchor {
  return { id, zone, slot, position: { x, y } };
}

function createDeskFixtures(workstations: RenderedOfficeWorkstation[], deskKind: Extract<RenderedOfficeFixtureKind, "developer-desk" | "reviewer-desk" | "qa-desk" | "operations-desk">): RenderedOfficeFixture[] {
  return workstations.flatMap((item) => [
    fixture(`${item.id}-desk`, deskKind, item.position.x - 54, item.position.y, 108, 34),
    fixture(`${item.id}-chair`, "chair", item.position.x - 14, item.position.y + 42, 28, 26),
    ...Array.from({ length: item.monitorCount }, (_, index) =>
      fixture(`${item.id}-monitor-${index + 1}`, "monitor", item.position.x - 38 + index * 28, item.position.y - 24, 24, 20),
    ),
  ]);
}

function fixture(id: string, kind: RenderedOfficeFixtureKind, x: number, y: number, width: number, height: number): RenderedOfficeFixture {
  return {
    id,
    kind,
    bounds: { x, y, width, height },
  };
}
