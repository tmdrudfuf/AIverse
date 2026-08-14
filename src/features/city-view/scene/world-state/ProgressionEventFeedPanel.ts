import type { PhaserScene } from "../shared/phaserTypes";
import type { WorldEventFeedState, WorldStateSnapshot } from "./WorldStateTypes";

const PANEL_X = 836;
const PANEL_Y = 24;
const PANEL_WIDTH = 340;
const PANEL_HEIGHT = 164;
const PANEL_DEPTH = 2100;
const MAX_VISIBLE_ROWS = 3;
const MAX_DETAIL_LENGTH = 86;

export type ProgressionEventFeedPanelRow = {
  id: string;
  title: string;
  detail: string;
};

export class ProgressionEventFeedPanel {
  private readonly background: Phaser.GameObjects.Graphics;
  private readonly title: Phaser.GameObjects.Text;
  private readonly rows: Phaser.GameObjects.Text[];

  constructor(scene: PhaserScene) {
    this.background = scene.add.graphics().setScrollFactor(0).setDepth(PANEL_DEPTH).setVisible(false);
    this.title = scene.add
      .text(PANEL_X + 16, PANEL_Y + 14, "Company Progression", {
        fontFamily: "monospace",
        fontSize: "13px",
        color: "#f8fafc",
        fontStyle: "bold",
      })
      .setScrollFactor(0)
      .setDepth(PANEL_DEPTH + 1)
      .setVisible(false);

    this.rows = Array.from({ length: MAX_VISIBLE_ROWS }, (_, index) =>
      scene.add
        .text(PANEL_X + 16, PANEL_Y + 42 + index * 36, "", {
          fontFamily: "monospace",
          fontSize: "11px",
          color: "#e2e8f0",
          lineSpacing: 2,
          wordWrap: { width: PANEL_WIDTH - 32, useAdvancedWrap: true },
        })
        .setScrollFactor(0)
        .setDepth(PANEL_DEPTH + 1)
        .setVisible(false),
    );

    this.drawBackground();
  }

  update(snapshot?: WorldStateSnapshot) {
    const displayRows = createProgressionEventFeedPanelRows(snapshot?.eventFeed ?? []);

    if (displayRows.length === 0) {
      this.setVisible(false);
      return;
    }

    this.setVisible(true);
    this.rows.forEach((rowText, index) => {
      const row = displayRows[index];
      rowText.setText(row ? `${row.title}\n${row.detail}` : "").setVisible(Boolean(row));
    });
  }

  destroy() {
    this.background.destroy();
    this.title.destroy();
    this.rows.forEach((row) => row.destroy());
  }

  private setVisible(visible: boolean) {
    this.background.setVisible(visible);
    this.title.setVisible(visible);
    this.rows.forEach((row) => {
      row.setVisible(visible && row.text.length > 0);
      if (!visible) row.setText("");
    });
  }

  private drawBackground() {
    this.background.clear();
    this.background.fillStyle(0x0b0f14, 0.78);
    this.background.fillRoundedRect(PANEL_X, PANEL_Y, PANEL_WIDTH, PANEL_HEIGHT, 5);
    this.background.lineStyle(1, 0xcbd5e1, 0.34);
    this.background.strokeRoundedRect(PANEL_X, PANEL_Y, PANEL_WIDTH, PANEL_HEIGHT, 5);
    this.background.lineStyle(1, 0xffffff, 0.12);
    this.background.lineBetween(PANEL_X + 8, PANEL_Y + 8, PANEL_X + PANEL_WIDTH - 8, PANEL_Y + 8);
  }
}

export function createProgressionEventFeedPanelRows(
  eventFeed: ReadonlyArray<WorldEventFeedState>,
): ProgressionEventFeedPanelRow[] {
  return eventFeed.slice(Math.max(0, eventFeed.length - MAX_VISIBLE_ROWS)).map((event) => ({
    id: event.eventId,
    title: `Level ${event.toLevel} reached: ${formatStage(event.companyStage)}`,
    detail: truncateDetail(`${formatUnlockedZones(event.unlockedOfficeZones)}; ${formatMilestones(event.milestoneIds)}`),
  }));
}

function formatStage(stage: string) {
  return stage
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatUnlockedZones(zones: ReadonlyArray<string>) {
  if (zones.length === 0) return "No new zones";

  const names = zones.slice(0, 2).map(formatStage);
  const remaining = zones.length - names.length;
  return remaining > 0 ? `Zones: ${names.join(", ")} +${remaining} more` : `Zones: ${names.join(", ")}`;
}

function formatMilestones(milestoneIds: ReadonlyArray<string>) {
  if (milestoneIds.length === 0) return "0 milestones";
  if (milestoneIds.length === 1) return "1 milestone";
  return `${milestoneIds.length} milestones`;
}

function truncateDetail(detail: string) {
  if (detail.length <= MAX_DETAIL_LENGTH) return detail;
  return `${detail.slice(0, MAX_DETAIL_LENGTH - 3)}...`;
}
