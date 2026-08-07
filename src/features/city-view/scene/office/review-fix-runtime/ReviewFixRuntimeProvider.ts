import type { ImplementerRuntimeProvider, ImplementerRuntimeProviderCommand } from "../implementer-runtime/ImplementerRuntimeProvider";
import type { ReviewFixRuntimeEvidence, ReviewFixRuntimeStatus } from "./ReviewFixRuntimeTypes";

export type ReviewFixRuntimeProviderCommand = ImplementerRuntimeProviderCommand;

export type ReviewFixRuntimeProviderResult = {
  status: ReviewFixRuntimeStatus;
  evidence: ReviewFixRuntimeEvidence;
};

export type ReviewFixRuntimeProvider = {
  readonly providerId: string;
  invoke(command: ReviewFixRuntimeProviderCommand): Promise<ReviewFixRuntimeProviderResult>;
};

export class ImplementerReviewFixRuntimeProvider implements ReviewFixRuntimeProvider {
  readonly providerId = "implementer-review-fix-runtime";

  constructor(private readonly implementerProvider: ImplementerRuntimeProvider) {}

  async invoke(command: ReviewFixRuntimeProviderCommand): Promise<ReviewFixRuntimeProviderResult> {
    const result = await this.implementerProvider.invoke(command);
    return {
      status: result.status === "Cancelled" ? "Failed" : result.status,
      evidence: {
        ...result.evidence,
        providerId: this.providerId,
        role: "ReviewFixRuntime",
      },
    };
  }
}
