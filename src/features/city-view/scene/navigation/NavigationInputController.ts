import type Phaser from "phaser";
import { MOVEMENT_BINDINGS, MOVEMENT_KEYS } from "../config/navigationConfig";
import type { PhaserScene } from "../shared/phaserTypes";
import { NEUTRAL_NAVIGATION_INTENT } from "./NavigationState";
import type { NavigationIntent, NavigationState } from "./navigationTypes";

type MovementKeyName = (typeof MOVEMENT_KEYS)[number];
type MovementKeyMap = Partial<Record<MovementKeyName, Phaser.Input.Keyboard.Key>>;

const MOVEMENT_CAPTURE_KEYS = MOVEMENT_KEYS.join(",");

export class NavigationInputController {
  private scene?: PhaserScene;
  private state?: NavigationState;
  private keys?: MovementKeyMap;

  setup(scene: PhaserScene, state: NavigationState) {
    this.scene = scene;
    this.state = state;
    state.currentIntent = NEUTRAL_NAVIGATION_INTENT;
    state.isCityViewFocused = true;

    const keyboard = scene.input.keyboard;
    if (!keyboard) return;

    this.keys = keyboard.addKeys(MOVEMENT_CAPTURE_KEYS) as MovementKeyMap;
    keyboard.addCapture(MOVEMENT_CAPTURE_KEYS);
  }

  getIntent(): NavigationIntent {
    const directionX = resolveAxis(this.isDirectionActive(-1, 0), this.isDirectionActive(1, 0));
    const directionY = resolveAxis(this.isDirectionActive(0, -1), this.isDirectionActive(0, 1));
    const isMoving = directionX !== 0 || directionY !== 0;

    return {
      directionX,
      directionY,
      zoomDelta: 0,
      isMoving,
      source: isMoving ? "keyboard" : "none",
    };
  }

  destroy() {
    this.scene?.input.keyboard?.removeCapture(MOVEMENT_CAPTURE_KEYS);
    if (this.state) {
      this.state.currentIntent = NEUTRAL_NAVIGATION_INTENT;
      this.state.isCityViewFocused = false;
    }
    this.keys = undefined;
    this.scene = undefined;
    this.state = undefined;
  }

  private isDirectionActive(directionX: -1 | 0 | 1, directionY: -1 | 0 | 1) {
    return MOVEMENT_BINDINGS.some(
      (binding) =>
        binding.directionX === directionX &&
        binding.directionY === directionY &&
        binding.keys.some((keyName) => this.isDown(keyName)),
    );
  }

  private isDown(keyName: MovementKeyName) {
    return Boolean(this.keys?.[keyName]?.isDown);
  }
}

function resolveAxis(negativeActive: boolean, positiveActive: boolean): -1 | 0 | 1 {
  if (negativeActive === positiveActive) return 0;
  return negativeActive ? -1 : 1;
}
