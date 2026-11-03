import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { GET } from "./route";

const IMPLEMENTER_ENV_VAR = "AIVERSE_ALLOW_IMPLEMENTER_RUNTIME_SPAWN";
const REVIEWER_ENV_VAR = "AIVERSE_ALLOW_REVIEWER_RUNTIME_SPAWN";

describe("GET /api/runtime/status", () => {
  const originalImplementerEnv = process.env[IMPLEMENTER_ENV_VAR];
  const originalReviewerEnv = process.env[REVIEWER_ENV_VAR];

  afterEach(() => {
    if (originalImplementerEnv === undefined) delete process.env[IMPLEMENTER_ENV_VAR];
    else process.env[IMPLEMENTER_ENV_VAR] = originalImplementerEnv;
    if (originalReviewerEnv === undefined) delete process.env[REVIEWER_ENV_VAR];
    else process.env[REVIEWER_ENV_VAR] = originalReviewerEnv;
  });

  it("reports both roles disabled when neither env var is set", async () => {
    delete process.env[IMPLEMENTER_ENV_VAR];
    delete process.env[REVIEWER_ENV_VAR];

    const body = await (await GET()).json();

    expect(body).toEqual({ implementerEnabled: false, reviewerEnabled: false });
  });

  it("reports each role independently enabled", async () => {
    process.env[IMPLEMENTER_ENV_VAR] = "1";
    delete process.env[REVIEWER_ENV_VAR];

    const body = await (await GET()).json();

    expect(body).toEqual({ implementerEnabled: true, reviewerEnabled: false });
  });

  it("never includes any other environment value in the response", async () => {
    process.env[IMPLEMENTER_ENV_VAR] = "1";
    process.env[REVIEWER_ENV_VAR] = "1";

    const body = await (await GET()).json();

    expect(Object.keys(body).sort()).toEqual(["implementerEnabled", "reviewerEnabled"]);
  });
});
