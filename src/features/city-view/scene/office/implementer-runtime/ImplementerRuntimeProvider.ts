import type { ImplementerRuntimeEvidence, ImplementerRuntimeStatus } from "./ImplementerRuntimeTypes";

export type ImplementerRuntimeProviderCommand = {
  command: string;
  arguments: ReadonlyArray<string>;
  inputMode: "argument" | "stdin";
  workingDirectory: string;
  prompt: string;
  files?: ReadonlyArray<{
    relativePath: string;
    content: string;
  }>;
  timeoutMs: number;
};

export type ImplementerRuntimeProviderResult = {
  status: ImplementerRuntimeStatus;
  evidence: ImplementerRuntimeEvidence;
};

/**
 * Provider-neutral boundary for invoking an Implementer agent process.
 * No mutation methods exist on this contract by design -- only a single,
 * bounded, terminal invocation.
 */
export type ImplementerRuntimeProvider = {
  readonly providerId: string;
  invoke(command: ImplementerRuntimeProviderCommand): Promise<ImplementerRuntimeProviderResult>;
};
