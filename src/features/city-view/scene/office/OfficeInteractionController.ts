import type { Point } from "../shared/geometry";
import type { PhaserScene } from "../shared/phaserTypes";
import type { OfficeInteractiveObjectRegistry } from "./OfficeInteractiveObjectRegistry";
import type { OfficeInteractionResult, OfficeInteractiveObject } from "./officeTypes";

export class OfficeInteractionController {
  private activeObject?: OfficeInteractiveObject;
  private pendingClickedObject?: OfficeInteractiveObject;
  private lastInteractionResult?: OfficeInteractionResult;
  private pointerInteractionEnabled = true;

  constructor(private readonly registry: OfficeInteractiveObjectRegistry) {}

  setup(scene: PhaserScene) {
    scene.input.on("pointerup", this.handlePointerUp);
  }

  update(founderPosition: Point) {
    this.activeObject = this.registry.findActiveObject(founderPosition);
  }

  getActiveObject() {
    return this.activeObject;
  }

  consumePlaceholderInteraction(): OfficeInteractionResult | undefined {
    if (!this.activeObject) return undefined;

    return this.consumeObjectInteraction(this.activeObject.id);
  }

  consumeClickedInteraction(): OfficeInteractionResult | undefined {
    const clickedObject = this.pendingClickedObject;
    this.pendingClickedObject = undefined;
    if (!clickedObject) return undefined;

    return this.consumeObjectInteraction(clickedObject.id);
  }

  consumeObjectInteractionAtPoint(point: Point): OfficeInteractionResult | undefined {
    const object = this.registry.findActiveObject(point);
    return object ? this.consumeObjectInteraction(object.id) : undefined;
  }

  setPointerInteractionEnabled(enabled: boolean) {
    this.pointerInteractionEnabled = enabled;
    if (!enabled) this.pendingClickedObject = undefined;
  }

  private consumeObjectInteraction(objectId: string): OfficeInteractionResult | undefined {
    const currentObject = this.registry.getObject(objectId);
    if (!currentObject?.enabled) {
      this.activeObject = undefined;
      return undefined;
    }

    this.lastInteractionResult = {
      objectId: currentObject.id,
      action: currentObject.action,
      status: "placeholder",
      message: `${currentObject.displayName} interaction is a placeholder.`,
    };
    console.info("Office interaction placeholder", this.lastInteractionResult);
    return this.lastInteractionResult;
  }

  getLastInteractionResult() {
    return this.lastInteractionResult;
  }

  destroy(scene?: PhaserScene) {
    scene?.input.off("pointerup", this.handlePointerUp);
    this.activeObject = undefined;
    this.pendingClickedObject = undefined;
    this.lastInteractionResult = undefined;
    this.pointerInteractionEnabled = true;
  }

  private readonly handlePointerUp = (pointer: { worldX?: number; worldY?: number; x?: number; y?: number; downX?: number; downY?: number }) => {
    if (!this.pointerInteractionEnabled) return;
    if (!isClick(pointer)) return;

    const worldX = Number(pointer.worldX);
    const worldY = Number(pointer.worldY);
    if (!Number.isFinite(worldX) || !Number.isFinite(worldY)) return;

    this.pendingClickedObject = this.registry.findActiveObject({ x: worldX, y: worldY });
  };
}

function isClick(pointer: { x?: number; y?: number; downX?: number; downY?: number }) {
  const x = Number(pointer.x);
  const y = Number(pointer.y);
  const downX = Number(pointer.downX ?? x);
  const downY = Number(pointer.downY ?? y);
  if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(downX) || !Number.isFinite(downY)) return true;

  return Math.hypot(x - downX, y - downY) <= 8;
}
