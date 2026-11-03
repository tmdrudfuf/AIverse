import { NextResponse } from "next/server";

import { getSharedRuntimeBridgeRunRegistry } from "../../_lib/RuntimeBridgeRunRegistry";

export const runtime = "nodejs";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ runId: string }> },
): Promise<NextResponse<{ runId: string; accepted: boolean }>> {
  const { runId } = await params;
  const registry = getSharedRuntimeBridgeRunRegistry();
  const accepted = registry.cancel(runId);
  return NextResponse.json({ runId, accepted });
}
