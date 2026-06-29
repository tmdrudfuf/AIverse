import type {
  EmployeeConversation,
  EmployeeConversationContext,
  EmployeeConversationViewModel,
  EmployeeDialogueType,
} from "./EmployeeConversationTypes";

const DEFAULT_DISPLAY_DURATION_MS = 3200;

export class EmployeeConversationService {
  createConversation(context: EmployeeConversationContext): EmployeeConversation | undefined {
    const employeeId = context.employee?.id ?? context.simulationSnapshot?.employeeId;
    if (!employeeId) return undefined;

    const speakerName = context.employee?.name ?? employeeId;
    const dialogueType = getDialogueType(context);
    const timestamp = context.timestamp ?? createConversationTimestamp(employeeId, dialogueType);

    return {
      employeeId,
      conversationId: `${employeeId}-${dialogueType}-${sanitizeTimestamp(timestamp)}`,
      speakerName,
      dialogueText: createDialogueText(dialogueType, speakerName, context),
      dialogueType,
      sourceState: getSourceState(dialogueType, context),
      currentTaskTitle: context.currentTask?.title,
      timestamp,
    };
  }

  createConversationViewModel(
    conversation: EmployeeConversation,
    positionHint?: EmployeeConversationViewModel["positionHint"],
  ): EmployeeConversationViewModel {
    return {
      employeeId: conversation.employeeId,
      speakerName: conversation.speakerName,
      dialogueText: conversation.dialogueText,
      dialogueType: conversation.dialogueType,
      displayDurationMs: DEFAULT_DISPLAY_DURATION_MS,
      positionHint: positionHint ? { ...positionHint } : undefined,
    };
  }
}

function getDialogueType(context: EmployeeConversationContext): EmployeeDialogueType {
  if (context.simulationSnapshot?.currentState === "working") return "working";
  if (context.simulationSnapshot?.currentState === "assigned") return "assigned";
  if (context.simulationSnapshot?.currentState === "unavailable") return "unavailable";
  if (context.scheduleSnapshot?.scheduleState === "inMeeting") return "unavailable";

  if (context.scheduleSnapshot?.scheduleState === "onBreak" || context.scheduleSnapshot?.scheduleState === "atLunch") {
    return "break";
  }

  if (context.projectName && context.workstationSnapshot?.state === "occupied") return "projectStatus";
  if (context.scheduleSnapshot?.scheduleState === "arriving") return "greeting";
  return "idle";
}

function getSourceState(dialogueType: EmployeeDialogueType, context: EmployeeConversationContext) {
  if (dialogueType === "projectStatus") return "projectStatus";
  if (dialogueType === "break") return context.scheduleSnapshot?.scheduleState ?? context.simulationSnapshot?.currentState ?? "idle";
  if (dialogueType === "unavailable" && context.scheduleSnapshot?.scheduleState === "inMeeting") return "inMeeting";
  return context.simulationSnapshot?.currentState ?? context.scheduleSnapshot?.scheduleState ?? "idle";
}

function createDialogueText(
  dialogueType: EmployeeDialogueType,
  speakerName: string,
  context: EmployeeConversationContext,
) {
  const taskTitle = context.currentTask?.title;
  const projectName = context.projectName ?? "the project";

  if (dialogueType === "working") {
    return taskTitle ? `I'm working on ${taskTitle}.` : "I'm working through the current task.";
  }

  if (dialogueType === "assigned") {
    return taskTitle ? `I'm getting ready for ${taskTitle}.` : "I'm ready for my assigned task.";
  }

  if (dialogueType === "break") {
    return "I'm taking a short break before getting back to work.";
  }

  if (dialogueType === "unavailable") {
    if (context.scheduleSnapshot?.scheduleState === "inMeeting") return "I'm in a meeting right now.";
    return "I'm unavailable right now.";
  }

  if (dialogueType === "projectStatus") {
    return `I'm keeping ${projectName} moving.`;
  }

  if (dialogueType === "greeting") {
    return `Morning. ${speakerName} reporting in.`;
  }

  return "I'm available if the team needs anything.";
}

function createConversationTimestamp(employeeId: string, dialogueType: EmployeeDialogueType) {
  const stableMinute = (hashStable(`${employeeId}:${dialogueType}`) % 600) + 480;
  const hours = Math.floor(stableMinute / 60) % 24;
  const minutes = stableMinute % 60;
  return new Date(Date.UTC(2026, 0, 1, hours, minutes)).toISOString();
}

function hashStable(value: string) {
  return value.split("").reduce((hash, character) => (hash * 31 + character.charCodeAt(0)) >>> 0, 0);
}

function sanitizeTimestamp(timestamp: string) {
  return timestamp.replace(/[^0-9a-z]/gi, "");
}
