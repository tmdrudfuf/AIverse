import type { EmployeeProvider } from "./EmployeeProvider";
import type { Employee } from "./EmployeeTypes";

export class EmployeeService {
  constructor(private readonly provider: EmployeeProvider) {}

  async getEmployees(): Promise<Employee[]> {
    try {
      const employees = await this.provider.getEmployees();
      return employees.map((employee) => ({
        ...employee,
        capabilities: [...employee.capabilities],
        schedule: employee.schedule ? { ...employee.schedule } : undefined,
      }));
    } catch {
      return [];
    }
  }
}