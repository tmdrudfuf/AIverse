export const CITY_WORLD_BOUNDS = {
  x: 0,
  y: 0,
  width: 1800,
  height: 1080,
} as const;

export const CITY_NAVIGATION_BOUNDS = CITY_WORLD_BOUNDS;

export const CITY_COLORS = {
  ink: 0x253247,
  grass: 0x79b45d,
  grassDark: 0x5b9748,
  road: 0x4a5262,
  roadEdge: 0x353c4b,
  sidewalk: 0xc9c3ad,
  sidewalkLight: 0xe1dbc5,
  yellow: 0xf4c85d,
} as const;

export type CityBuildingDefinition = {
  x: number;
  y: number;
  width: number;
  height: number;
  wall: number;
  roof: number;
  accent: number;
  name: string;
  active: boolean;
};

export const CITY_BUILDINGS: CityBuildingDefinition[] = [
  {
    x: 72,
    y: 72,
    width: 344,
    height: 180,
    wall: 0xe76f51,
    roof: 0x263b50,
    accent: CITY_COLORS.yellow,
    name: "DAILY PROOF INC.",
    active: true,
  },
  {
    x: 735,
    y: 78,
    width: 326,
    height: 168,
    wall: 0x7397c2,
    roof: 0x34465b,
    accent: 0x9de6ec,
    name: "AI LAB",
    active: false,
  },
  {
    x: 760,
    y: 490,
    width: 350,
    height: 166,
    wall: 0xa67bb8,
    roof: 0x493c5a,
    accent: 0xf0b7d2,
    name: "PORTFOLIO STUDIO",
    active: false,
  },
];

export const CITY_TREE_POSITIONS: Array<readonly [number, number]> = [
  [32, 238],
  [452, 92],
  [690, 54],
  [1138, 232],
  [84, 506],
  [194, 594],
  [384, 506],
  [696, 548],
  [1152, 502],
  [702, 222],
  [1432, 92],
  [1600, 172],
  [1510, 514],
  [1690, 646],
  [132, 874],
  [430, 918],
  [822, 872],
  [1110, 936],
  [1480, 884],
];
