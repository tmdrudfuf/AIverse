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

  it("ignores the documented warning-level Chromium WebGL ReadPixels performance message", () => {
    expect(
      formatBrowserConsoleFailureSignal({
        type: "warning",
        text:
          "[.WebGL-0x7b6c00a1c200]GL Driver Message (OpenGL, Performance, GL_CLOSE_PATH_NV, High): GPU stall due to ReadPixels",
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

  it("keeps partial WebGL ReadPixels performance messages as failure signals", () => {
    expect(
      formatBrowserConsoleFailureSignal({
        type: "warning",
        text: "[.WebGL-0x123]GPU stall due to ReadPixels",
      }),
    ).toBe("console warning: [.WebGL-0x123]GPU stall due to ReadPixels");
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
