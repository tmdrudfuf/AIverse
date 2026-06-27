import type { Rect } from "../buildings/buildingTypes";
import type { Point } from "../shared/geometry";
import type { OfficeTilemapLayers } from "./OfficeTilemapLayer";
import type {
  OfficeDefinition,
  OfficeInteractiveAction,
  OfficeInteractiveObject,
  OfficeInteractiveObjectType,
} from "./officeTypes";

const FALLBACK_COMPUTER_MARKER_ID = "future_computer_zone_01";
const SUPPORTED_TYPES = new Set<OfficeInteractiveObjectType>(["computer", "desk", "whiteboard", "workstation"]);
const SUPPORTED_ACTIONS = new Set<OfficeInteractiveAction>(["use_computer", "inspect", "open_workspace"]);

type TiledObjectProperty = {
  name?: string;
  value?: unknown;
};

export class OfficeInteractiveObjectRegistry {
  constructor(private readonly objects: OfficeInteractiveObject[]) {}

  static fromTilemapLayers(office: OfficeDefinition, layers: OfficeTilemapLayers) {
    const interactionObjects = layers.interactionLayer.objects
      .map((marker) => createObjectFromInteractionMarker(marker))
      .filter((object): object is OfficeInteractiveObject => Boolean(object));

    if (interactionObjects.length > 0) return new OfficeInteractiveObjectRegistry(interactionObjects);

    const fallbackZone = layers.markers.reservedZones[FALLBACK_COMPUTER_MARKER_ID];
    if (!fallbackZone) return new OfficeInteractiveObjectRegistry([]);

    return new OfficeInteractiveObjectRegistry([
      {
        id: `${office.buildingId}-computer-01`,
        type: "computer",
        displayName: "Computer",
        interactionZone: { ...fallbackZone },
        enabled: true,
        action: "use_computer",
        markerId: FALLBACK_COMPUTER_MARKER_ID,
      },
    ]);
  }

  getObjects() {
    return [...this.objects];
  }

  findActiveObject(founderPosition: Point): OfficeInteractiveObject | undefined {
    const activeObjects = this.objects.filter(
      (object) => object.enabled && isPointInRect(founderPosition, object.interactionZone),
    );
    if (activeObjects.length === 0) return undefined;

    return activeObjects.sort((left, right) => {
      const distanceDelta = getDistanceToRectCenter(founderPosition, left.interactionZone) - getDistanceToRectCenter(founderPosition, right.interactionZone);
      if (distanceDelta !== 0) return distanceDelta;

      return left.id.localeCompare(right.id);
    })[0];
  }
}

function createObjectFromInteractionMarker(marker: Phaser.Types.Tilemaps.TiledObject): OfficeInteractiveObject | undefined {
  const markerId = marker.name;
  const interactionZone = resolveMarkerRect(marker);
  if (!markerId || !interactionZone) return undefined;

  const type = normalizeObjectType(String(marker.type || getPropertyValue(marker, "type") || "computer"));
  if (!type) return undefined;

  const action = normalizeAction(String(getPropertyValue(marker, "action") || getDefaultAction(type)));
  const displayName = String(getPropertyValue(marker, "displayName") || getDefaultDisplayName(type));
  const enabled = getBooleanProperty(marker, "enabled", true);
  if (!action) return undefined;

  return {
    id: markerId,
    type,
    displayName,
    interactionZone,
    enabled,
    action,
    markerId,
  };
}

function resolveMarkerRect(marker: Phaser.Types.Tilemaps.TiledObject): Rect | undefined {
  if (marker.x === undefined || marker.y === undefined) return undefined;
  if (marker.width === undefined || marker.height === undefined || marker.width <= 0 || marker.height <= 0) return undefined;

  return { x: marker.x, y: marker.y, width: marker.width, height: marker.height };
}

function getPropertyValue(marker: Phaser.Types.Tilemaps.TiledObject, propertyName: string): unknown {
  const properties = marker.properties as TiledObjectProperty[] | undefined;
  return properties?.find((property) => property.name === propertyName)?.value;
}

function getBooleanProperty(marker: Phaser.Types.Tilemaps.TiledObject, propertyName: string, fallback: boolean) {
  const value = getPropertyValue(marker, propertyName);
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value.toLowerCase() === "true";
  return fallback;
}

function normalizeObjectType(value: string): OfficeInteractiveObjectType | undefined {
  return SUPPORTED_TYPES.has(value as OfficeInteractiveObjectType) ? (value as OfficeInteractiveObjectType) : undefined;
}

function normalizeAction(value: string): OfficeInteractiveAction | undefined {
  return SUPPORTED_ACTIONS.has(value as OfficeInteractiveAction) ? (value as OfficeInteractiveAction) : undefined;
}

function getDefaultAction(type: OfficeInteractiveObjectType): OfficeInteractiveAction {
  if (type === "computer") return "use_computer";
  return "inspect";
}

function getDefaultDisplayName(type: OfficeInteractiveObjectType) {
  if (type === "computer") return "Computer";
  if (type === "desk") return "Desk";
  if (type === "whiteboard") return "Whiteboard";
  return "Workstation";
}

function isPointInRect(point: Point, rect: Rect) {
  return point.x >= rect.x && point.x <= rect.x + rect.width && point.y >= rect.y && point.y <= rect.y + rect.height;
}

function getDistanceToRectCenter(point: Point, rect: Rect) {
  return Math.hypot(point.x - (rect.x + rect.width / 2), point.y - (rect.y + rect.height / 2));
}
