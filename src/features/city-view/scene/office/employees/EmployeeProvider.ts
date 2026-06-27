import type { Employee } from "./EmployeeTypes";

export interface EmployeeProvider {
  getEmployees(): Promise<Employee[]>;
}