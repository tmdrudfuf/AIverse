const { assertSafeCommand, resolveAgentConfig } = require("./agentRunner.js");

const DEFAULT_ROLE_ROSTER = ["codex", "claude"];

function getRoleRoster(state) {
  const state_ = state && typeof state === "object" ? state : {};
  if (Array.isArray(state_.roleRoster) && state_.roleRoster.length) {
    return [...new Set(state_.roleRoster.map((id) => String(id)))];
  }
  return [...DEFAULT_ROLE_ROSTER];
}

function getConfiguredRoleAgentId(state, role) {
  const stageAgents = (state && state.stageAgents) || {};
  if (role === "reviewer") return stageAgents.review;
  if (role === "implementer") return stageAgents.implement;
  return undefined;
}

function describeRoster(roster) {
  return `Available eligible agents: ${roster.join(", ")}.`;
}

function fail(diagnostics, source) {
  return { ok: false, roles: null, source: source || "cli-override", diagnostics };
}

function tryResolveAgent(state, agentId) {
  try {
    return { config: resolveAgentConfig(state, agentId), error: undefined };
  } catch (error) {
    return { config: undefined, error };
  }
}

function resolveCliOverride(requestedImplementerId, state) {
  const roster = getRoleRoster(state);

  const implementerLookup = tryResolveAgent(state, requestedImplementerId);
  if (!implementerLookup.config) {
    return fail([
      `Requested implementer '${requestedImplementerId}' is not configured.`,
      describeRoster(roster),
    ]);
  }
  if (implementerLookup.config.enabled === false) {
    return fail([
      `Requested implementer '${requestedImplementerId}' is disabled.`,
      describeRoster(roster),
    ]);
  }

  if (!roster.includes(requestedImplementerId)) {
    return fail([
      `Requested implementer '${requestedImplementerId}' is not part of the configured role roster.`,
      describeRoster(roster),
    ]);
  }

  const others = roster.filter((id) => id !== requestedImplementerId);
  let reviewerId;
  if (others.length === 1) {
    reviewerId = others[0];
  } else if (others.length === 0) {
    return fail([
      `No distinct Reviewer candidate exists for implementer '${requestedImplementerId}'.`,
      describeRoster(roster),
    ]);
  } else {
    const configuredReviewerId = getConfiguredRoleAgentId(state, "reviewer");
    if (configuredReviewerId && configuredReviewerId !== requestedImplementerId && others.includes(configuredReviewerId)) {
      reviewerId = configuredReviewerId;
    } else {
      return fail([
        `Multiple Reviewer candidates (${others.join(", ")}) exist for implementer '${requestedImplementerId}' and no distinct configured Reviewer could be preserved.`,
        describeRoster(roster),
      ]);
    }
  }

  if (reviewerId === requestedImplementerId) {
    return fail([
      `Resolved reviewer cannot be the same agent as implementer '${requestedImplementerId}'.`,
      describeRoster(roster),
    ]);
  }

  const reviewerLookup = tryResolveAgent(state, reviewerId);
  if (!reviewerLookup.config) {
    return fail([
      `Resolved reviewer '${reviewerId}' is not configured.`,
      describeRoster(roster),
    ]);
  }
  if (reviewerLookup.config.enabled === false) {
    return fail([
      `Resolved reviewer '${reviewerId}' is disabled.`,
      describeRoster(roster),
    ]);
  }

  try {
    assertSafeCommand(implementerLookup.config);
  } catch (error) {
    return fail([
      `Requested implementer '${requestedImplementerId}' has an unsafe or invalid runner configuration: ${error.message}`,
    ]);
  }
  try {
    assertSafeCommand(reviewerLookup.config);
  } catch (error) {
    return fail([
      `Resolved reviewer '${reviewerId}' has an unsafe or invalid runner configuration: ${error.message}`,
    ]);
  }

  return {
    ok: true,
    roles: { implementer: requestedImplementerId, reviewer: reviewerId },
    source: "cli-override",
    diagnostics: [],
  };
}

function resolveFromStateOrDefault(state) {
  const stageAgents = (state && state.stageAgents) || {};
  const implementerId = stageAgents.implement || "implementer";
  const reviewerId = stageAgents.review || "reviewer";
  const source = (stageAgents.implement || stageAgents.review) ? "state" : "default";
  return {
    ok: true,
    roles: { implementer: implementerId, reviewer: reviewerId },
    source,
    diagnostics: [],
  };
}

function resolveEffectiveRoles(options = {}) {
  const { state, requestedImplementerId, existingRunRoles } = options;

  if (existingRunRoles && existingRunRoles.implementer && existingRunRoles.reviewer) {
    if (requestedImplementerId && requestedImplementerId !== existingRunRoles.implementer) {
      return {
        ok: false,
        roles: null,
        source: "resume-conflict",
        diagnostics: [
          `Existing run roles: Implementer=${existingRunRoles.implementer}, Reviewer=${existingRunRoles.reviewer}.`,
          `Requested resume override: Implementer=${requestedImplementerId}.`,
          "Rejected before spawn because runtime roles are already fixed for this run.",
        ],
      };
    }
    return {
      ok: true,
      roles: { implementer: existingRunRoles.implementer, reviewer: existingRunRoles.reviewer },
      source: existingRunRoles.source || "resume",
      diagnostics: [],
    };
  }

  if (requestedImplementerId) return resolveCliOverride(requestedImplementerId, state);

  return resolveFromStateOrDefault(state);
}

function describeEffectiveRoles(state, roles, source) {
  const implementerConfig = resolveAgentConfig(state, roles.implementer);
  const reviewerConfig = resolveAgentConfig(state, roles.reviewer);
  return {
    implementer: { agentId: implementerConfig.agentId, displayName: implementerConfig.identity },
    reviewer: { agentId: reviewerConfig.agentId, displayName: reviewerConfig.identity },
    source,
  };
}

module.exports = {
  DEFAULT_ROLE_ROSTER,
  describeEffectiveRoles,
  getConfiguredRoleAgentId,
  getRoleRoster,
  resolveEffectiveRoles,
};
