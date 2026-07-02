import type Phaser from "phaser";
import type { PhaserScene } from "../../shared/phaserTypes";
import type { EmployeeKnowledgeViewModel } from "./EmployeeKnowledgeTypes";

type KnowledgeRow = {
  label: string;
  value: string;
};

type OverlayObject = Phaser.GameObjects.Rectangle | Phaser.GameObjects.Text;

const CARD_WIDTH = 348;
const CARD_PADDING = 12;
const CARD_X = 326;
const CARD_Y = 18;
const TITLE_Y = 10;
const ROW_START_Y = 42;
const ROW_GAP = 20;
const SECTION_GAP = 8;

export class EmployeeKnowledgeOverlay {
  private readonly background: Phaser.GameObjects.Rectangle;
  private readonly titleText: Phaser.GameObjects.Text;
  private readonly rowTexts: Phaser.GameObjects.Text[] = [];
  private readonly whyText: Phaser.GameObjects.Text;
  private readonly goalText: Phaser.GameObjects.Text;
  private readonly objects: OverlayObject[] = [];

  constructor(private readonly scene: PhaserScene) {
    this.background = scene.add.rectangle(CARD_X, CARD_Y, CARD_WIDTH, 224, 0x111827, 0.92);
    this.background.setOrigin(0, 0);
    this.background.setStrokeStyle(1, 0xa78bfa, 0.88);

    this.titleText = scene.add.text(CARD_X + CARD_PADDING, CARD_Y + TITLE_Y, "", {
      fontFamily: "monospace",
      fontSize: "15px",
      color: "#f8fafc",
      fontStyle: "bold",
    });

    for (let index = 0; index < 8; index += 1) {
      this.rowTexts.push(scene.add.text(CARD_X + CARD_PADDING, CARD_Y + ROW_START_Y + index * ROW_GAP, "", {
        fontFamily: "monospace",
        fontSize: "11px",
        color: "#d1d5db",
      }));
    }

    this.whyText = scene.add.text(CARD_X + CARD_PADDING, CARD_Y + 164, "", {
      fontFamily: "monospace",
      fontSize: "11px",
      color: "#ddd6fe",
      wordWrap: { width: CARD_WIDTH - CARD_PADDING * 2 },
    });

    this.goalText = scene.add.text(CARD_X + CARD_PADDING, CARD_Y + 194, "", {
      fontFamily: "monospace",
      fontSize: "11px",
      color: "#bfdbfe",
      wordWrap: { width: CARD_WIDTH - CARD_PADDING * 2 },
    });

    this.objects.push(
      this.background,
      this.titleText,
      ...this.rowTexts,
      this.whyText,
      this.goalText,
    );
    this.objects.forEach((object) => {
      object.setDepth(5001);
      object.setVisible(false);
    });
  }

  show(viewModel: EmployeeKnowledgeViewModel) {
    this.update(viewModel);
  }

  update(viewModel: EmployeeKnowledgeViewModel) {
    const rows = createRows(viewModel);
    const whyY = ROW_START_Y + rows.length * ROW_GAP + SECTION_GAP;
    const goalY = whyY + 42;
    const cardHeight = goalY + 48;
    const origin = this.getCardOrigin();

    this.background.setPosition(origin.x, origin.y);
    this.background.setSize(CARD_WIDTH, cardHeight);
    this.titleText.setPosition(origin.x + CARD_PADDING, origin.y + TITLE_Y);
    this.titleText.setText(`${viewModel.name} Knowledge`);

    this.rowTexts.forEach((text, index) => {
      const row = rows[index];
      text.setPosition(origin.x + CARD_PADDING, origin.y + ROW_START_Y + index * ROW_GAP);
      text.setVisible(Boolean(row));
      text.setText(row ? `${row.label}: ${row.value}` : "");
    });

    this.whyText.setPosition(origin.x + CARD_PADDING, origin.y + whyY);
    this.whyText.setText(`Why: ${viewModel.whyText}`);
    this.goalText.setPosition(origin.x + CARD_PADDING, origin.y + goalY);
    this.goalText.setText(`Goal: ${viewModel.currentGoalText}`);

    this.setVisible(true);
  }

  hide() {
    this.setVisible(false);
  }

  destroy() {
    this.objects.forEach((object) => object.destroy());
  }

  private setVisible(isVisible: boolean) {
    this.objects.forEach((object) => object.setVisible(isVisible));
  }

  private getCardOrigin() {
    const camera = this.scene.cameras.main;
    const zoom = camera.zoom || 1;

    return {
      x: camera.scrollX + CARD_X / zoom,
      y: camera.scrollY + CARD_Y / zoom,
    };
  }
}

function createRows(viewModel: EmployeeKnowledgeViewModel): KnowledgeRow[] {
  const scheduleLabel = viewModel.scheduleSummary
    ? viewModel.scheduleSummary.currentBlockLabel ?? viewModel.scheduleSummary.currentScheduleState
    : undefined;

  return [
    { label: "Role", value: viewModel.roleLabel },
    { label: "State", value: viewModel.aiStateLabel },
    { label: "Task", value: viewModel.taskLabel },
    { label: "Progress", value: viewModel.progressLabel },
    { label: "Project", value: viewModel.projectLabel },
    ...(scheduleLabel ? [{ label: "Schedule", value: scheduleLabel }] : []),
    ...(viewModel.plannedNextActivityText ? [{ label: "Next", value: viewModel.plannedNextActivityText }] : []),
  ];
}
