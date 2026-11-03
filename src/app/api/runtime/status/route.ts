import { NextResponse } from "next/server";

export const runtime = "nodejs";

const IMPLEMENTER_SPAWN_ALLOW_ENV_VAR = "AIVERSE_ALLOW_IMPLEMENTER_RUNTIME_SPAWN";
const REVIEWER_SPAWN_ALLOW_ENV_VAR = "AIVERSE_ALLOW_REVIEWER_RUNTIME_SPAWN";

export type RuntimeBridgeStatusResponse = {
  implementerEnabled: boolean;
  reviewerEnabled: boolean;
};

/**
 * Reports whether real execution is enabled on this machine, per role, by
 * checking the two independent spawn-allow env vars server-side. Never
 * returns the raw environment -- only the derived booleans (FR-002/FR-003).
 */
export async function GET(): Promise<NextResponse<RuntimeBridgeStatusResponse>> {
  return NextResponse.json({
    implementerEnabled: process.env[IMPLEMENTER_SPAWN_ALLOW_ENV_VAR] === "1",
    reviewerEnabled: process.env[REVIEWER_SPAWN_ALLOW_ENV_VAR] === "1",
  });
}
