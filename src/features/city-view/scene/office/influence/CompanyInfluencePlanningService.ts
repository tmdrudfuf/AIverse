import type {
  CompanyFocusId,
  CompanyFocusOption,
  CompanyFocusSummary,
  CompanyInfluencePlanState,
} from "./CompanyInfluencePlanningTypes";

const UNSET_FOCUS_SUMMARY = "No company focus selected. The company is observing current conditions.";

const COMPANY_FOCUS_OPTIONS: CompanyFocusOption[] = [
  {
    id: "delivery-speed",
    label: "Improve delivery speed",
    description: "Favor advisory summaries that call attention to throughput and unfinished delivery work.",
    advisorySummary: "Current focus: improve delivery speed through clearer attention to throughput signals.",
    futureMetadataTags: ["delivery", "throughput"],
  },
  {
    id: "quality",
    label: "Improve quality",
    description: "Favor advisory summaries that call attention to review, defects, and confidence signals.",
    advisorySummary: "Current focus: improve quality by watching review and reliability signals.",
    futureMetadataTags: ["quality", "review"],
  },
  {
    id: "team-morale",
    label: "Improve team morale",
    description: "Favor advisory summaries that call attention to workload, mood, and employee balance.",
    advisorySummary: "Current focus: improve team morale by watching workload and employee signals.",
    futureMetadataTags: ["morale", "workload"],
  },
  {
    id: "project-risk",
    label: "Reduce project risk",
    description: "Favor advisory summaries that call attention to blockers, critical work, and risk indicators.",
    advisorySummary: "Current focus: reduce project risk by watching blockers and critical work.",
    futureMetadataTags: ["risk", "blockers"],
  },
  {
    id: "company-growth",
    label: "Prepare for company growth",
    description: "Favor advisory summaries that call attention to capacity, hiring readiness, and scale signals.",
    advisorySummary: "Current focus: prepare for company growth by watching capacity and scaling signals.",
    futureMetadataTags: ["growth", "capacity"],
  },
];

export class CompanyInfluencePlanningService {
  getFocusOptions(): CompanyFocusOption[] {
    return COMPANY_FOCUS_OPTIONS.map((option) => ({
      ...option,
      futureMetadataTags: [...option.futureMetadataTags],
    }));
  }

  createInitialState(): CompanyInfluencePlanState {
    return {};
  }

  selectFocus(
    state: CompanyInfluencePlanState,
    focusId: string,
    updatedAt?: string,
  ): CompanyInfluencePlanState {
    if (!isCompanyFocusId(focusId)) return { ...state };

    if (state.selectedFocusId === focusId) {
      return updatedAt && state.updatedAt !== updatedAt ? { ...state, updatedAt } : { ...state };
    }

    return {
      selectedFocusId: focusId,
      updatedAt,
    };
  }

  createFocusSummary(state: CompanyInfluencePlanState): CompanyFocusSummary {
    const options = this.getFocusOptions();
    const currentFocus = state.selectedFocusId
      ? options.find((option) => option.id === state.selectedFocusId)
      : undefined;

    return {
      isSet: Boolean(currentFocus),
      currentFocus,
      options,
      summary: currentFocus?.advisorySummary ?? UNSET_FOCUS_SUMMARY,
    };
  }
}

export function isCompanyFocusId(value: string): value is CompanyFocusId {
  return COMPANY_FOCUS_OPTIONS.some((option) => option.id === value);
}
