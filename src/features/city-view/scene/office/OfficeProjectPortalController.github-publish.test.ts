import { describe, expect, it } from "vitest";

import { OfficeProjectPortalController } from "./OfficeProjectPortalController";
import { GitHubPublishClient, type GitHubPublishPreview, type GitHubPublishResult } from "./github-publish/GitHubPublishClient";
import { createSceneStub, getControllerInternals } from "./OfficeProjectPortalController.testHelpers";

function fakePreview(overrides: Partial<GitHubPublishPreview> = {}): GitHubPublishPreview {
  return { changedFiles: [], plannedCommitMessage: "", hasAnythingToPublish: false, ...overrides };
}

function installFakeGitHubPublishClient(
  internals: ReturnType<typeof getControllerInternals>,
  overrides: Partial<GitHubPublishClient> = {},
) {
  const client = {
    publish: async () => fakeResult(),
    getStatus: async () => false,
    getPreview: async () => fakePreview(),
    ...overrides,
  } as GitHubPublishClient;
  (internals as unknown as { githubPublishClient: GitHubPublishClient }).githubPublishClient = client;
  return client;
}

function fakeResult(overrides: Partial<GitHubPublishResult> = {}): GitHubPublishResult {
  return {
    attemptId: "a1",
    status: "published",
    refusalReason: null,
    branchName: "aiverse/publish-1",
    commitMessage: "AIverse maintenance update: 1 file changed",
    pullRequestUrl: "https://github.com/example/repo/pull/1",
    evidence: { stdoutSummary: "", stderrSummary: "", failureStep: null },
    ...overrides,
  };
}

describe("OfficeProjectPortalController T012 GitHub publish", () => {
  it("resolves the active project's working directory to null when neither binding nor identity has a local path", () => {
    const controller = new OfficeProjectPortalController(createSceneStub());
    const internals = getControllerInternals(controller);
    internals.state.selectedProjectId = "portfolio"; // seeded with no localRepositoryBinding and no repositoryIdentity.localPath

    expect(controller.getActiveProjectWorkingDirectory()).toBeNull();
  });

  it("resolves the working directory from repositoryIdentity.localPath when there is no local repository binding", () => {
    const controller = new OfficeProjectPortalController(createSceneStub());
    const internals = getControllerInternals(controller);
    internals.state.selectedProjectId = "portfolio";
    const activeProject = internals.state.projects.find((project) => project.id === "portfolio")!;
    (activeProject as { repositoryIdentity?: unknown }).repositoryIdentity = { localPath: "C:/scratch/project-a" };

    expect(controller.getActiveProjectWorkingDirectory()).toBe("C:/scratch/project-a");
  });

  it("prefers localRepositoryBinding.repositoryPath over repositoryIdentity.localPath", () => {
    const controller = new OfficeProjectPortalController(createSceneStub());
    const internals = getControllerInternals(controller);
    internals.state.selectedProjectId = "portfolio";
    const activeProject = internals.state.projects.find((project) => project.id === "portfolio")!;
    (activeProject as { repositoryIdentity?: unknown }).repositoryIdentity = { localPath: "C:/scratch/identity-path" };
    (activeProject as { localRepositoryBinding?: unknown }).localRepositoryBinding = { repositoryPath: "C:/scratch/binding-path" };

    expect(controller.getActiveProjectWorkingDirectory()).toBe("C:/scratch/binding-path");
  });

  it("publishToGitHub() returns null without touching the client when there is no resolvable working directory", async () => {
    const controller = new OfficeProjectPortalController(createSceneStub());
    const internals = getControllerInternals(controller);
    internals.state.selectedProjectId = "portfolio";

    expect(await controller.publishToGitHub()).toBeNull();
  });

  it("publishToGitHub() delegates to the GitHubPublishClient with the resolved working directory", async () => {
    const controller = new OfficeProjectPortalController(createSceneStub());
    const internals = getControllerInternals(controller);
    // Uses the default active project ("daily-proof"), which is seeded with
    // a real localRepositoryBinding.repositoryPath -- the AIverse repo
    // managing its own GitHub publish is exactly Spec 150's intended case.
    const dailyProof = internals.state.projects.find((project) => project.id === "daily-proof")!;
    const expectedWorkingDirectory = (dailyProof as { localRepositoryBinding?: { repositoryPath?: string } }).localRepositoryBinding!.repositoryPath!;

    let receivedWorkingDirectory: string | undefined;
    const expectedResult = fakeResult();
    installFakeGitHubPublishClient(internals, {
      publish: async (workingDirectory: string) => {
        receivedWorkingDirectory = workingDirectory;
        return expectedResult;
      },
    });

    const result = await controller.publishToGitHub();

    expect(receivedWorkingDirectory).toBe(expectedWorkingDirectory);
    expect(result).toEqual(expectedResult);
  });

  it("getGitHubPublishAuthorized()/getGitHubPublishPreview() start as null before any refresh", () => {
    const controller = new OfficeProjectPortalController(createSceneStub());

    expect(controller.getGitHubPublishAuthorized()).toBeNull();
    expect(controller.getGitHubPublishPreview()).toBeNull();
  });

  it("refreshGitHubPublishStatusAndPreview() caches the fetched authorization and preview for the active project", async () => {
    const controller = new OfficeProjectPortalController(createSceneStub());
    const internals = getControllerInternals(controller);
    const dailyProof = internals.state.projects.find((project) => project.id === "daily-proof")!;
    const expectedWorkingDirectory = (dailyProof as { localRepositoryBinding?: { repositoryPath?: string } }).localRepositoryBinding!.repositoryPath!;

    let receivedWorkingDirectory: string | undefined;
    const preview = fakePreview({ changedFiles: ["a.ts"], hasAnythingToPublish: true });
    installFakeGitHubPublishClient(internals, {
      getStatus: async () => true,
      getPreview: async (workingDirectory: string) => {
        receivedWorkingDirectory = workingDirectory;
        return preview;
      },
    });

    await controller.refreshGitHubPublishStatusAndPreview();

    expect(receivedWorkingDirectory).toBe(expectedWorkingDirectory);
    expect(controller.getGitHubPublishAuthorized()).toBe(true);
    expect(controller.getGitHubPublishPreview()).toEqual(preview);
  });

  it("refreshGitHubPublishStatusAndPreview() caches a null preview when there is no resolvable working directory", async () => {
    const controller = new OfficeProjectPortalController(createSceneStub());
    const internals = getControllerInternals(controller);
    internals.state.selectedProjectId = "portfolio";
    installFakeGitHubPublishClient(internals, { getStatus: async () => true });

    await controller.refreshGitHubPublishStatusAndPreview();

    expect(controller.getGitHubPublishAuthorized()).toBe(true);
    expect(controller.getGitHubPublishPreview()).toBeNull();
  });

  it("publishToGitHub() refreshes the cached preview after a real publish attempt", async () => {
    const controller = new OfficeProjectPortalController(createSceneStub());
    const internals = getControllerInternals(controller);
    const refreshedPreview = fakePreview({ hasAnythingToPublish: false });
    installFakeGitHubPublishClient(internals, { getPreview: async () => refreshedPreview });

    await controller.publishToGitHub();

    expect(controller.getGitHubPublishPreview()).toEqual(refreshedPreview);
  });
});
