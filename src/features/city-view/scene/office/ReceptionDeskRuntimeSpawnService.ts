import type { OfficeDefinition, OfficeInteractiveObject } from "./officeTypes";
import type { OfficeLayoutSnapshot, OfficeLayoutZone } from "./layout/OfficeLayoutTypes";
import type { CompanyProgressionSnapshot } from "./progression/CompanyProgressionTypes";

const RECEPTION_DESK_WIDTH = 128;
const RECEPTION_DESK_HEIGHT = 72;

export class ReceptionDeskRuntimeSpawnService {
  createReceptionDeskInteractable(input: { office: OfficeDefinition; progression: CompanyProgressionSnapshot; layout: OfficeLayoutSnapshot }): OfficeInteractiveObject | undefined {
    if (input.progression.companyLevel < 2 || !input.progression.unlockedOfficeZones.includes("reception")) {
      return undefined;
    }

    const receptionZone = input.layout.zones.find((zone) => zone.type === "reception");
    if (!receptionZone || !hasFinitePositionHint(receptionZone)) return undefined;

    const centerX = Math.round(input.office.worldBounds.x + input.office.worldBounds.width * receptionZone.positionHint.xWeight);
    const centerY = Math.round(input.office.worldBounds.y + input.office.worldBounds.height * receptionZone.positionHint.yWeight);
    const interactionZone = {
      x: clamp(centerX - RECEPTION_DESK_WIDTH / 2, input.office.walkableBounds.x, input.office.walkableBounds.x + input.office.walkableBounds.width - RECEPTION_DESK_WIDTH),
      y: clamp(centerY - RECEPTION_DESK_HEIGHT / 2, input.office.walkableBounds.y, input.office.walkableBounds.y + input.office.walkableBounds.height - RECEPTION_DESK_HEIGHT),
      width: RECEPTION_DESK_WIDTH,
      height: RECEPTION_DESK_HEIGHT,
    };
    const id = `${input.layout.layoutId}-reception-runtime-desk`;

    return {
      id,
      type: "desk",
      displayName: "Reception Runtime Desk",
      interactionZone,
      enabled: true,
      action: "open_workspace",
      markerId: id,
    };
  }
}

function hasFinitePositionHint(zone: OfficeLayoutZone) {
  return typeof zone.positionHint.xWeight === "number" && typeof zone.positionHint.yWeight === "number" && Number.isFinite(zone.positionHint.xWeight) && Number.isFinite(zone.positionHint.yWeight);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
