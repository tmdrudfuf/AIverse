export type Point = {
  x: number;
  y: number;
};

export type WorldBounds = Point & {
  width: number;
  height: number;
};
