import { CITY_TREE_POSITIONS } from "../config/cityWorldConfig";
import type { PhaserGraphics, PhaserScene } from "../shared/phaserTypes";

export function createCityDecorationLayer(scene: PhaserScene, g: PhaserGraphics) {
  CITY_TREE_POSITIONS.forEach(([x, y]) => drawTree(g, x, y));

  scene.add.text(34, 678, "DISTRICT 01", {
    fontFamily: "monospace",
    fontSize: "13px",
    color: "#335038",
    fontStyle: "bold",
  });
}

function drawTree(g: PhaserGraphics, x: number, y: number) {
  g.fillStyle(0x3b6540, 0.25).fillRect(x - 18, y + 22, 48, 14);
  g.fillStyle(0x76513a).fillRect(x - 5, y + 3, 12, 31);
  g.fillStyle(0x315b3e).fillRect(x - 22, y - 14, 48, 28).fillRect(x - 14, y - 27, 32, 52);
  g.fillStyle(0x5d9e4c).fillRect(x - 15, y - 21, 27, 28);
  g.fillStyle(0x8bc461).fillRect(x - 9, y - 17, 9, 9);
}
