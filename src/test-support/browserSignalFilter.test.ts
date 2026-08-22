import { describe, expect, it } from "vitest";

import {
  formatBrowserConsoleFailureSignal,
  formatPageErrorFailureSignal,
} from "./browserSignalFilter";

describe("browser signal filter", () => {
  it("ignores the documented warning-level Chromium WebGL fallback message", () => {
    expect(
      formatBrowserConsoleFailureSignal({
        type: "warning",
        text:
          "[GroupMarkerNotSet(crbug.com/242999)!:A0A01B00] Automatic fallback to software WebGL has been deprecated. Please use the --enable-unsafe-swiftshader flag to opt in to lower security guarantees for trusted content.",
      }),
    ).toBeNull();
  });

  it("keeps unknown console warnings as failure signals", () => {
    expect(
      formatBrowserConsoleFailureSignal({
        type: "warning",
        text: "WebGL context creation failed for an unexpected reason",
      }),
    ).toBe("console warning: WebGL context creation failed for an unexpected reason");
  });

  it("keeps the documented WebGL fallback text as a failure when emitted as an error", () => {
    expect(
      formatBrowserConsoleFailureSignal({
        type: "error",
        text: "Automatic fallback to software WebGL has been deprecated.",
      }),
    ).toBe("console error: Automatic fallback to software WebGL has been deprecated.");
  });

  it("ignores non-warning console signal types", () => {
    expect(
      formatBrowserConsoleFailureSignal({
        type: "info",
        text: "Office interaction placeholder",
      }),
    ).toBeNull();
  });

  it("formats page errors as failure signals", () => {
    expect(formatPageErrorFailureSignal("boom")).toBe("page error: boom");
  });
});
