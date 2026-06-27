import type { EmployeeProvider } from "./EmployeeProvider";
import type { Employee } from "./EmployeeTypes";

const MOCK_EMPLOYEES: Employee[] = [
  {
    id: "gpt-engineer",
    name: "GPT Engineer",
    role: "Engineer",
    status: "Idle",
    avatarColor: "#2563eb",
    capabilities: ["Coding", "Refactoring", "Architecture"],
    description: "Placeholder engineering employee for future task implementation work.",
    provider: "placeholder",
  },
  {
    id: "gpt-qa",
    name: "GPT QA",
    role: "QA",
    status: "Idle",
    avatarColor: "#16a34a",
    capabilities: ["Testing", "Review", "Bug Reports"],
    description: "Placeholder QA employee for future test and review workflows.",
    provider: "placeholder",
  },
  {
    id: "gpt-designer",
    name: "GPT Designer",
    role: "Designer",
    status: "Idle",
    avatarColor: "#db2777",
    capabilities: ["UI", "UX", "Graphics"],
    description: "Placeholder design employee for future interface and visual work.",
    provider: "placeholder",
  },
  {
    id: "gpt-cto",
    name: "GPT CTO",
    role: "CTO",
    status: "Idle",
    avatarColor: "#7c3aed",
    capabilities: ["Planning", "Architecture", "Review"],
    description: "Placeholder technical leadership employee for planning and review.",
    provider: "placeholder",
  },
];

export class MockEmployeeProvider implements EmployeeProvider {
  async getEmployees(): Promise<Employee[]> {
    return MOCK_EMPLOYEES.map((employee) => ({
      ...employee,
      capabilities: [...employee.capabilities],
      schedule: employee.schedule ? { ...employee.schedule } : undefined,
    }));
  }
}