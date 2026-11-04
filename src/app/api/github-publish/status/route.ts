import { NextRequest, NextResponse } from "next/server";

import { isTrustedRuntimeBridgeRequest } from "../../runtime/_lib/RuntimeBridgeOrigin";
import { isGitHubWriteAuthorized } from "../_lib/GitHubPublishChecks";
import type { GitHubWriteAuthorization } from "../_lib/GitHubPublishTypes";

export const runtime = "nodejs";

export type HandleStatusRequestOptions = {
  /** Test-only override. `GET` never passes this -- production always runs the real `gh auth status` check. */
  isAuthorizedOverride?: () => Promise<boolean>;
};

export async function handleStatusRequest(
  request: Request,
  options: HandleStatusRequestOptions = {},
): Promise<NextResponse<GitHubWriteAuthorization>> {
  if (!isTrustedRuntimeBridgeRequest(request)) {
    return NextResponse.json({ authorized: false }, { status: 403 });
  }
  const checkAuthorized = options.isAuthorizedOverride ?? (() => isGitHubWriteAuthorized());
  return NextResponse.json({ authorized: await checkAuthorized() });
}

export async function GET(request: NextRequest): Promise<NextResponse<GitHubWriteAuthorization>> {
  return handleStatusRequest(request);
}
