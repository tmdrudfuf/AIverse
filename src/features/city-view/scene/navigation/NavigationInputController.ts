import type { PhaserScene } from "../shared/phaserTypes";
import { NEUTRAL_NAVIGATION_INTENT } from "./NavigationState";
import type { NavigationIntent, NavigationState } from "./navigationTypes";

export class NavigationInputController {
  private scene?: PhaserScene;

  setup(scene: PhaserScene, state: NavigationState) {
    this.scene = scene;
    state.currentIntent = NEUTRAL_NAVIGATION_INTENT;
  }

  getIntent(): NavigationIntent {
    return NEUTRAL_NAVIGATION_INTENT;
  }

  destroy() {
    this.scene = undefined;
  }
}
