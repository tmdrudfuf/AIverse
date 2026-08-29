import type { EmployeeNpcPositionHint } from "./EmployeeNpcTypes";
import { getRenderedOfficeWorkplacePosition } from "../RenderedOfficeComposition";

export function resolveEmployeeNpcWorldPosition(positionHint: EmployeeNpcPositionHint) {
  return getRenderedOfficeWorkplacePosition(positionHint.zone, positionHint.slot);
}
