import { CITY_COLORS, CITY_WORLD_BOUNDS } from "../config/cityWorldConfig";
import type { PhaserGraphics } from "../shared/phaserTypes";

export function createCityRoadLayer(g: PhaserGraphics) {
  const { width, height } = CITY_WORLD_BOUNDS;

  g.fillStyle(CITY_COLORS.sidewalk)
    .fillRect(0, 278, width, 164)
    .fillRect(486, 0, 172, height)
    .fillRect(1190, 0, 172, height);

  g.fillStyle(CITY_COLORS.sidewalkLight)
    .fillRect(0, 286, width, 8)
    .fillRect(0, 426, width, 8)
    .fillRect(494, 0, 8, height)
    .fillRect(642, 0, 8, height)
    .fillRect(1198, 0, 8, height)
    .fillRect(1346, 0, 8, height);

  g.fillStyle(CITY_COLORS.roadEdge)
    .fillRect(0, 304, width, 112)
    .fillRect(512, 0, 120, height)
    .fillRect(1216, 0, 120, height);

  g.fillStyle(CITY_COLORS.road)
    .fillRect(0, 312, width, 96)
    .fillRect(520, 0, 104, height)
    .fillRect(1224, 0, 104, height);

  g.fillStyle(CITY_COLORS.yellow);
  for (let x = 20; x < 480; x += 62) g.fillRect(x, 357, 34, 6);
  for (let x = 672; x < 1190; x += 62) g.fillRect(x, 357, 34, 6);
  for (let x = 1368; x < width; x += 62) g.fillRect(x, 357, 34, 6);
  for (let y = 16; y < 272; y += 60) g.fillRect(569, y, 6, 32);
  for (let y = 448; y < height; y += 60) g.fillRect(569, y, 6, 32);
  for (let y = 16; y < 272; y += 60) g.fillRect(1273, y, 6, 32);
  for (let y = 448; y < height; y += 60) g.fillRect(1273, y, 6, 32);

  g.fillStyle(0xf2edda);
  for (let x = 520; x < 624; x += 20) {
    g.fillRect(x, 316, 11, 30).fillRect(x, 374, 11, 30);
  }
  for (let y = 312; y < 408; y += 20) {
    g.fillRect(476, y, 30, 11).fillRect(638, y, 30, 11);
  }
  for (let x = 1224; x < 1328; x += 20) {
    g.fillRect(x, 316, 11, 30).fillRect(x, 374, 11, 30);
  }
  for (let y = 312; y < 408; y += 20) {
    g.fillRect(1180, y, 30, 11).fillRect(1342, y, 30, 11);
  }
}
