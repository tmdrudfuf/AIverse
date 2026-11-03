import { NextResponse } from "next/server";

import { getSharedRuntimeBridgeRunRegistry } from "../../_lib/RuntimeBridgeRunRegistry";
import { isTrustedRuntimeBridgeRequest } from "../../_lib/RuntimeBridgeOrigin";

export const runtime = "nodejs";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ runId: string }> },
): Promise<NextResponse<{ runId: string; accepted: boolean }>> {
  const { runId } = await params;
  if (!isTrustedRuntimeBridgeRequest(request)) {
    return NextResponse.json({ runId, accepted: false }, { status: 403 });
  }
  const registry = getSharedRuntimeBridgeRunRegistry();
  const accepted = registry.cancel(runId);
  return NextResponse.json({ runId, accepted });
}
