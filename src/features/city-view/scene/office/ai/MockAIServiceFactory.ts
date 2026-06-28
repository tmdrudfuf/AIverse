import { AIService } from "./AIService";
import { MockAIProvider } from "./MockAIProvider";

export function createMockAIService() {
  return new AIService(new MockAIProvider());
}