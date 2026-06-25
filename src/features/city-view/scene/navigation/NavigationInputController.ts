import { MOVEMENT_BINDINGS, MOVEMENT_KEYS } from "../config/navigationConfig";
import type { PhaserScene } from "../shared/phaserTypes";
import { NEUTRAL_NAVIGATION_INTENT } from "./NavigationState";
import type { NavigationIntent, NavigationState } from "./navigationTypes";

type MovementKeyName = (typeof MOVEMENT_KEYS)[number];

const MOVEMENT_CAPTURE_KEYS = MOVEMENT_KEYS.join(",");
const KEY_EVENT_TO_MOVEMENT_KEY: Partial<Record<string, MovementKeyName>> = {
  KeyW: "W",
  KeyA: "A",
  KeyS: "S",
  KeyD: "D",
  ArrowUp: "UP",
  ArrowLeft: "LEFT",
  ArrowDown: "DOWN",
  ArrowRight: "RIGHT",
};

export class NavigationInputController {
  private scene?: PhaserScene;
  private state?: NavigationState;
  private activeKeys = new Set<MovementKeyName>();
  private readonly handleKeyDown = (event: KeyboardEvent) => this.setKeyActive(event, true);
  private readonly handleKeyUp = (event: KeyboardEvent) => this.setKeyActive(event, false);

  setup(scene: PhaserScene, state: NavigationState) {
    this.scene = scene;
    this.state = state;
    state.currentIntent = NEUTRAL_NAVIGATION_INTENT;
    state.isCityViewFocused = true;

    const keyboard = scene.input.keyboard;
    if (!keyboard) return;

    keyboard.addKeys(MOVEMENT_CAPTURE_KEYS);
    keyboard.addCapture(MOVEMENT_CAPTURE_KEYS);
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
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
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
    this.scene?.input.keyboard?.removeCapture(MOVEMENT_CAPTURE_KEYS);
    this.activeKeys.clear();
    if (this.state) {
      this.state.currentIntent = NEUTRAL_NAVIGATION_INTENT;
      this.state.isCityViewFocused = false;
    }
    this.scene = undefined;
    this.state = undefined;
  }

  private setKeyActive(event: KeyboardEvent, isActive: boolean) {
    const keyName = KEY_EVENT_TO_MOVEMENT_KEY[event.code];
    if (!keyName) return;

    if (isActive) {
      this.activeKeys.add(keyName);
    } else {
      this.activeKeys.delete(keyName);
    }
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
    return this.activeKeys.has(keyName);
  }
}

function resolveAxis(negativeActive: boolean, positiveActive: boolean): -1 | 0 | 1 {
  if (negativeActive === positiveActive) return 0;
  return negativeActive ? -1 : 1;
}
