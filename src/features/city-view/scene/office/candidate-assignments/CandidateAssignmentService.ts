import type { CandidateTaskCollection } from "../candidate-tasks/CandidateTaskTypes";
import type { Employee } from "../employees/EmployeeTypes";
import { CandidateAssignmentMatcher } from "./CandidateAssignmentMatcher";
import type { CandidateAssignmentRecommendationCollection } from "./CandidateAssignmentTypes";

export class CandidateAssignmentService {
  constructor(private readonly matcher = new CandidateAssignmentMatcher()) {}

  recommendAssignments(
    candidateTasks: CandidateTaskCollection,
    employees: ReadonlyArray<Employee>,
  ): CandidateAssignmentRecommendationCollection {
    return this.matcher.recommendAssignments(candidateTasks, employees);
  }
}
