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
  private pointerNavigationEnabled = true;
  private isPointerDragging = false;
  private lastPointerScreenPosition?: { x: number; y: number };
  private pendingPanDelta = { x: 0, y: 0 };
  private readonly handleKeyDown = (event: KeyboardEvent) => this.setKeyActive(event, true);
  private readonly handleKeyUp = (event: KeyboardEvent) => this.setKeyActive(event, false);
  private readonly handleWheel = (_pointer: unknown, _gameObjects: unknown[], _deltaX: number, deltaY: number) => {
    this.pendingWheelZoomDelta += deltaY < 0 ? WHEEL_ZOOM_STEP : -WHEEL_ZOOM_STEP;
  };
  private readonly handlePointerDown = (pointer: { x?: number; y?: number; leftButtonDown?: () => boolean }) => {
    if (!this.pointerNavigationEnabled || pointer.leftButtonDown?.() === false) return;

    const x = Number(pointer.x);
    const y = Number(pointer.y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;

    this.isPointerDragging = true;
    this.lastPointerScreenPosition = { x, y };
  };
  private readonly handlePointerMove = (pointer: { x?: number; y?: number; isDown?: boolean; leftButtonDown?: () => boolean }) => {
    if (!this.pointerNavigationEnabled || !this.isPointerDragging) return;
    if (pointer.isDown === false || pointer.leftButtonDown?.() === false) {
      this.clearPointerDrag();
      return;
    }

    const x = Number(pointer.x);
    const y = Number(pointer.y);
    if (!Number.isFinite(x) || !Number.isFinite(y) || !this.lastPointerScreenPosition) return;

    this.pendingPanDelta.x += this.lastPointerScreenPosition.x - x;
    this.pendingPanDelta.y += this.lastPointerScreenPosition.y - y;
    this.lastPointerScreenPosition = { x, y };
  };
  private readonly handlePointerUp = () => {
    this.clearPointerDrag();
  };

  setup(scene: PhaserScene, state: NavigationState) {
    this.scene = scene;
    this.state = state;
    state.currentIntent = NEUTRAL_NAVIGATION_INTENT;
    state.isCityViewFocused = true;
    scene.input.on("wheel", this.handleWheel);
    scene.input.on("pointerdown", this.handlePointerDown);
    scene.input.on("pointermove", this.handlePointerMove);
    scene.input.on("pointerup", this.handlePointerUp);

    const keyboard = scene.input.keyboard;
    if (!keyboard) return;

    keyboard.addKeys(NAVIGATION_CAPTURE_KEYS);
    keyboard.addCapture(NAVIGATION_CAPTURE_KEYS);
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
  }

  getIntent(): NavigationIntent {
    const directionX = resolveAxis(this.isDirectionActive(-1, 0), this.isDirectionActive(1, 0));
    const directionY = resolveAxis(this.isDirectionActive(0, -1), this.isDirectionActive(0, 1));
    const keyboardZoomDelta = resolveAxis(this.isDown("Q"), this.isDown("E")) * KEYBOARD_ZOOM_SPEED;
    const wheelZoomDelta = this.pendingWheelZoomDelta;
    const panDeltaX = this.pendingPanDelta.x;
    const panDeltaY = this.pendingPanDelta.y;
    this.pendingWheelZoomDelta = 0;
    this.pendingPanDelta = { x: 0, y: 0 };

    const zoomDelta = keyboardZoomDelta + wheelZoomDelta;
    const isMoving = directionX !== 0 || directionY !== 0;
    const isPanning = panDeltaX !== 0 || panDeltaY !== 0;

    return {
      directionX,
      directionY,
      panDeltaX,
      panDeltaY,
      zoomDelta,
      isMoving,
      isPanning,
      source: resolveIntentSource(isMoving, isPanning, keyboardZoomDelta !== 0, wheelZoomDelta !== 0),
    };
  }

  setPointerNavigationEnabled(enabled: boolean) {
    this.pointerNavigationEnabled = enabled;
    if (!enabled) {
      this.clearPointerDrag();
      this.pendingPanDelta = { x: 0, y: 0 };
    }
  }

  destroy() {
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
    this.scene?.input.off("wheel", this.handleWheel);
    this.scene?.input.off("pointerdown", this.handlePointerDown);
    this.scene?.input.off("pointermove", this.handlePointerMove);
    this.scene?.input.off("pointerup", this.handlePointerUp);
    this.scene?.input.keyboard?.removeCapture(NAVIGATION_CAPTURE_KEYS);
    this.activeKeys.clear();
    this.pendingWheelZoomDelta = 0;
    this.pendingPanDelta = { x: 0, y: 0 };
    this.clearPointerDrag();
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

  private clearPointerDrag() {
    this.isPointerDragging = false;
    this.lastPointerScreenPosition = undefined;
  }
}

function resolveAxis(negativeActive: boolean, positiveActive: boolean): -1 | 0 | 1 {
  if (negativeActive === positiveActive) return 0;
  return negativeActive ? -1 : 1;
}

function resolveIntentSource(isMoving: boolean, isPanning: boolean, hasKeyboardZoomIntent: boolean, hasWheelIntent: boolean): NavigationIntent["source"] {
  const keyboardIntent = isMoving || hasKeyboardZoomIntent;
  const pointerIntent = isPanning;
  if ((keyboardIntent && hasWheelIntent) || (keyboardIntent && pointerIntent) || (pointerIntent && hasWheelIntent)) return "mixed";
  if (pointerIntent) return "pointer";
  if (hasWheelIntent) return "wheel";
  if (keyboardIntent) return "keyboard";
  return "none";
}
