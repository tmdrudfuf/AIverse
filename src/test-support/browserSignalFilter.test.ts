import { describe, expect, it } from "vitest";

import {
  formatBrowserConsoleFailureSignal,
  formatPageErrorFailureSignal,
} from "./browserSignalFilter";

describe("browser signal filter", () => {
  it("ignores the documented warning-level Chromium software WebGL deprecation message", () => {
    expect(
      formatBrowserConsoleFailureSignal({
        type: "warning",
        text:
          "[GroupMarkerNotSet(crbug.com/242999)!:A0A01B00] Automatic fallback to software WebGL has been deprecated.",
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

  it("keeps partial software WebGL deprecation messages as failure signals", () => {
    expect(
      formatBrowserConsoleFailureSignal({
        type: "warning",
        text: "Software WebGL fallback is active.",
      }),
    ).toBe("console warning: Software WebGL fallback is active.");
  });

  it("keeps the documented WebGL ReadPixels text as a failure when emitted as an error", () => {
    expect(
      formatBrowserConsoleFailureSignal({
        type: "error",
        text: "[.WebGL-0x123]GL Driver Message (OpenGL, Performance): GPU stall due to ReadPixels",
      }),
    ).toBe("console error: [.WebGL-0x123]GL Driver Message (OpenGL, Performance): GPU stall due to ReadPixels");
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
