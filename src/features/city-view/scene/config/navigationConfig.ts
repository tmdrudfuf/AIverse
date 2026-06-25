export const CAMERA_SPEED = 360;
export const CAMERA_SMOOTHING = 0.18;
export const MIN_ZOOM = 0.75;
export const MAX_ZOOM = 1.75;
export const INITIAL_ZOOM = 1;
export const KEYBOARD_ZOOM_SPEED = 0.9;
export const WHEEL_ZOOM_STEP = 0.18;
export const ZOOM_SMOOTHING = 0.16;

export const MOVEMENT_KEYS = ["W", "A", "S", "D", "UP", "DOWN", "LEFT", "RIGHT"] as const;
export const ZOOM_KEYS = ["Q", "E"] as const;
export const CAPTURED_NAVIGATION_KEYS = [...MOVEMENT_KEYS, ...ZOOM_KEYS] as const;
