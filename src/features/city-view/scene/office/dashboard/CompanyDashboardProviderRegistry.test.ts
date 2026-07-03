import { describe, expect, it } from "vitest";

import {
  createCompanyDashboardProviderRegistry,
  getEnabledCompanyDashboardProvider,
} from "./CompanyDashboardProviderRegistry";

describe("CompanyDashboardProviderRegistry", () => {
  it("registers only the Internal Simulation provider for this feature", () => {
    const registry = createCompanyDashboardProviderRegistry();

    expect(registry.map((registration) => registration.provider.id)).toEqual(["internal-simulation"]);
    expect(registry.every((registration) => registration.enabled)).toBe(true);
  });

  it("selects enabled providers without exposing provider-specific UI requirements", () => {
    const registry = createCompanyDashboardProviderRegistry();

    const provider = getEnabledCompanyDashboardProvider(registry);

    expect(provider?.id).toBe("internal-simulation");
    expect(provider?.getSnapshot({ generatedAt: "2026-01-01T00:00:00.000Z" }).providerId).toBe("internal-simulation");
  });

  it("does not select unknown future providers before they are implemented", () => {
    const registry = createCompanyDashboardProviderRegistry();

    expect(getEnabledCompanyDashboardProvider(registry, "github")).toBeUndefined();
  });
});
