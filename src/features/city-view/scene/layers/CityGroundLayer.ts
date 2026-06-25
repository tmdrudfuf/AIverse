import { CITY_COLORS, CITY_WORLD_BOUNDS } from "../config/cityWorldConfig";
import type { PhaserGraphics } from "../shared/phaserTypes";

export function createCityGroundLayer(g: PhaserGraphics) {
  const { width, height } = CITY_WORLD_BOUNDS;

  g.fillStyle(CITY_COLORS.grass).fillRect(0, 0, width, height);

  for (let y = 28; y < height; y += 48) {
    for (let x = (y / 48) % 2 ? 24 : 48; x < width; x += 72) {
      g.fillStyle(CITY_COLORS.grassDark, 0.42)
        .fillRect(x, y, 4, 9)
        .fillRect(x - 4, y + 5, 4, 4)
        .fillRect(x + 4, y + 4, 4, 4);
    }
  }
}
