import type Phaser from "phaser";
import type { PhaserScene } from "../../shared/phaserTypes";
import { resolveEmployeeNpcWorldPosition } from "../npc/EmployeeNpcPositionResolver";
import type { EmployeeConversationViewModel } from "./EmployeeConversationTypes";

type BubbleObject = Phaser.GameObjects.Rectangle | Phaser.GameObjects.Text;

const BUBBLE_WIDTH = 260;
const BUBBLE_MIN_HEIGHT = 74;
const BUBBLE_PADDING = 10;
const BUBBLE_OFFSET_Y = -78;

export class EmployeeConversationBubbleOverlay {
  private readonly background: Phaser.GameObjects.Rectangle;
  private readonly speakerText: Phaser.GameObjects.Text;
  private readonly dialogueText: Phaser.GameObjects.Text;
  private readonly objects: BubbleObject[] = [];
  private visibleUntilMs = 0;

  constructor(private readonly scene: PhaserScene) {
    this.background = scene.add.rectangle(0, 0, BUBBLE_WIDTH, BUBBLE_MIN_HEIGHT, 0x111827, 0.94);
    this.background.setOrigin(0.5, 1);
    this.background.setStrokeStyle(1, 0xfbbf24, 0.95);

    this.speakerText = scene.add.text(0, 0, "", {
      fontFamily: "monospace",
      fontSize: "11px",
      color: "#fde68a",
      fontStyle: "bold",
    });
    this.speakerText.setOrigin(0.5, 1);

    this.dialogueText = scene.add.text(0, 0, "", {
      fontFamily: "monospace",
      fontSize: "12px",
      color: "#f8fafc",
      align: "center",
      wordWrap: { width: BUBBLE_WIDTH - BUBBLE_PADDING * 2 },
    });
    this.dialogueText.setOrigin(0.5, 0);

    this.objects.push(this.background, this.speakerText, this.dialogueText);
    this.objects.forEach((object) => {
      object.setDepth(5100);
      object.setVisible(false);
    });
  }

  show(viewModel: EmployeeConversationViewModel, nowMs: number) {
    this.visibleUntilMs = nowMs + viewModel.displayDurationMs;
    const origin = getBubbleOrigin(viewModel);

    this.background.setPosition(origin.x, origin.y);
    this.speakerText.setPosition(origin.x, origin.y - BUBBLE_MIN_HEIGHT + 22);
    this.speakerText.setText(viewModel.speakerName);
    this.dialogueText.setPosition(origin.x, origin.y - BUBBLE_MIN_HEIGHT + 30);
    this.dialogueText.setText(viewModel.dialogueText);
    this.setVisible(true);
  }

  update(nowMs: number) {
    if (this.visibleUntilMs > 0 && nowMs >= this.visibleUntilMs) {
      this.hide();
    }
  }

  hide() {
    this.visibleUntilMs = 0;
    this.setVisible(false);
  }

  destroy() {
    this.objects.forEach((object) => object.destroy());
  }

  private setVisible(isVisible: boolean) {
    this.objects.forEach((object) => object.setVisible(isVisible));
  }
}

function getBubbleOrigin(viewModel: EmployeeConversationViewModel) {
  if (!viewModel.positionHint) {
    return {
      x: 0,
      y: 0,
    };
  }

  const position = resolveEmployeeNpcWorldPosition(viewModel.positionHint);
  return {
    x: position.x,
    y: position.y + BUBBLE_OFFSET_Y,
  };
}
