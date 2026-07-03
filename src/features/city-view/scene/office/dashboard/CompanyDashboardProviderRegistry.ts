import {
  INTERNAL_SIMULATION_DASHBOARD_PROVIDER_ID,
  type CompanyDashboardProvider,
  type CompanyDashboardProviderId,
  type CompanyDashboardProviderRegistration,
} from "./CompanyDashboardTypes";
import { InternalSimulationDashboardProvider } from "./InternalSimulationDashboardProvider";

export function createCompanyDashboardProviderRegistry(): CompanyDashboardProviderRegistration[] {
  return [
    {
      provider: new InternalSimulationDashboardProvider(),
      enabled: true,
    },
  ];
}

export function getEnabledCompanyDashboardProvider(
  registry: ReadonlyArray<CompanyDashboardProviderRegistration>,
  providerId: CompanyDashboardProviderId = INTERNAL_SIMULATION_DASHBOARD_PROVIDER_ID,
): CompanyDashboardProvider | undefined {
  return registry.find((registration) => registration.enabled && registration.provider.id === providerId)?.provider;
}
