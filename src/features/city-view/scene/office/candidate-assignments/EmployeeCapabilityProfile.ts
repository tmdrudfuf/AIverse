import type { Employee } from "../employees/EmployeeTypes";
import type { EmployeeCapability } from "./CandidateAssignmentTypes";

export type EmployeeAvailabilityRank = 0 | 1 | 2 | 3;

export type EmployeeCapabilityProfile = {
  employeeId: string;
  employeeName: string;
  role: string;
  status?: string;
  availabilityRank: EmployeeAvailabilityRank;
  activeWorkload: number;
  capabilities: EmployeeCapability[];
  currentProjectId?: string;
};

const ROLE_CAPABILITIES: Record<string, EmployeeCapability[]> = {
  Engineer: ["SoftwareDevelopment", "FeatureDevelopment", "BugFixing", "Maintenance"],
  QA: ["Testing", "BugFixing", "CodeReview"],
  Designer: ["Documentation"],
  CTO: ["ProjectPlanning", "Research", "CodeReview", "SoftwareDevelopment"],
};

const CAPABILITY_ALIASES: Record<string, EmployeeCapability[]> = {
  architecture: ["SoftwareDevelopment", "ProjectPlanning"],
  "bug reports": ["BugFixing", "Testing"],
  bugfixing: ["BugFixing"],
  coding: ["SoftwareDevelopment", "FeatureDevelopment", "Maintenance"],
  codereview: ["CodeReview"],
  documentation: ["Documentation"],
  graphics: ["Documentation"],
  maintenance: ["Maintenance"],
  planning: ["ProjectPlanning", "Research"],
  refactoring: ["Maintenance", "SoftwareDevelopment"],
  research: ["Research"],
  review: ["CodeReview"],
  testing: ["Testing", "BugFixing"],
  ui: ["Documentation"],
  ux: ["Documentation"],
};

export function createEmployeeCapabilityProfiles(
  employees: ReadonlyArray<Employee>,
): EmployeeCapabilityProfile[] {
  return employees.map(createEmployeeCapabilityProfile)
    .sort((left, right) => left.employeeId.localeCompare(right.employeeId));
}

export function createEmployeeCapabilityProfile(employee: Employee): EmployeeCapabilityProfile {
  return {
    employeeId: employee.id,
    employeeName: employee.name,
    role: employee.role,
    status: employee.status,
    availabilityRank: getAvailabilityRank(employee),
    activeWorkload: employee.assignedTaskId ? 1 : 0,
    capabilities: deriveCapabilities(employee),
    currentProjectId: employee.currentProjectId,
  };
}

function deriveCapabilities(employee: Employee): EmployeeCapability[] {
  const capabilities = new Set<EmployeeCapability>();
  (ROLE_CAPABILITIES[employee.role] ?? []).forEach((capability) => capabilities.add(capability));

  employee.capabilities.forEach((capability) => {
    const normalized = capability.trim().toLowerCase();
    (CAPABILITY_ALIASES[normalized] ?? []).forEach((mapped) => capabilities.add(mapped));
  });

  return Array.from(capabilities).sort();
}

function getAvailabilityRank(employee: Employee): EmployeeAvailabilityRank {
  if (employee.status === "Idle") return 0;
  if (employee.status === "Working") return 1;
  if (employee.status === "Offline") return 2;
  return 3;
}
