import type { Point } from "../shared/geometry";
import type { PhaserScene } from "../shared/phaserTypes";
import type { CityBuildingDefinition } from "./buildingTypes";
import type { BuildingRegistry } from "./BuildingRegistry";

const INTERACTION_KEY_CODE = "Space";

export class BuildingInteractionController {
  private activeBuilding?: CityBuildingDefinition;
  private pendingClickedBuilding?: CityBuildingDefinition;
  private pendingInteraction = false;
  private readonly handleKeyDown = (event: KeyboardEvent) => {
    if (event.code !== INTERACTION_KEY_CODE) return;

    event.preventDefault();
    this.pendingInteraction = true;
  };

  constructor(private readonly registry: BuildingRegistry) {}

  setup(scene: PhaserScene) {
    scene.input.keyboard?.addCapture("SPACE");
    window.addEventListener("keydown", this.handleKeyDown);
    scene.input.on("pointerup", this.handlePointerUp);
  }

  update(founderPosition: Point) {
    this.activeBuilding = this.registry.getActiveBuildingAtPoint(founderPosition);
  }

  getActiveBuilding(): CityBuildingDefinition | undefined {
    return this.activeBuilding;
  }

  consumeInteractionPressed(activeBuilding: CityBuildingDefinition | undefined = this.activeBuilding) {
    const wasPressed = this.pendingInteraction && activeBuilding !== undefined;
    this.pendingInteraction = false;
    return wasPressed;
  }

  consumeClickedBuilding() {
    const building = this.pendingClickedBuilding;
    this.pendingClickedBuilding = undefined;
    return building;
  }

  destroy(scene?: PhaserScene) {
    window.removeEventListener("keydown", this.handleKeyDown);
    scene?.input.off("pointerup", this.handlePointerUp);
    scene?.input.keyboard?.removeCapture("SPACE");
    this.activeBuilding = undefined;
    this.pendingClickedBuilding = undefined;
    this.pendingInteraction = false;
  }

  private readonly handlePointerUp = (pointer: { worldX?: number; worldY?: number; x?: number; y?: number; downX?: number; downY?: number }) => {
    if (!isClick(pointer)) return;

    const worldX = Number(pointer.worldX);
    const worldY = Number(pointer.worldY);
    if (!Number.isFinite(worldX) || !Number.isFinite(worldY)) return;

    const clickedBuilding = this.registry.getActiveBuildingAtPoint({ x: worldX, y: worldY });
    if (!clickedBuilding?.active || !clickedBuilding.destination.enabled) return;

    this.pendingClickedBuilding = clickedBuilding;
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
