import type Phaser from "phaser";
import type { PhaserScene } from "../../shared/phaserTypes";
import type { EmployeeNpcPositionHint, EmployeeNpcViewModel } from "./EmployeeNpcTypes";

type RenderedEmployeeNpc = {
  container: Phaser.GameObjects.Container;
  body: Phaser.GameObjects.Rectangle;
  nameText: Phaser.GameObjects.Text;
  stateText: Phaser.GameObjects.Text;
};

const DEFAULT_STYLE = {
  fillColor: 0x64748b,
  borderColor: 0xe2e8f0,
  labelColor: "#f8fafc",
};

const ZONE_ANCHORS: Record<EmployeeNpcPositionHint["zone"], { x: number; y: number }> = {
  desk: { x: 248, y: 182 },
  collaboration: { x: 328, y: 202 },
  review: { x: 288, y: 146 },
  idle: { x: 210, y: 232 },
  entrance: { x: 160, y: 270 },
  workstation: { x: 248, y: 182 },
  meetingArea: { x: 328, y: 202 },
  breakArea: { x: 288, y: 146 },
  idleSpot: { x: 210, y: 232 },
};

const SLOT_OFFSETS = [
  { x: 0, y: 0 },
  { x: 44, y: 0 },
  { x: 0, y: 54 },
  { x: 44, y: 54 },
  { x: 88, y: 0 },
  { x: 88, y: 54 },
];

export class OfficeEmployeeNpcRenderer {
  private readonly renderedNpcs = new Map<string, RenderedEmployeeNpc>();

  constructor(private readonly scene: PhaserScene) {}

  render(viewModels: EmployeeNpcViewModel[]) {
    const visibleEmployeeIds = new Set(viewModels.map((viewModel) => viewModel.employeeId));

    Array.from(this.renderedNpcs.entries()).forEach(([employeeId, renderedNpc]) => {
      if (!visibleEmployeeIds.has(employeeId)) {
        renderedNpc.container.destroy(true);
        this.renderedNpcs.delete(employeeId);
      }
    });

    viewModels.forEach((viewModel) => this.renderNpc(viewModel));
  }

  destroy() {
    Array.from(this.renderedNpcs.values()).forEach((renderedNpc) => {
      renderedNpc.container.destroy(true);
    });

    this.renderedNpcs.clear();
  }

  private renderNpc(viewModel: EmployeeNpcViewModel) {
    const existingNpc = this.renderedNpcs.get(viewModel.employeeId);
    const renderedNpc = existingNpc ?? this.createNpc(viewModel);
    const targetPosition = resolveNpcPosition(viewModel.positionHint);
    const position = existingNpc && viewModel.movementState === "moving"
      ? interpolatePosition(renderedNpc.container.x, renderedNpc.container.y, targetPosition)
      : targetPosition;
    const style = viewModel.placeholderStyle ?? DEFAULT_STYLE;

    renderedNpc.container.setPosition(position.x, position.y);
    renderedNpc.container.setDepth(1100);
    renderedNpc.body.setFillStyle(style.fillColor, 1);
    renderedNpc.body.setStrokeStyle(2, style.borderColor, 1);
    renderedNpc.nameText.setText(viewModel.displayName);
    renderedNpc.nameText.setColor(style.labelColor);
    renderedNpc.stateText.setText(formatStateLabel(viewModel));
    renderedNpc.stateText.setColor(style.labelColor);
  }

  private createNpc(viewModel: EmployeeNpcViewModel) {
    const body = this.scene.add.rectangle(0, 0, 22, 26, DEFAULT_STYLE.fillColor, 1);
    body.setStrokeStyle(2, DEFAULT_STYLE.borderColor, 1);

    const nameText = this.scene.add.text(0, 22, viewModel.displayName, {
      fontFamily: "monospace",
      fontSize: "10px",
      color: DEFAULT_STYLE.labelColor,
      backgroundColor: "#0f172a",
      padding: { x: 3, y: 1 },
      align: "center",
    });
    nameText.setOrigin(0.5, 0);

    const stateText = this.scene.add.text(0, 36, formatStateLabel(viewModel), {
      fontFamily: "monospace",
      fontSize: "9px",
      color: DEFAULT_STYLE.labelColor,
      backgroundColor: "#1e293b",
      padding: { x: 3, y: 1 },
      align: "center",
    });
    stateText.setOrigin(0.5, 0);

    const container = this.scene.add.container(0, 0, [body, nameText, stateText]);
    const renderedNpc = { container, body, nameText, stateText };
    this.renderedNpcs.set(viewModel.employeeId, renderedNpc);
    return renderedNpc;
  }
}

function resolveNpcPosition(positionHint: EmployeeNpcPositionHint) {
  const anchor = ZONE_ANCHORS[positionHint.zone];
  const offset = SLOT_OFFSETS[positionHint.slot % SLOT_OFFSETS.length] ?? SLOT_OFFSETS[0];
  return {
    x: anchor.x + offset.x,
    y: anchor.y + offset.y,
  };
}

function interpolatePosition(currentX: number, currentY: number, target: { x: number; y: number }) {
  return {
    x: currentX + (target.x - currentX) * 0.18,
    y: currentY + (target.y - currentY) * 0.18,
  };
}

function formatStateLabel(viewModel: EmployeeNpcViewModel) {
  if (viewModel.currentTaskTitle) {
    return `${viewModel.displayLabel}: ${truncate(viewModel.currentTaskTitle, 24)}`;
  }

  return viewModel.displayLabel;
}

function truncate(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, Math.max(maxLength - 1, 0))}...`;
}
