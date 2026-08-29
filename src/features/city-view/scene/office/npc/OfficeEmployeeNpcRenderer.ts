import type Phaser from "phaser";
import type { PhaserScene } from "../../shared/phaserTypes";
import type { EmployeeNpcViewModel } from "./EmployeeNpcTypes";
import { resolveEmployeeNpcWorldPosition } from "./EmployeeNpcPositionResolver";

type RenderedEmployeeNpc = {
  container: Phaser.GameObjects.Container;
  body: Phaser.GameObjects.Rectangle;
  workIndicator: Phaser.GameObjects.Rectangle;
  nameText: Phaser.GameObjects.Text;
  stateText: Phaser.GameObjects.Text;
};

const DEFAULT_STYLE = {
  fillColor: 0x64748b,
  borderColor: 0xe2e8f0,
  labelColor: "#f8fafc",
};

const TONE_STYLE = {
  active: {
    stateBackground: "#14532d",
    indicatorColor: 0x22c55e,
  },
  warning: {
    stateBackground: "#7f1d1d",
    indicatorColor: 0xf59e0b,
  },
  complete: {
    stateBackground: "#164e63",
    indicatorColor: 0x38bdf8,
  },
  idle: {
    stateBackground: "#1e293b",
    indicatorColor: 0x94a3b8,
  },
};

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

    const labelOffsets = createLabelOffsets(viewModels);
    viewModels.forEach((viewModel) => this.renderNpc(viewModel, labelOffsets.get(viewModel.employeeId) ?? DEFAULT_LABEL_OFFSET));
  }

  destroy() {
    Array.from(this.renderedNpcs.values()).forEach((renderedNpc) => {
      renderedNpc.container.destroy(true);
    });

    this.renderedNpcs.clear();
  }

  private renderNpc(viewModel: EmployeeNpcViewModel, labelOffset: LabelOffset) {
    const existingNpc = this.renderedNpcs.get(viewModel.employeeId);
    const renderedNpc = existingNpc ?? this.createNpc(viewModel);
    const targetPosition = resolveEmployeeNpcWorldPosition(viewModel.positionHint);
    const position = existingNpc && viewModel.movementState === "moving"
      ? interpolatePosition(renderedNpc.container.x, renderedNpc.container.y, targetPosition)
      : targetPosition;
    const style = viewModel.placeholderStyle ?? DEFAULT_STYLE;

    renderedNpc.container.setPosition(position.x, position.y);
    renderedNpc.container.setDepth(1100);
    renderedNpc.body.setFillStyle(style.fillColor, 1);
    renderedNpc.body.setStrokeStyle(2, style.borderColor, 1);
    updateWorkIndicator(renderedNpc.workIndicator, viewModel, getSceneTime(this.scene));
    renderedNpc.nameText.setPosition(labelOffset.x, labelOffset.y);
    renderedNpc.nameText.setText(viewModel.displayName);
    renderedNpc.nameText.setColor(style.labelColor);
    renderedNpc.stateText.setPosition(labelOffset.x, labelOffset.y + 14);
    renderedNpc.stateText.setText(formatStateLabel(viewModel));
    renderedNpc.stateText.setColor(style.labelColor);
    setTextBackground(renderedNpc.stateText, TONE_STYLE[viewModel.visualTone ?? "idle"].stateBackground);
  }

  private createNpc(viewModel: EmployeeNpcViewModel) {
    const body = this.scene.add.rectangle(0, 0, 22, 26, DEFAULT_STYLE.fillColor, 1);
    body.setStrokeStyle(2, DEFAULT_STYLE.borderColor, 1);

    const workIndicator = this.scene.add.rectangle(14, -10, 8, 8, 0x22c55e, 0);
    workIndicator.setVisible(false);

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

    const container = this.scene.add.container(0, 0, [body, workIndicator, nameText, stateText]);
    const renderedNpc = { container, body, workIndicator, nameText, stateText };
    this.renderedNpcs.set(viewModel.employeeId, renderedNpc);
    return renderedNpc;
  }
}

type LabelOffset = {
  x: number;
  y: number;
};

const DEFAULT_LABEL_OFFSET: LabelOffset = { x: 0, y: 22 };

const CLUSTER_DISTANCE = 58;
const LABEL_OFFSETS: LabelOffset[] = [
  { x: 0, y: 22 },
  { x: -42, y: 6 },
  { x: 42, y: 6 },
  { x: -42, y: 42 },
  { x: 42, y: 42 },
];

function createLabelOffsets(viewModels: ReadonlyArray<EmployeeNpcViewModel>): Map<string, LabelOffset> {
  const sortedViewModels = [...viewModels].sort((left, right) => left.employeeId.localeCompare(right.employeeId));
  const placedLabels: Array<{ position: { x: number; y: number }; offset: LabelOffset }> = [];
  const offsetsByEmployeeId = new Map<string, LabelOffset>();

  sortedViewModels.forEach((viewModel) => {
    const position = resolveEmployeeNpcWorldPosition(viewModel.positionHint);
    const nearbyLabelCount = placedLabels.filter((label) => getDistance(position, label.position) <= CLUSTER_DISTANCE).length;
    const offset = LABEL_OFFSETS[Math.min(nearbyLabelCount, LABEL_OFFSETS.length - 1)];

    placedLabels.push({ position, offset });
    offsetsByEmployeeId.set(viewModel.employeeId, offset);
  });

  return offsetsByEmployeeId;
}

function getDistance(left: { x: number; y: number }, right: { x: number; y: number }) {
  return Math.hypot(left.x - right.x, left.y - right.y);
}

function interpolatePosition(currentX: number, currentY: number, target: { x: number; y: number }) {
  return {
    x: currentX + (target.x - currentX) * 0.18,
    y: currentY + (target.y - currentY) * 0.18,
  };
}

function formatStateLabel(viewModel: EmployeeNpcViewModel) {
  if (viewModel.visualTone) {
    return viewModel.displayLabel;
  }

  if (viewModel.currentTaskTitle) {
    return `${viewModel.displayLabel}: ${truncate(viewModel.currentTaskTitle, 24)}`;
  }

  return viewModel.displayLabel;
}

function updateWorkIndicator(
  workIndicator: Phaser.GameObjects.Rectangle,
  viewModel: EmployeeNpcViewModel,
  sceneTimeMs: number,
) {
  const tone = viewModel.visualTone ?? (viewModel.workAnimation?.active ? "active" : "idle");
  const shouldShowToneIndicator = tone === "warning" || tone === "complete";
  if (!viewModel.workAnimation?.active && !shouldShowToneIndicator) {
    workIndicator.setVisible(false);
    workIndicator.setFillStyle(0x22c55e, 0);
    return;
  }

  const pulseSeed = getStablePulseSeed(viewModel.employeeId);
  const alpha = shouldShowToneIndicator ? 0.9 : 0.55 + Math.abs(Math.sin((sceneTimeMs + pulseSeed) / 180)) * 0.35;
  workIndicator
    .setPosition(14, -10)
    .setVisible(true)
    .setFillStyle(TONE_STYLE[tone].indicatorColor, alpha);
}

function getSceneTime(scene: PhaserScene) {
  return typeof scene.time?.now === "number" ? scene.time.now : 0;
}

function getStablePulseSeed(value: string) {
  return Array.from(value).reduce((seed, character) => seed + character.charCodeAt(0), 0);
}

function truncate(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, Math.max(maxLength - 1, 0))}...`;
}

function setTextBackground(text: Phaser.GameObjects.Text, backgroundColor: string) {
  const style = text.style as { setBackgroundColor?: (value: string) => unknown } | undefined;
  style?.setBackgroundColor?.(backgroundColor);
}
