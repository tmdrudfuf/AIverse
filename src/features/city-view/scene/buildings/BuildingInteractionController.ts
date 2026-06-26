import type { Point } from "../shared/geometry";
import type { PhaserScene } from "../shared/phaserTypes";
import type { CityBuildingDefinition } from "./buildingTypes";
import type { BuildingRegistry } from "./BuildingRegistry";

const INTERACTION_KEY_CODE = "Space";

export class BuildingInteractionController {
  private activeBuilding?: CityBuildingDefinition;
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

  destroy(scene?: PhaserScene) {
    window.removeEventListener("keydown", this.handleKeyDown);
    scene?.input.keyboard?.removeCapture("SPACE");
    this.activeBuilding = undefined;
    this.pendingInteraction = false;
  }
}