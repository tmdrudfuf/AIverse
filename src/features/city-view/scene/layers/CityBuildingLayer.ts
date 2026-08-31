import { CITY_BUILDINGS } from "../config/cityBuildingConfig";
import { CITY_COLORS } from "../config/cityWorldConfig";
import {
  createCityProjectOperationStatusesFromBrowserSession,
  type CityProjectOperationStatus,
  type CityProjectOperationStatusMap,
} from "../CityProjectOperationsStatusService";
import {
  portfolioSummaryMatchesFilter,
  type PortfolioFilter,
} from "../PortfolioOperationsService";
import type { CityBuildingDefinition } from "../buildings/buildingTypes";
import type { PhaserGraphics, PhaserScene } from "../shared/phaserTypes";

export type CityBuildingLayerOptions = {
  portfolioFilter?: PortfolioFilter;
};

export type CityBuildingLayerHandle = {
  destroy: () => void;
};

export function createCityBuildingLayer(
  scene: PhaserScene,
  g: PhaserGraphics,
  cityProjectOperationStatuses: CityProjectOperationStatusMap = createCityProjectOperationStatusesFromBrowserSession(CITY_BUILDINGS),
  options: CityBuildingLayerOptions = {},
): CityBuildingLayerHandle {
  const textObjects: Array<{ destroy?: () => void }> = [];
  CITY_BUILDINGS.forEach((building) => {
    drawBuilding(scene, g, building, cityProjectOperationStatuses[building.id], options.portfolioFilter ?? "all", textObjects);
  });

  return {
    destroy: () => {
      if ("clear" in g && typeof g.clear === "function") g.clear();
      textObjects.forEach((textObject) => textObject.destroy?.());
    },
  };
}

function drawBuilding(
  scene: PhaserScene,
  g: PhaserGraphics,
  building: CityBuildingDefinition,
  operationStatus?: CityProjectOperationStatus,
  portfolioFilter: PortfolioFilter = "all",
  textObjects: Array<{ destroy?: () => void }> = [],
) {
  const { worldPosition, size, visual, name, active } = building;
  const { x, y } = worldPosition;
  const { width, height } = size;
  const { wall, roof, accent } = visual;
  const isFilteredOut = operationStatus
    ? !portfolioSummaryMatchesFilter(operationStatus.portfolioSummary, portfolioFilter)
    : portfolioFilter !== "all";
  const layerAlpha = isFilteredOut ? 0.32 : 1;
  const statusTone = operationStatus?.tone;
  const activeWorkVisible = statusTone === "active";
  const completedVisible = statusTone === "complete";
  const warningVisible = statusTone === "warning";

  g.fillStyle(0x314233, 0.28 * layerAlpha).fillRect(x + 12, y + 15, width, height);

  if (activeWorkVisible || warningVisible || completedVisible) {
    const treatmentColor = warningVisible ? 0xc2410c : completedVisible ? 0x2f9e44 : CITY_COLORS.yellow;
    g.fillStyle(treatmentColor, (warningVisible ? 0.34 : 0.24) * layerAlpha).fillRect(x - 14, y - 14, width + 28, height + 28);
    g.lineStyle(6, treatmentColor, layerAlpha).strokeRect(x - 9, y - 9, width + 18, height + 18);
  }

  g.fillStyle(CITY_COLORS.ink, layerAlpha).fillRect(x - 8, y - 16, width + 16, 30);
  g.fillStyle(roof, layerAlpha).fillRect(x, y, width, 36);
  g.fillStyle(wall, layerAlpha).fillRect(x, y + 36, width, height - 36);
  g.fillStyle(0x233044, 0.2 * layerAlpha).fillRect(x, y + height - 13, width, 13);

  for (let wx = x + 28; wx < x + width - 35; wx += 62) {
    g.fillStyle(CITY_COLORS.ink, layerAlpha).fillRect(wx, y + 57, 38, 48);
    g.fillStyle(accent, layerAlpha).fillRect(wx + 5, y + 62, 28, 38);
    g.fillStyle(0xffffff, 0.35 * layerAlpha).fillRect(wx + 9, y + 65, 5, 30);
  }

  g.fillStyle(CITY_COLORS.ink, layerAlpha).fillRect(x + width / 2 - 25, y + height - 64, 50, 64);
  g.fillStyle(0xe7d9b4, layerAlpha).fillRect(x + width / 2 - 17, y + height - 55, 34, 55);
  g.fillStyle(CITY_COLORS.ink, layerAlpha).fillRect(x + width / 2 + 8, y + height - 30, 4, 4);

  addBuildingText(textObjects, scene.add
    .text(x + width / 2, y - 1, name, {
      fontFamily: "monospace",
      fontSize: active ? "18px" : "17px",
      color: "#ffffff",
      fontStyle: "bold",
    })
    .setOrigin(0.5))
    .setAlpha(layerAlpha);

  addBuildingText(textObjects, scene.add
    .text(x + width / 2, y + height + 12, operationStatus?.label ?? (active ? "ACTIVE COMPANY" : "COMING SOON"), {
      fontFamily: "monospace",
      fontSize: "13px",
      color: getStatusTextColor(operationStatus, active),
      backgroundColor: getStatusBackgroundColor(operationStatus, active),
      fontStyle: "bold",
      padding: { x: 10, y: 6 },
    })
    .setOrigin(0.5, 0)
    .setAlpha((operationStatus?.tone === "idle" ? 0.94 : 1) * layerAlpha));

  if (operationStatus?.reasonText) {
    addBuildingText(textObjects, scene.add
      .text(x + width / 2, y + height + 45, compactReason(operationStatus.reasonText), {
        fontFamily: "monospace",
        fontSize: "10px",
        color: "#ffffff",
        backgroundColor: "#253247",
        padding: { x: 8, y: 4 },
      })
      .setOrigin(0.5, 0)
      .setAlpha(0.92 * layerAlpha));
  }
}

function addBuildingText<T extends { destroy?: () => void }>(textObjects: Array<{ destroy?: () => void }>, textObject: T): T {
  textObjects.push(textObject);
  return textObject;
}

function getStatusTextColor(status: CityProjectOperationStatus | undefined, active: boolean) {
  if (!status) return active ? "#253247" : "#ffffff";
  if (status.tone === "idle" || status.tone === "disconnected" || status.tone === "warning") return "#ffffff";
  return "#172033";
}

function getStatusBackgroundColor(status: CityProjectOperationStatus | undefined, active: boolean) {
  if (!status) return active ? "#f4c85d" : "#596171";
  if (status.tone === "warning") return "#c2410c";
  if (status.tone === "complete") return "#7bd88f";
  if (status.tone === "active") return "#f4c85d";
  if (status.tone === "disconnected") return "#4b5563";
  return "#596171";
}

function compactReason(value: string) {
  return value.length <= 42 ? value : `${value.slice(0, 39)}...`;
}
