import type { Rect } from "../buildings/buildingTypes";
import type { OfficeDefinition, OfficeEnvironmentDetail, OfficeEnvironmentDetailKind } from "./officeTypes";

const DAILY_PROOF_REQUIRED_DETAIL_KINDS: OfficeEnvironmentDetailKind[] = [
  "brand-sign",
  "plant",
  "lighting",
  "collaboration-board",
  "storage",
];

export function getEnabledEnvironmentDetails(office: OfficeDefinition): OfficeEnvironmentDetail[] {
  return (office.visualEnvironment?.details ?? [])
    .filter((detail) => detail.enabled)
    .map(cloneEnvironmentDetail);
}

export function getEnvironmentDetailKinds(office: OfficeDefinition): OfficeEnvironmentDetailKind[] {
  return getEnabledEnvironmentDetails(office).map((detail) => detail.kind);
}

export function hasDailyProofVisualEnvironment(office: OfficeDefinition) {
  const kinds = new Set(getEnvironmentDetailKinds(office));
  return DAILY_PROOF_REQUIRED_DETAIL_KINDS.every((kind) => kinds.has(kind));
}

export function validateVisualEnvironment(office: OfficeDefinition) {
  const details = office.visualEnvironment?.details ?? [];
  const ids = new Set<string>();

  details.forEach((detail) => {
    if (!detail.id.trim()) throw new Error(`Office ${office.sceneKey} environment detail is missing an id.`);
    if (!detail.label.trim()) throw new Error(`Office ${office.sceneKey} environment detail ${detail.id} is missing a label.`);
    if (ids.has(detail.id)) throw new Error(`Office ${office.sceneKey} environment detail id is duplicated: ${detail.id}.`);
    if (!isPositiveRect(detail.bounds)) throw new Error(`Office ${office.sceneKey} environment detail ${detail.id} has invalid bounds.`);

    ids.add(detail.id);
  });
}

function cloneEnvironmentDetail(detail: OfficeEnvironmentDetail): OfficeEnvironmentDetail {
  return {
    ...detail,
    bounds: { ...detail.bounds },
  };
}

function isPositiveRect(rect: Rect) {
  return rect.width > 0 && rect.height > 0;
}
