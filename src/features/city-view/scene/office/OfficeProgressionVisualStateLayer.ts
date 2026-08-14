import type { PhaserScene } from "../shared/phaserTypes";
import type { OfficeLayoutSnapshot, OfficeLayoutZone } from "./layout/OfficeLayoutTypes";
import type { CompanyProgressionSnapshot } from "./progression/CompanyProgressionTypes";

type PositionedOfficeLayoutZone = OfficeLayoutZone & {
  positionHint: OfficeLayoutZone["positionHint"] & {
    xWeight: number;
    yWeight: number;
  };
};

const SUMMARY_X = 18;
const SUMMARY_Y = 18;
const SUMMARY_WIDTH = 278;
const SUMMARY_HEIGHT = 84;
const SUMMARY_DEPTH = 18;
const ZONE_MARKER_DEPTH = 9;
const MAX_VISIBLE_ZONE_MARKERS = 6;

export type OfficeProgressionZoneMarker = {
  id: string;
  label: string;
  x: number;
  y: number;
};

export type OfficeProgressionVisualStateViewModel = {
  visible: boolean;
  summaryTitle: string;
  capacityLabel: string;
  floorLabel: string;
  zoneCountLabel: string;
  markers: OfficeProgressionZoneMarker[];
};

export class OfficeProgressionVisualStateLayer {
  private readonly background: Phaser.GameObjects.Graphics;
  private readonly title: Phaser.GameObjects.Text;
  private readonly capacityText: Phaser.GameObjects.Text;
  private readonly floorText: Phaser.GameObjects.Text;
  private readonly zoneText: Phaser.GameObjects.Text;
  private readonly markerContainers: Phaser.GameObjects.Container[];
  private readonly markerLabels: Phaser.GameObjects.Text[];

  constructor(scene: PhaserScene) {
    this.background = scene.add.graphics().setScrollFactor(0).setDepth(SUMMARY_DEPTH).setVisible(false);
    this.title = scene.add
      .text(SUMMARY_X + 12, SUMMARY_Y + 10, "", {
        fontFamily: "monospace",
        fontSize: "13px",
        color: "#f8fafc",
        fontStyle: "bold",
      })
      .setScrollFactor(0)
      .setDepth(SUMMARY_DEPTH + 1)
      .setVisible(false);
    this.capacityText = createSummaryText(scene, SUMMARY_Y + 32);
    this.floorText = createSummaryText(scene, SUMMARY_Y + 50);
    this.zoneText = createSummaryText(scene, SUMMARY_Y + 68);

    const markers = Array.from({ length: MAX_VISIBLE_ZONE_MARKERS }, () => createZoneMarker(scene));
    this.markerContainers = markers.map((marker) => marker.container);
    this.markerLabels = markers.map((marker) => marker.label);

    this.drawBackground();
  }

  update(progression?: CompanyProgressionSnapshot, layout?: OfficeLayoutSnapshot) {
    const viewModel = createOfficeProgressionVisualStateViewModel(progression, layout);

    if (!viewModel.visible) {
      this.setSummaryVisible(false);
      this.markerContainers.forEach((marker, index) => {
        this.markerLabels[index].setText("");
        marker.setVisible(false);
      });
      return;
    }

    this.setSummaryVisible(true);
    this.title.setText(viewModel.summaryTitle);
    this.capacityText.setText(viewModel.capacityLabel);
    this.floorText.setText(viewModel.floorLabel);
    this.zoneText.setText(viewModel.zoneCountLabel);

    this.markerContainers.forEach((marker, index) => {
      const markerViewModel = viewModel.markers[index];
      if (!markerViewModel) {
        this.markerLabels[index].setText("");
        marker.setVisible(false);
        return;
      }

      marker.setPosition(markerViewModel.x, markerViewModel.y).setVisible(true);
      this.markerLabels[index].setText(markerViewModel.label);
    });
  }

  destroy() {
    this.background.destroy();
    this.title.destroy();
    this.capacityText.destroy();
    this.floorText.destroy();
    this.zoneText.destroy();
    this.markerContainers.forEach((marker) => marker.destroy(true));
  }

  private setSummaryVisible(visible: boolean) {
    this.background.setVisible(visible);
    this.title.setVisible(visible);
    this.capacityText.setVisible(visible);
    this.floorText.setVisible(visible);
    this.zoneText.setVisible(visible);
  }

  private drawBackground() {
    this.background.clear();
    this.background.fillStyle(0x1f2937, 0.82);
    this.background.fillRoundedRect(SUMMARY_X, SUMMARY_Y, SUMMARY_WIDTH, SUMMARY_HEIGHT, 5);
    this.background.lineStyle(1, 0xfacc15, 0.42);
    this.background.strokeRoundedRect(SUMMARY_X, SUMMARY_Y, SUMMARY_WIDTH, SUMMARY_HEIGHT, 5);
    this.background.lineStyle(1, 0xffffff, 0.14);
    this.background.lineBetween(SUMMARY_X + 8, SUMMARY_Y + 8, SUMMARY_X + SUMMARY_WIDTH - 8, SUMMARY_Y + 8);
  }
}

export function createOfficeProgressionVisualStateViewModel(
  progression?: CompanyProgressionSnapshot,
  layout?: OfficeLayoutSnapshot,
): OfficeProgressionVisualStateViewModel {
  if (!progression || !layout) {
    return createHiddenViewModel();
  }

  const activeZones = createActiveZoneMarkers(progression, layout);

  return {
    visible: true,
    summaryTitle: `Level ${progression.companyLevel}: ${formatLabel(progression.companyStage)}`,
    capacityLabel: `${progression.maxEmployees} employee capacity`,
    floorLabel: formatFloors(progression.floorCount),
    zoneCountLabel: formatActiveZones(activeZones.totalActiveZones),
    markers: activeZones.markers.map((marker) => ({ ...marker })),
  };
}

function createActiveZoneMarkers(progression: CompanyProgressionSnapshot, layout: OfficeLayoutSnapshot) {
  const unlockedTypes = new Set(progression.unlockedOfficeZones);
  const activeZones = layout.zones.filter((zone) => unlockedTypes.has(zone.type));

  return {
    totalActiveZones: activeZones.length,
    markers: activeZones
      .filter(hasFinitePositionHint)
      .slice(0, MAX_VISIBLE_ZONE_MARKERS)
      .map((zone) => ({
        id: zone.zoneId,
        label: formatLabel(zone.label),
        x: Math.round(zone.positionHint.xWeight * 960),
        y: Math.round(zone.positionHint.yWeight * 600),
      })),
  };
}

function createHiddenViewModel(): OfficeProgressionVisualStateViewModel {
  return {
    visible: false,
    summaryTitle: "",
    capacityLabel: "",
    floorLabel: "",
    zoneCountLabel: "",
    markers: [],
  };
}

function createSummaryText(scene: PhaserScene, y: number) {
  return scene.add
    .text(SUMMARY_X + 12, y, "", {
      fontFamily: "monospace",
      fontSize: "11px",
      color: "#fde68a",
    })
    .setScrollFactor(0)
    .setDepth(SUMMARY_DEPTH + 1)
    .setVisible(false);
}

function createZoneMarker(scene: PhaserScene) {
  const container = scene.add.container(0, 0).setDepth(ZONE_MARKER_DEPTH).setVisible(false);
  const graphics = scene.add.graphics();

  graphics.fillStyle(0x0f172a, 0.78);
  graphics.fillCircle(0, 0, 8);
  graphics.lineStyle(2, 0xfacc15, 0.92);
  graphics.strokeCircle(0, 0, 8);
  graphics.fillStyle(0xfacc15, 0.95);
  graphics.fillCircle(0, 0, 3);

  const label = scene.add
    .text(12, -8, "", {
      backgroundColor: "rgba(15, 23, 42, 0.84)",
      color: "#ffffff",
      fontFamily: "monospace",
      fontSize: "10px",
      fontStyle: "bold",
      padding: { x: 5, y: 2 },
    })
    .setOrigin(0, 0.5);

  container.add([graphics, label]);
  return { container, label };
}

function hasFinitePositionHint(zone: OfficeLayoutZone): zone is PositionedOfficeLayoutZone {
  return (
    typeof zone.positionHint.xWeight === "number" &&
    typeof zone.positionHint.yWeight === "number" &&
    Number.isFinite(zone.positionHint.xWeight) &&
    Number.isFinite(zone.positionHint.yWeight)
  );
}

function formatFloors(floorCount: number) {
  return floorCount === 1 ? "1 office floor" : `${floorCount} office floors`;
}

function formatActiveZones(zoneCount: number) {
  return zoneCount === 1 ? "1 active zone" : `${zoneCount} active zones`;
}

function formatLabel(value: string) {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
