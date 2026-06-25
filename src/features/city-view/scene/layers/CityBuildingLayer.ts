import { CITY_BUILDINGS, CITY_COLORS, type CityBuildingDefinition } from "../config/cityWorldConfig";
import type { PhaserGraphics, PhaserScene } from "../shared/phaserTypes";

export function createCityBuildingLayer(scene: PhaserScene, g: PhaserGraphics) {
  CITY_BUILDINGS.forEach((building) => drawBuilding(scene, g, building));
}

function drawBuilding(scene: PhaserScene, g: PhaserGraphics, building: CityBuildingDefinition) {
  const { x, y, width, height, wall, roof, accent, name, active } = building;

  g.fillStyle(0x314233, 0.28).fillRect(x + 12, y + 15, width, height);

  if (active) {
    g.fillStyle(CITY_COLORS.yellow, 0.28).fillRect(x - 14, y - 14, width + 28, height + 28);
    g.lineStyle(6, CITY_COLORS.yellow).strokeRect(x - 9, y - 9, width + 18, height + 18);
  }

  g.fillStyle(CITY_COLORS.ink).fillRect(x - 8, y - 16, width + 16, 30);
  g.fillStyle(roof).fillRect(x, y, width, 36);
  g.fillStyle(wall).fillRect(x, y + 36, width, height - 36);
  g.fillStyle(0x233044, 0.2).fillRect(x, y + height - 13, width, 13);

  for (let wx = x + 28; wx < x + width - 35; wx += 62) {
    g.fillStyle(CITY_COLORS.ink).fillRect(wx, y + 57, 38, 48);
    g.fillStyle(accent).fillRect(wx + 5, y + 62, 28, 38);
    g.fillStyle(0xffffff, 0.35).fillRect(wx + 9, y + 65, 5, 30);
  }

  g.fillStyle(CITY_COLORS.ink).fillRect(x + width / 2 - 25, y + height - 64, 50, 64);
  g.fillStyle(0xe7d9b4).fillRect(x + width / 2 - 17, y + height - 55, 34, 55);
  g.fillStyle(CITY_COLORS.ink).fillRect(x + width / 2 + 8, y + height - 30, 4, 4);

  scene.add
    .text(x + width / 2, y - 1, name, {
      fontFamily: "monospace",
      fontSize: active ? "18px" : "17px",
      color: "#ffffff",
      fontStyle: "bold",
    })
    .setOrigin(0.5);

  scene.add
    .text(x + width / 2, y + height + 12, active ? "ACTIVE COMPANY" : "COMING SOON", {
      fontFamily: "monospace",
      fontSize: "13px",
      color: active ? "#253247" : "#ffffff",
      backgroundColor: active ? "#f4c85d" : "#596171",
      fontStyle: "bold",
      padding: { x: 10, y: 6 },
    })
    .setOrigin(0.5, 0)
    .setAlpha(active ? 1 : 0.94);
}
