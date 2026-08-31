import type { PhaserScene } from "../shared/phaserTypes";
import type { CityProjectOperationStatus } from "../CityProjectOperationsStatusService";
import type { CityBuildingDefinition } from "./buildingTypes";

export class BuildingInteractionPrompt {
  private readonly title: Phaser.GameObjects.Text;
  private readonly summary: Phaser.GameObjects.Text;
  private readonly action: Phaser.GameObjects.Text;

  constructor(scene: PhaserScene) {
    this.title = scene.add.text(24, 24, "", {
      fontFamily: "monospace",
      fontSize: "14px",
      color: "#ffffff",
      backgroundColor: "#253247",
      fontStyle: "bold",
      padding: { x: 10, y: 6 },
    });
    this.summary = scene.add.text(24, 58, "", {
      fontFamily: "monospace",
      fontSize: "12px",
      color: "#ffffff",
      backgroundColor: "#334155",
      padding: { x: 10, y: 5 },
    });
    this.action = scene.add.text(24, 91, "", {
      fontFamily: "monospace",
      fontSize: "12px",
      color: "#253247",
      backgroundColor: "#f4c85d",
      fontStyle: "bold",
      padding: { x: 10, y: 5 },
    });

    this.title.setScrollFactor(0).setDepth(2000).setVisible(false);
    this.summary.setScrollFactor(0).setDepth(2000).setVisible(false);
    this.action.setScrollFactor(0).setDepth(2000).setVisible(false);
  }

  update(building: CityBuildingDefinition | undefined, operationStatus?: CityProjectOperationStatus) {
    if (!building) {
      this.title.setVisible(false);
      this.summary.setVisible(false);
      this.action.setVisible(false);
      return;
    }

    const canEnter = building.active && building.destination.enabled && operationStatus?.mutationDisabled !== true;
    const portfolioSummary = operationStatus?.portfolioSummary;
    this.title.setText(portfolioSummary?.companyName ?? building.name).setVisible(true);
    this.summary
      .setText(createSummaryText(building, operationStatus))
      .setVisible(true);
    this.action.setText(canEnter ? "Press Space to enter" : "Coming soon").setVisible(true);
  }

  destroy() {
    this.title.destroy();
    this.summary.destroy();
    this.action.destroy();
  }
}

function createSummaryText(building: CityBuildingDefinition, operationStatus: CityProjectOperationStatus | undefined) {
  if (!operationStatus) return building.projectBinding?.projectId ? `Project ${building.projectBinding.projectId}` : "Project unavailable";

  const summary = operationStatus.portfolioSummary;
  const parts = [
    summary.projectId ? `Project ${summary.projectId}` : "Project unavailable",
    summary.attentionLabel,
    summary.activeOrResumableRunId ? `Run ${compact(summary.activeOrResumableRunId, 24)}` : undefined,
    summary.developmentRequest ? `Request ${summary.developmentRequest.status}` : "No request",
    summary.blockedReasonSummary ? `Reason ${compact(summary.blockedReasonSummary, 32)}` : undefined,
  ].filter(Boolean);

  return parts.join(" | ");
}

function compact(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, Math.max(maxLength - 3, 0))}...`;
}
