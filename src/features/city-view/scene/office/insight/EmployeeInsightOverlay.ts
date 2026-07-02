import type Phaser from "phaser";
import type { PhaserScene } from "../../shared/phaserTypes";
import type { EmployeeInsightViewModel } from "./EmployeeInsightTypes";

type InsightRow = {
  label: string;
  value: string;
};

const CARD_WIDTH = 292;
const CARD_PADDING = 12;
const CARD_X = 18;
const CARD_Y = 18;
const TITLE_Y = 10;
const ROW_START_Y = 42;
const ROW_GAP = 20;
const THINKING_GAP = 8;

export class EmployeeInsightOverlay {
  private readonly container: Phaser.GameObjects.Container;
  private readonly background: Phaser.GameObjects.Rectangle;
  private readonly titleText: Phaser.GameObjects.Text;
  private readonly rowTexts: Phaser.GameObjects.Text[] = [];
  private readonly thinkingText: Phaser.GameObjects.Text;

  constructor(private readonly scene: PhaserScene) {
    this.background = scene.add.rectangle(0, 0, CARD_WIDTH, 188, 0x0f172a, 0.9);
    this.background.setOrigin(0, 0);
    this.background.setStrokeStyle(1, 0x38bdf8, 0.9);

    this.titleText = scene.add.text(CARD_PADDING, TITLE_Y, "", {
      fontFamily: "monospace",
      fontSize: "15px",
      color: "#f8fafc",
      fontStyle: "bold",
    });

    for (let index = 0; index < 6; index += 1) {
      this.rowTexts.push(scene.add.text(CARD_PADDING, ROW_START_Y + index * ROW_GAP, "", {
        fontFamily: "monospace",
        fontSize: "11px",
        color: "#cbd5e1",
      }));
    }

    this.thinkingText = scene.add.text(CARD_PADDING, 164, "", {
      fontFamily: "monospace",
      fontSize: "11px",
      color: "#bae6fd",
      wordWrap: { width: CARD_WIDTH - CARD_PADDING * 2 },
    });

    this.container = scene.add.container(CARD_X, CARD_Y, [
      this.background,
      this.titleText,
      ...this.rowTexts,
      this.thinkingText,
    ]);
    this.container.setDepth(5000);
    this.container.setScrollFactor(0);
    this.container.setVisible(false);
  }

  show(viewModel: EmployeeInsightViewModel) {
    this.update(viewModel);
    this.container.setVisible(true);
  }

  update(viewModel: EmployeeInsightViewModel) {
    const rows = createRows(viewModel);
    const thinkingY = ROW_START_Y + rows.length * ROW_GAP + THINKING_GAP;
    const cardHeight = thinkingY + 48;

    this.background.setSize(CARD_WIDTH, cardHeight);
    this.titleText.setText(viewModel.titleName);
    this.thinkingText.setPosition(CARD_PADDING, thinkingY);
    this.thinkingText.setText(`Thinking: ${viewModel.thinkingText}`);

    this.rowTexts.forEach((text, index) => {
      const row = rows[index];
      text.setVisible(Boolean(row));
      text.setText(row ? `${row.label}: ${row.value}` : "");
    });

    this.container.setVisible(true);
  }

  hide() {
    this.container.setVisible(false);
  }

  destroy() {
    this.container.destroy(true);
  }
}

function createRows(viewModel: EmployeeInsightViewModel): InsightRow[] {
  return [
    { label: "Role", value: viewModel.roleLabel },
    { label: "State", value: viewModel.aiStateLabel },
    { label: "Task", value: viewModel.taskLabel },
    { label: "Progress", value: viewModel.progressLabel },
    { label: "Project", value: viewModel.projectLabel },
    ...(viewModel.moodLabel ? [{ label: "Mood", value: viewModel.moodLabel }] : []),
  ];
}
