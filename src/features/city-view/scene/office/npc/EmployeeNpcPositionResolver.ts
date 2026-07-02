import type { EmployeeNpcPositionHint } from "./EmployeeNpcTypes";

const ZONE_ANCHORS: Record<EmployeeNpcPositionHint["zone"], { x: number; y: number }> = {
  desk: { x: 248, y: 182 },
  collaboration: { x: 328, y: 202 },
  review: { x: 288, y: 146 },
  idle: { x: 210, y: 232 },
  entrance: { x: 160, y: 270 },
  workstation: { x: 248, y: 182 },
  meetingArea: { x: 328, y: 202 },
  breakArea: { x: 288, y: 146 },
  idleSpot: { x: 210, y: 232 },
};

const SLOT_OFFSETS = [
  { x: 0, y: 0 },
  { x: 44, y: 0 },
  { x: 0, y: 54 },
  { x: 44, y: 54 },
  { x: 88, y: 0 },
  { x: 88, y: 54 },
];

export function resolveEmployeeNpcWorldPosition(positionHint: EmployeeNpcPositionHint) {
  const anchor = ZONE_ANCHORS[positionHint.zone];
  const offset = SLOT_OFFSETS[positionHint.slot % SLOT_OFFSETS.length] ?? SLOT_OFFSETS[0];
  return {
    x: anchor.x + offset.x,
    y: anchor.y + offset.y,
  };
}
