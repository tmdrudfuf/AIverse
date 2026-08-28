import type { Rect } from "../buildings/buildingTypes";
import type { OfficeDefinition, OfficeInteriorZone, OfficeInteriorZoneRole } from "./officeTypes";

const DAILY_PROOF_REQUIRED_ZONE_ROLES: OfficeInteriorZoneRole[] = [
  "reception",
  "founder-desk",
  "workspace",
  "employee-desk",
];

export function getEnabledInteriorZones(office: OfficeDefinition): OfficeInteriorZone[] {
  return (office.interiorFoundation?.zones ?? [])
    .filter((zone) => zone.enabled)
    .map(cloneInteriorZone);
}

export function getInteriorZoneRoles(office: OfficeDefinition): OfficeInteriorZoneRole[] {
  return getEnabledInteriorZones(office).map((zone) => zone.role);
}

export function hasDailyProofInteriorFoundation(office: OfficeDefinition) {
  const roles = new Set(getInteriorZoneRoles(office));
  return DAILY_PROOF_REQUIRED_ZONE_ROLES.every((role) => roles.has(role));
}

export function validateInteriorFoundation(office: OfficeDefinition) {
  const zones = office.interiorFoundation?.zones ?? [];
  const ids = new Set<string>();

  zones.forEach((zone) => {
    if (!zone.id.trim()) throw new Error(`Office ${office.sceneKey} interior zone is missing an id.`);
    if (!zone.label.trim()) throw new Error(`Office ${office.sceneKey} interior zone ${zone.id} is missing a label.`);
    if (ids.has(zone.id)) throw new Error(`Office ${office.sceneKey} interior zone id is duplicated: ${zone.id}.`);
    if (!isPositiveRect(zone.bounds)) throw new Error(`Office ${office.sceneKey} interior zone ${zone.id} has invalid bounds.`);

    ids.add(zone.id);
  });
}

function cloneInteriorZone(zone: OfficeInteriorZone): OfficeInteriorZone {
  return {
    ...zone,
    bounds: { ...zone.bounds },
  };
}

function isPositiveRect(rect: Rect) {
  return rect.width > 0 && rect.height > 0;
}
