import type { PhaserScene } from "../shared/phaserTypes";
import { EmployeeService } from "./employees/EmployeeService";
import { MockEmployeeProvider } from "./employees/MockEmployeeProvider";
import { GitHubRepositoryService } from "./github/GitHubRepositoryService";
import type { GitHubRepositorySummary } from "./github/GitHubRepositoryTypes";
import { MockGitHubRepositoryProvider } from "./github/MockGitHubRepositoryProvider";
import { createProjectPortalState } from "./OfficeProjectPortalRegistry";
import type { ProjectPortalState } from "./OfficeProjectPortalTypes";
import { OfficeProjectPortalView } from "./OfficeProjectPortalView";
import { MockProjectTaskProvider } from "./tasks/MockProjectTaskProvider";
import { ProjectTaskService } from "./tasks/ProjectTaskService";

export type OfficeProjectPortalInput = {
  actionPressed: boolean;
  escapePressed: boolean;
  upPressed: boolean;
  downPressed: boolean;
  enterPressed: boolean;
};

export class OfficeProjectPortalController {
  private readonly state: ProjectPortalState;
  private readonly view: OfficeProjectPortalView;
  private readonly repositoryService: GitHubRepositoryService;
  private readonly taskService: ProjectTaskService;
  private readonly employeeService: EmployeeService;
  private repositoryRequestVersion = 0;
  private taskRequestVersion = 0;
  private employeeRequestVersion = 0;

  constructor(scene: PhaserScene) {
    this.state = createProjectPortalState();
    this.view = new OfficeProjectPortalView(scene, this.state);
    this.repositoryService = new GitHubRepositoryService(new MockGitHubRepositoryProvider());
    this.taskService = new ProjectTaskService(new MockProjectTaskProvider());
    this.employeeService = new EmployeeService(new MockEmployeeProvider());
  }

  open() {
    if (this.state.isOpen) return;

    this.state.isOpen = true;
    this.state.justOpened = true;
    this.state.viewMode = "list";
    this.state.selectedProjectIndex = clamp(this.state.selectedProjectIndex, 0, this.state.projects.length - 1);
    this.state.selectedProjectId = this.state.projects[this.state.selectedProjectIndex]?.id ?? "";
    this.view.render(this.state);
    this.view.show();
  }

  updateInput(input: OfficeProjectPortalInput) {
    if (!this.state.isOpen) return;

    if (this.state.justOpened) {
      this.state.justOpened = false;
      return;
    }

    if (this.state.viewMode === "list") {
      this.updateListInput(input);
      return;
    }

    if (this.state.viewMode === "detail") {
      this.updateDetailInput(input);
      return;
    }

    if (this.state.viewMode === "workspace") {
      this.updateWorkspaceInput(input);
      return;
    }

    if (this.state.viewMode === "repository-detail") {
      this.updateRepositoryDetailInput(input);
      return;
    }

    if (this.state.viewMode === "task-list") {
      this.updateTaskListInput(input);
      return;
    }

    if (this.state.viewMode === "task-detail") {
      this.updateTaskDetailInput(input);
      return;
    }

    this.updateEmployeeSelectionInput(input);
  }

  isOpen() {
    return this.state.isOpen;
  }

  close() {
    if (!this.state.isOpen) return;

    this.state.isOpen = false;
    this.state.justOpened = false;
    this.state.viewMode = "list";
    this.state.selectedRepositoryProjectId = undefined;
    this.state.selectedTaskProjectId = undefined;
    this.state.selectedTaskId = undefined;
    this.state.selectedEmployeeIndex = 0;
    this.repositoryRequestVersion += 1;
    this.taskRequestVersion += 1;
    this.employeeRequestVersion += 1;
    this.view.hide();
  }

  destroy() {
    this.repositoryRequestVersion += 1;
    this.taskRequestVersion += 1;
    this.employeeRequestVersion += 1;
    this.view.destroy();
    this.state.isOpen = false;
    this.state.justOpened = false;
  }

  private updateListInput(input: OfficeProjectPortalInput) {
    if (input.escapePressed) {
      this.close();
      return;
    }

    if (input.upPressed) this.moveProjectSelection(-1);
    if (input.downPressed) this.moveProjectSelection(1);

    if (input.actionPressed || input.enterPressed) {
      this.state.viewMode = "detail";
      this.view.render(this.state);
    }
  }

  private updateDetailInput(input: OfficeProjectPortalInput) {
    if (input.escapePressed) {
      this.state.viewMode = "list";
      this.view.render(this.state);
      return;
    }

    if (input.actionPressed || input.enterPressed) {
      const project = this.getSelectedProject();
      if (!project || !project.nextAction.enabled) return;

      const workspace = this.state.workspaces[project.id];
      if (!workspace) return;

      this.state.selectedWorkspaceSectionIndex = clamp(
        this.state.selectedWorkspaceSectionIndex,
        0,
        workspace.sections.length - 1,
      );
      this.state.viewMode = "workspace";
      this.view.render(this.state);
    }
  }

  private updateWorkspaceInput(input: OfficeProjectPortalInput) {
    if (input.escapePressed) {
      this.state.viewMode = "detail";
      this.view.render(this.state);
      return;
    }

    if (input.upPressed) this.moveWorkspaceSelection(-1);
    if (input.downPressed) this.moveWorkspaceSelection(1);

    if (input.actionPressed || input.enterPressed) {
      const project = this.getSelectedProject();
      const workspace = project ? this.state.workspaces[project.id] : undefined;
      const section = workspace?.sections[this.state.selectedWorkspaceSectionIndex];
      if (!project || !section?.enabled) return;

      if (section.id === "repository") {
        void this.openRepositoryDetail(project.id);
        return;
      }

      if (section.id === "tasks") {
        void this.openTaskList(project.id);
      }
    }
  }

  private updateRepositoryDetailInput(input: OfficeProjectPortalInput) {
    if (!input.escapePressed) return;

    this.state.viewMode = "workspace";
    this.state.selectedRepositoryProjectId = undefined;
    this.repositoryRequestVersion += 1;
    this.view.render(this.state);
  }

  private updateTaskListInput(input: OfficeProjectPortalInput) {
    if (input.escapePressed) {
      this.state.viewMode = "workspace";
      this.state.selectedTaskId = undefined;
      this.taskRequestVersion += 1;
      this.view.render(this.state);
      return;
    }

    if (input.upPressed) this.moveTaskSelection(-1);
    if (input.downPressed) this.moveTaskSelection(1);

    if (input.actionPressed || input.enterPressed) {
      const task = this.getSelectedTask();
      if (!task) return;

      this.state.selectedTaskId = task.id;
      this.state.viewMode = "task-detail";
      this.view.render(this.state);
    }
  }

  private updateTaskDetailInput(input: OfficeProjectPortalInput) {
    if (input.escapePressed) {
      this.state.viewMode = "task-list";
      this.view.render(this.state);
      return;
    }

    if (input.actionPressed || input.enterPressed) {
      void this.openEmployeeSelection();
    }
  }

  private updateEmployeeSelectionInput(input: OfficeProjectPortalInput) {
    if (input.escapePressed) {
      this.state.viewMode = "task-detail";
      this.employeeRequestVersion += 1;
      this.view.render(this.state);
      return;
    }

    if (input.upPressed) this.moveEmployeeSelection(-1);
    if (input.downPressed) this.moveEmployeeSelection(1);

    if (input.actionPressed || input.enterPressed) {
      this.assignSelectedEmployeeToSelectedTask();
    }
  }

  private async openRepositoryDetail(projectId: string) {
    const requestVersion = this.repositoryRequestVersion + 1;
    this.repositoryRequestVersion = requestVersion;
    this.state.selectedRepositoryProjectId = projectId;
    this.state.repositorySummaries[projectId] = createLoadingRepositorySummary();
    this.state.viewMode = "repository-detail";
    this.view.render(this.state);

    const summary = await this.repositoryService.getRepositorySummary(projectId);
    if (!this.shouldApplyRepositorySummary(projectId, requestVersion)) return;

    this.state.repositorySummaries[projectId] = summary;
    this.view.render(this.state);
  }

  private async openTaskList(projectId: string) {
    this.state.selectedTaskProjectId = projectId;
    this.state.selectedTaskId = undefined;
    this.state.selectedTaskIndex = 0;
    this.state.viewMode = "task-list";
    this.view.render(this.state);

    const requestVersion = this.taskRequestVersion + 1;
    this.taskRequestVersion = requestVersion;

    const collection = await this.taskService.getTaskCollection(projectId);
    if (!this.shouldApplyTaskCollection(projectId, requestVersion)) return;

    this.state.taskCollections[projectId] = collection;
    this.state.selectedTaskIndex = clamp(this.state.selectedTaskIndex, 0, Math.max(collection.tasks.length - 1, 0));
    this.state.selectedTaskId = collection.tasks[this.state.selectedTaskIndex]?.id;
    this.view.render(this.state);
  }

  private async openEmployeeSelection() {
    const projectId = this.state.selectedTaskProjectId ?? this.getSelectedProject()?.id;
    const task = this.getSelectedTask();
    if (!projectId || !task) return;

    this.state.selectedTaskId = task.id;
    this.state.selectedEmployeeIndex = clamp(this.state.selectedEmployeeIndex, 0, Math.max(this.state.employees.length - 1, 0));
    this.state.viewMode = "employee-selection";
    this.view.render(this.state);

    const requestVersion = this.employeeRequestVersion + 1;
    this.employeeRequestVersion = requestVersion;

    const employees = await this.employeeService.getEmployees();
    if (!this.shouldApplyEmployees(projectId, task.id, requestVersion)) return;

    this.state.employees = employees;
    this.state.selectedEmployeeIndex = clamp(this.state.selectedEmployeeIndex, 0, Math.max(employees.length - 1, 0));
    this.view.render(this.state);
  }

  private shouldApplyRepositorySummary(projectId: string, requestVersion: number) {
    return (
      this.state.isOpen &&
      this.state.viewMode === "repository-detail" &&
      this.state.selectedRepositoryProjectId === projectId &&
      this.repositoryRequestVersion === requestVersion
    );
  }

  private shouldApplyTaskCollection(projectId: string, requestVersion: number) {
    return (
      this.state.isOpen &&
      (this.state.viewMode === "task-list" || this.state.viewMode === "task-detail") &&
      this.state.selectedTaskProjectId === projectId &&
      this.taskRequestVersion === requestVersion
    );
  }

  private shouldApplyEmployees(projectId: string, taskId: string, requestVersion: number) {
    return (
      this.state.isOpen &&
      this.state.viewMode === "employee-selection" &&
      this.state.selectedTaskProjectId === projectId &&
      this.state.selectedTaskId === taskId &&
      this.employeeRequestVersion === requestVersion
    );
  }

  private assignSelectedEmployeeToSelectedTask() {
    const projectId = this.state.selectedTaskProjectId ?? this.getSelectedProject()?.id;
    const collection = projectId ? this.state.taskCollections[projectId] : undefined;
    const task = collection?.tasks[this.state.selectedTaskIndex];
    const employee = this.state.employees[this.state.selectedEmployeeIndex];
    if (!projectId || !collection || !task || !employee) return;

    const updatedTask = {
      ...task,
      assignee: employee.name,
      assigneeId: employee.id,
      updatedAt: new Date().toISOString(),
    };

    this.state.taskCollections[projectId] = {
      ...collection,
      tasks: collection.tasks.map((item) => (item.id === task.id ? updatedTask : item)),
    };
    this.state.employees = this.state.employees.map((item) =>
      item.id === employee.id
        ? {
            ...item,
            assignedTaskId: task.id,
            currentProjectId: projectId,
          }
        : item,
    );
    this.state.employeeAssignments = {
      ...this.state.employeeAssignments,
      [task.id]: employee.id,
    };
    this.state.selectedTaskId = task.id;
    this.state.viewMode = "task-detail";
    this.view.render(this.state);
  }

  private moveProjectSelection(delta: number) {
    const nextIndex = clamp(this.state.selectedProjectIndex + delta, 0, this.state.projects.length - 1);
    if (nextIndex === this.state.selectedProjectIndex) return;

    this.state.selectedProjectIndex = nextIndex;
    this.state.selectedProjectId = this.state.projects[nextIndex]?.id ?? "";
    this.state.selectedWorkspaceSectionIndex = 0;
    this.state.selectedRepositoryProjectId = undefined;
    this.state.selectedTaskProjectId = undefined;
    this.state.selectedTaskId = undefined;
    this.state.selectedTaskIndex = 0;
    this.state.selectedEmployeeIndex = 0;
    this.taskRequestVersion += 1;
    this.employeeRequestVersion += 1;
    this.view.render(this.state);
  }

  private moveWorkspaceSelection(delta: number) {
    const project = this.getSelectedProject();
    const workspace = project ? this.state.workspaces[project.id] : undefined;
    if (!workspace) return;

    const nextIndex = clamp(this.state.selectedWorkspaceSectionIndex + delta, 0, workspace.sections.length - 1);
    if (nextIndex === this.state.selectedWorkspaceSectionIndex) return;

    this.state.selectedWorkspaceSectionIndex = nextIndex;
    this.view.render(this.state);
  }

  private moveTaskSelection(delta: number) {
    const collection = this.getSelectedTaskCollection();
    if (!collection || collection.tasks.length === 0) return;

    const nextIndex = clamp(this.state.selectedTaskIndex + delta, 0, collection.tasks.length - 1);
    if (nextIndex === this.state.selectedTaskIndex) return;

    this.state.selectedTaskIndex = nextIndex;
    this.state.selectedTaskId = collection.tasks[nextIndex]?.id;
    this.view.render(this.state);
  }

  private moveEmployeeSelection(delta: number) {
    if (this.state.employees.length === 0) return;

    const nextIndex = clamp(this.state.selectedEmployeeIndex + delta, 0, this.state.employees.length - 1);
    if (nextIndex === this.state.selectedEmployeeIndex) return;

    this.state.selectedEmployeeIndex = nextIndex;
    this.view.render(this.state);
  }

  private getSelectedProject() {
    return this.state.projects[this.state.selectedProjectIndex];
  }

  private getSelectedTaskCollection() {
    const projectId = this.state.selectedTaskProjectId ?? this.getSelectedProject()?.id;
    return projectId ? this.state.taskCollections[projectId] : undefined;
  }

  private getSelectedTask() {
    const collection = this.getSelectedTaskCollection();
    return collection?.tasks[this.state.selectedTaskIndex];
  }
}

function createLoadingRepositorySummary(): GitHubRepositorySummary {
  return {
    owner: "",
    name: "",
    defaultBranch: "",
    openIssueCount: 0,
    openPullRequestCount: 0,
    connectionStatus: "loading",
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}