import type { ReviewPromotionTimeline } from "./ReviewDecisionTypes";

export type ReviewPromotionTimelineDisplayRows = {
  statusText: string;
};

export function createReviewPromotionTimelineDisplayRows(
  timeline: ReviewPromotionTimeline | undefined,
): ReviewPromotionTimelineDisplayRows {
  if (!timeline || timeline.eventCount === 0) {
    return { statusText: "No promotion history" };
  }

  const currentEvent = [...timeline.events].reverse().find((event) => event.current);
  const historicalCount = timeline.events.filter((event) => event.historical).length;
  const blockedCount = timeline.events.filter((event) => event.status === "Blocked").length;
  const latestEvent = timeline.events[timeline.events.length - 1];
  const currentText = currentEvent
    ? (currentEvent.status === "AlreadyPromoted" ? "current already promoted" : "current granted")
    : "no current promotion";
  const historyText = historicalCount === 1 ? "1 historical" : `${historicalCount} historical`;
  const blockedText = blockedCount > 0 ? `; ${blockedCount} blocked` : "";
  const latestText = latestEvent ? `; latest ${formatTimelineEventStatus(latestEvent.status)}` : "";

  return {
    statusText: `${timeline.eventCount} event(s); ${currentText}; ${historyText}${blockedText}${latestText}; no mutation`,
  };
}

function formatTimelineEventStatus(status: ReviewPromotionTimeline["events"][number]["status"]) {
  switch (status) {
    case "AlreadyPromoted":
      return "already promoted";
    case "Granted":
      return "granted";
    case "Blocked":
    default:
      return "blocked";
  }
}
