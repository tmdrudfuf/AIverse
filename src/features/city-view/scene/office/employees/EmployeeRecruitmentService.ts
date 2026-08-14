import type { Employee } from "./EmployeeTypes";

export type EmployeeRecruitmentStatus = "recruited" | "already_recruited" | "blocked";

export type EmployeeRecruitmentResult = {
  status: EmployeeRecruitmentStatus;
  employeeId?: string;
  message: string;
  rosterSize: number;
  createdAt: string;
};

export type EmployeeRecruitmentOutcome = {
  employees: Employee[];
  result: EmployeeRecruitmentResult;
};

export const FIFTH_EMPLOYEE_ID = "gpt-product-engineer";

export const FIFTH_EMPLOYEE: Employee = {
  id: FIFTH_EMPLOYEE_ID,
  name: "GPT Product Engineer",
  role: "Engineer",
  status: "Idle",
  avatarColor: "#f59e0b",
  capabilities: ["Product Planning", "Full Stack", "Launch Support"],
  description: "Fifth placeholder employee recruited to expand the AIverse team and support company growth.",
  provider: "placeholder",
};

export class EmployeeRecruitmentService {
  recruitFifthEmployee(
    employees: ReadonlyArray<Employee>,
    recruitedAt = new Date().toISOString(),
  ): EmployeeRecruitmentOutcome {
    const copiedEmployees = employees.map(copyEmployee);
    const existing = copiedEmployees.find((employee) => employee.id === FIFTH_EMPLOYEE_ID);

    if (existing) {
      return {
        employees: copiedEmployees,
        result: {
          status: "already_recruited",
          employeeId: existing.id,
          message: `${existing.name} has already joined AIverse.`,
          rosterSize: copiedEmployees.length,
          createdAt: recruitedAt,
        },
      };
    }

    if (copiedEmployees.length !== 4) {
      return {
        employees: copiedEmployees,
        result: {
          status: "blocked",
          message: "Recruiting is available once the four-person starter team is loaded.",
          rosterSize: copiedEmployees.length,
          createdAt: recruitedAt,
        },
      };
    }

    const recruitedEmployee = copyEmployee(FIFTH_EMPLOYEE);
    const updatedEmployees = [...copiedEmployees, recruitedEmployee];

    return {
      employees: updatedEmployees,
      result: {
        status: "recruited",
        employeeId: recruitedEmployee.id,
        message: `${recruitedEmployee.name} joined AIverse.`,
        rosterSize: updatedEmployees.length,
        createdAt: recruitedAt,
      },
    };
  }
}

function copyEmployee(employee: Employee): Employee {
  return {
    ...employee,
    capabilities: [...employee.capabilities],
    schedule: employee.schedule ? { ...employee.schedule } : undefined,
  };
}
