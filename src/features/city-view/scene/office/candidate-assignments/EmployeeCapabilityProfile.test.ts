import { describe, expect, it } from "vitest";
import type { Employee } from "../employees/EmployeeTypes";
import { createEmployeeCapabilityProfile, createEmployeeCapabilityProfiles } from "./EmployeeCapabilityProfile";

describe("EmployeeCapabilityProfile", () => {
  it("maps employee roles and existing capabilities to provider-neutral capabilities", () => {
    expect(createEmployeeCapabilityProfile(employee({ role: "Engineer" })).capabilities).toEqual([
      "BugFixing",
      "FeatureDevelopment",
      "Maintenance",
      "SoftwareDevelopment",
    ]);
    expect(createEmployeeCapabilityProfile(employee({ role: "QA" })).capabilities).toEqual([
      "BugFixing",
      "CodeReview",
      "Testing",
    ]);
    expect(createEmployeeCapabilityProfile(employee({ role: "CTO" })).capabilities).toContain("ProjectPlanning");
  });

  it("handles unknown capability strings safely and removes duplicates", () => {
    const profile = createEmployeeCapabilityProfile(employee({
      capabilities: ["Coding", "coding", "Unknown Skill", "Documentation"],
    }));

    expect(profile.capabilities).toEqual([
      "BugFixing",
      "Documentation",
      "FeatureDevelopment",
      "Maintenance",
      "SoftwareDevelopment",
    ]);
  });

  it("defensively copies capability arrays between calls", () => {
    const source = employee({ capabilities: ["Coding"] });
    const first = createEmployeeCapabilityProfile(source);
    first.capabilities.push("Research");
    source.capabilities.push("Research");

    const second = createEmployeeCapabilityProfile(employee({ capabilities: ["Coding"] }));

    expect(second.capabilities).not.toContain("Research");
  });

  it("sorts profiles by stable employee identifier", () => {
    const profiles = createEmployeeCapabilityProfiles([
      employee({ id: "z-employee" }),
      employee({ id: "a-employee" }),
    ]);

    expect(profiles.map((profile) => profile.employeeId)).toEqual(["a-employee", "z-employee"]);
  });
});

function employee(overrides: Partial<Employee> = {}): Employee {
  return {
    id: "gpt-engineer",
    name: "GPT Engineer",
    role: "Engineer",
    status: "Idle",
    avatarColor: "#2563eb",
    capabilities: [],
    description: "Employee",
    ...overrides,
  };
}
