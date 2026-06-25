import { KEYBOARD_ZOOM_SPEED, MOVEMENT_BINDINGS, MOVEMENT_KEYS, WHEEL_ZOOM_STEP, ZOOM_KEYS } from "../config/navigationConfig";
import type { PhaserScene } from "../shared/phaserTypes";
import { NEUTRAL_NAVIGATION_INTENT } from "./NavigationState";
import type { NavigationIntent, NavigationState } from "./navigationTypes";

type MovementKeyName = (typeof MOVEMENT_KEYS)[number];
type ZoomKeyName = (typeof ZOOM_KEYS)[number];
type NavigationKeyName = MovementKeyName | ZoomKeyName;

const NAVIGATION_CAPTURE_KEYS = [...MOVEMENT_KEYS, ...ZOOM_KEYS].join(",");
const KEY_EVENT_TO_NAVIGATION_KEY: Partial<Record<string, NavigationKeyName>> = {
  KeyW: "W",
  KeyA: "A",
  KeyS: "S",
  KeyD: "D",
  KeyQ: "Q",
  KeyE: "E",
  ArrowUp: "UP",
  ArrowLeft: "LEFT",
  ArrowDown: "DOWN",
  ArrowRight: "RIGHT",
};

export class NavigationInputController {
  private scene?: PhaserScene;
  private state?: NavigationState;
  private activeKeys = new Set<NavigationKeyName>();
  private pendingWheelZoomDelta = 0;
  private readonly handleKeyDown = (event: KeyboardEvent) => this.setKeyActive(event, true);
  private readonly handleKeyUp = (event: KeyboardEvent) => this.setKeyActive(event, false);
  private readonly handleWheel = (_pointer: unknown, _gameObjects: unknown[], _deltaX: number, deltaY: number) => {
    this.pendingWheelZoomDelta += deltaY < 0 ? WHEEL_ZOOM_STEP : -WHEEL_ZOOM_STEP;
  };

  setup(scene: PhaserScene, state: NavigationState) {
    this.scene = scene;
    this.state = state;
    state.currentIntent = NEUTRAL_NAVIGATION_INTENT;
    state.isCityViewFocused = true;

    const keyboard = scene.input.keyboard;
    if (!keyboard) return;

    keyboard.addKeys(NAVIGATION_CAPTURE_KEYS);
    keyboard.addCapture(NAVIGATION_CAPTURE_KEYS);
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
    scene.input.on("wheel", this.handleWheel);
  }

  getIntent(): NavigationIntent {
    const directionX = resolveAxis(this.isDirectionActive(-1, 0), this.isDirectionActive(1, 0));
    const directionY = resolveAxis(this.isDirectionActive(0, -1), this.isDirectionActive(0, 1));
    const keyboardZoomDelta = resolveAxis(this.isDown("Q"), this.isDown("E")) * KEYBOARD_ZOOM_SPEED;
    const wheelZoomDelta = this.pendingWheelZoomDelta;
    this.pendingWheelZoomDelta = 0;

    const zoomDelta = keyboardZoomDelta + wheelZoomDelta;
    const isMoving = directionX !== 0 || directionY !== 0;

    return {
      directionX,
      directionY,
      zoomDelta,
      isMoving,
      source: resolveIntentSource(isMoving, keyboardZoomDelta !== 0, wheelZoomDelta !== 0),
    };
  }

  destroy() {
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
    this.scene?.input.off("wheel", this.handleWheel);
    this.scene?.input.keyboard?.removeCapture(NAVIGATION_CAPTURE_KEYS);
    this.activeKeys.clear();
    this.pendingWheelZoomDelta = 0;
    if (this.state) {
      this.state.currentIntent = NEUTRAL_NAVIGATION_INTENT;
      this.state.isCityViewFocused = false;
    }
    this.scene = undefined;
    this.state = undefined;
  }

  private setKeyActive(event: KeyboardEvent, isActive: boolean) {
    const keyName = KEY_EVENT_TO_NAVIGATION_KEY[event.code];
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

  private isDown(keyName: NavigationKeyName) {
    return this.activeKeys.has(keyName);
  }
}

function resolveAxis(negativeActive: boolean, positiveActive: boolean): -1 | 0 | 1 {
  if (negativeActive === positiveActive) return 0;
  return negativeActive ? -1 : 1;
}

function resolveIntentSource(isMoving: boolean, hasKeyboardZoomIntent: boolean, hasWheelIntent: boolean): NavigationIntent["source"] {
  if (hasKeyboardZoomIntent && hasWheelIntent) return "mixed";
  if (hasWheelIntent) return "wheel";
  if (isMoving || hasKeyboardZoomIntent) return "keyboard";
  return "none";
}
