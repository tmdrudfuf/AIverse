import { describe, expect, it } from "vitest";

import {
  EmployeeRecruitmentService,
  FIFTH_EMPLOYEE,
  FIFTH_EMPLOYEE_ID,
} from "./EmployeeRecruitmentService";
import type { Employee } from "./EmployeeTypes";

describe("EmployeeRecruitmentService", () => {
  it("adds the deterministic fifth employee to a copied four-person roster", () => {
    const employees = [
      employee("employee-1"),
      employee("employee-2"),
      employee("employee-3"),
      employee("employee-4"),
    ];

    const outcome = new EmployeeRecruitmentService().recruitFifthEmployee(employees, "2026-08-13T10:00:00.000Z");

    expect(outcome.result).toEqual({
      status: "recruited",
      employeeId: FIFTH_EMPLOYEE_ID,
      message: "GPT Product Engineer joined AIverse.",
      rosterSize: 5,
      createdAt: "2026-08-13T10:00:00.000Z",
    });
    expect(outcome.employees).toHaveLength(5);
    expect(outcome.employees[4]).toEqual(FIFTH_EMPLOYEE);
    expect(outcome.employees[0]).not.toBe(employees[0]);
    expect(outcome.employees[0].capabilities).not.toBe(employees[0].capabilities);
    expect(employees).toHaveLength(4);
  });

  it("does not duplicate the fifth employee once already recruited", () => {
    const employees = [
      employee("employee-1"),
      employee("employee-2"),
      employee("employee-3"),
      employee("employee-4"),
      FIFTH_EMPLOYEE,
    ];

    const outcome = new EmployeeRecruitmentService().recruitFifthEmployee(employees, "2026-08-13T10:05:00.000Z");

    expect(outcome.result).toMatchObject({
      status: "already_recruited",
      employeeId: FIFTH_EMPLOYEE_ID,
      rosterSize: 5,
    });
    expect(outcome.employees.filter((item) => item.id === FIFTH_EMPLOYEE_ID)).toHaveLength(1);
  });

  it("blocks recruiting when the starter roster is not ready", () => {
    const employees = [employee("employee-1"), employee("employee-2")];

    const outcome = new EmployeeRecruitmentService().recruitFifthEmployee(employees, "2026-08-13T10:10:00.000Z");

    expect(outcome).toEqual({
      employees,
      result: {
        status: "blocked",
        message: "Recruiting is available once the four-person starter team is loaded.",
        rosterSize: 2,
        createdAt: "2026-08-13T10:10:00.000Z",
      },
    });
  });
});

function employee(id: string): Employee {
  return {
    id,
    name: id,
    role: "Engineer",
    status: "Idle",
    avatarColor: "#64748b",
    capabilities: ["Coding"],
    description: `${id} description`,
    provider: "placeholder",
  };
}
