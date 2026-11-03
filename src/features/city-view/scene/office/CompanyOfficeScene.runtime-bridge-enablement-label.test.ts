import { describe, expect, it } from "vitest";
import { formatRuntimeBridgeEnablement } from "./CompanyOfficeScene";

describe("formatRuntimeBridgeEnablement (T028 label text)", () => {
  it("shows a checking placeholder before the first fetch resolves (null)", () => {
    expect(formatRuntimeBridgeEnablement(null)).toMatch(/checking/i);
  });

  it("shows Not enabled for both roles when neither is enabled", () => {
    const text = formatRuntimeBridgeEnablement({ implementerEnabled: false, reviewerEnabled: false });
    expect(text).toContain("Implementer Not enabled");
    expect(text).toContain("Reviewer Not enabled");
  });

  it("shows Enabled for each role independently", () => {
    const text = formatRuntimeBridgeEnablement({ implementerEnabled: true, reviewerEnabled: false });
    expect(text).toContain("Implementer Enabled");
    expect(text).toContain("Reviewer Not enabled");
  });
});
