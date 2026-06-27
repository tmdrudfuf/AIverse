import type { PhaserScene } from "../shared/phaserTypes";
import type { OfficeInteractiveAction, OfficeInteractiveObject } from "./officeTypes";

export class OfficeInteractionPrompt {
  private readonly prompt: Phaser.GameObjects.Text;

  constructor(scene: PhaserScene) {
    this.prompt = scene.add
      .text(24, 72, "", {
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

  update(activeObject?: OfficeInteractiveObject) {
    if (!activeObject) {
      this.prompt.setVisible(false);
      return;
    }

    this.prompt.setText(`${activeObject.displayName}\nPress Space to ${getActionVerb(activeObject.action)}`);
    this.prompt.setVisible(true);
  }

  destroy() {
    this.prompt.destroy();
  }
}

function getActionVerb(action: OfficeInteractiveAction) {
  if (action === "use_computer") return "use";
  if (action === "open_workspace") return "open";
  return "inspect";
}
