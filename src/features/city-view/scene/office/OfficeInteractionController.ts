import type { Point } from "../shared/geometry";
import type { OfficeInteractiveObjectRegistry } from "./OfficeInteractiveObjectRegistry";
import type { OfficeInteractionResult, OfficeInteractiveObject } from "./officeTypes";

export class OfficeInteractionController {
  private activeObject?: OfficeInteractiveObject;
  private lastInteractionResult?: OfficeInteractionResult;

  constructor(private readonly registry: OfficeInteractiveObjectRegistry) {}

  update(founderPosition: Point) {
    this.activeObject = this.registry.findActiveObject(founderPosition);
  }

  getActiveObject() {
    return this.activeObject;
  }

  consumePlaceholderInteraction(): OfficeInteractionResult | undefined {
    if (!this.activeObject) return undefined;

    this.lastInteractionResult = {
      objectId: this.activeObject.id,
      action: this.activeObject.action,
      status: "placeholder",
      message: `${this.activeObject.displayName} interaction is a placeholder.`,
    };
    console.info("Office interaction placeholder", this.lastInteractionResult);
    return this.lastInteractionResult;
  }

  getLastInteractionResult() {
    return this.lastInteractionResult;
  }

  destroy() {
    this.activeObject = undefined;
    this.lastInteractionResult = undefined;
  }
}
