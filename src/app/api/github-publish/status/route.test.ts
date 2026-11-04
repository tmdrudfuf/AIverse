import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { handleStatusRequest } from "./route";

function getRequest() {
  return new NextRequest("http://localhost/api/github-publish/status", { headers: { host: "localhost" } });
}

function untrustedGetRequest() {
  return new NextRequest("http://localhost/api/github-publish/status", { headers: { host: "example.com" } });
}

describe("GET /api/github-publish/status", () => {
  it("reports authorized: true when the override says so", async () => {
    const response = await handleStatusRequest(getRequest(), { isAuthorizedOverride: async () => true });
    const body = await response.json();

    expect(body).toEqual({ authorized: true });
  });

  it("reports authorized: false when the override says so", async () => {
    const response = await handleStatusRequest(getRequest(), { isAuthorizedOverride: async () => false });
    const body = await response.json();

    expect(body).toEqual({ authorized: false });
  });

  it("refuses untrusted origins without ever calling the authorization check", async () => {
    let called = false;
    const response = await handleStatusRequest(untrustedGetRequest(), {
      isAuthorizedOverride: async () => {
        called = true;
        return true;
      },
    });
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toEqual({ authorized: false });
    expect(called).toBe(false);
  });
});
