import type { CityReturnPayload, OfficeDefinition, OfficeSpawnRequest } from "./officeTypes";
import type { FounderFacingDirection } from "../founder/founderTypes";
import type { Point } from "../shared/geometry";
import type { PhaserScene } from "../shared/phaserTypes";
import {
  copyCompanyProgressionReward,
  copyWorldEventFeedState,
  copyWorldEffectState,
  type WorldEffectState,
  type WorldEventFeedState,
  type WorldRewardState,
} from "../world-state/WorldStateTypes";

export class OfficeExitController {
  private readonly prompt: Phaser.GameObjects.Text;
  private isFounderInExitZone = false;

  constructor(
    private readonly scene: PhaserScene,
    private readonly office: OfficeDefinition,
    private readonly spawnRequest: OfficeSpawnRequest,
  ) {
    this.prompt = scene.add
      .text(24, 24, "Press Space to return to city", {
        backgroundColor: "rgba(37, 50, 71, 0.88)",
        color: "#ffffff",
        fontFamily: "Arial, sans-serif",
        fontSize: "16px",
        padding: { x: 12, y: 8 },
      })
      .setScrollFactor(0)
      .setDepth(1000)
      .setVisible(false);
  }

  update(founderPosition: Point, showPrompt = true) {
    this.isFounderInExitZone = isPointInExitZone(founderPosition, this.office);
    this.prompt.setVisible(showPrompt && this.isFounderInExitZone);
  }

  isExitActive() {
    return this.isFounderInExitZone;
  }

  createReturnPayload(
    currentFacing?: FounderFacingDirection,
    worldEffects: ReadonlyArray<WorldEffectState> = [],
    rewards: ReadonlyArray<WorldRewardState> = [],
    eventFeed: ReadonlyArray<WorldEventFeedState> = [],
  ): CityReturnPayload | undefined {
    if (!this.isFounderInExitZone) return undefined;
    const copiedWorldEffects = worldEffects.map(copyWorldEffectState);
    const copiedRewards = rewards.map(copyCompanyProgressionReward);
    const copiedEventFeed = eventFeed.map(copyWorldEventFeedState);

    return {
      buildingId: this.spawnRequest.buildingId,
      returnPosition: { ...this.spawnRequest.returnPosition },
      returnFacing: currentFacing ?? this.spawnRequest.returnFacing,
      ...(copiedWorldEffects.length > 0 ? { worldEffects: copiedWorldEffects } : {}),
      ...(copiedRewards.length > 0 ? { rewards: copiedRewards } : {}),
      ...(copiedEventFeed.length > 0 ? { eventFeed: copiedEventFeed } : {}),
    };
  }

  destroy() {
    this.prompt.destroy();
    this.isFounderInExitZone = false;
  }
}

function isPointInExitZone(point: Point, office: OfficeDefinition) {
  const zone = office.exitZone;
  return point.x >= zone.x && point.x <= zone.x + zone.width && point.y >= zone.y && point.y <= zone.y + zone.height;
}
