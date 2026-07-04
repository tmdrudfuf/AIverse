# DESIGN_DECISIONS

## Overview

This document records significant AIverse design and architecture decisions in chronological order.

Each entry should preserve the context, alternatives, reasoning, consequences, and future revisit conditions so future Spec Kit features can build from known project direction instead of rediscovering the same choices.

## Decision Template

- Date:
- Decision:
- Context:
- Alternatives Considered:
- Reason for the Final Choice:
- Consequences:
- Future Revisit Conditions:

## Decisions

### 2026-07-04: Computer-Opened Interfaces Use AIverse Office Terminal Visual Language

**Decision**: Computer-opened company interfaces use the "AIverse Office Terminal" visual language.

**Context**: Company Dashboard, Company Influence Planning, and Project Dashboard are accessed through the in-world office computer/project portal.

**Approved Direction**:

- near-black or black background
- white and soft-gray text
- monospace typography
- thin restrained panel borders
- compact terminal-style information hierarchy
- readable status labels
- minimal decoration
- no persistent operation/help text competing with content
- no excessive cyberpunk styling
- no neon-heavy visual noise
- readability over effects

**Alternatives Considered**:

- Keep the generic light game-menu dashboard style.
- Use a more decorative cyberpunk dashboard style.
- Apply the terminal style globally to all player-facing UI.

**Reason for the Final Choice**: The interface should feel like part of the in-world office computer rather than a generic game menu, while remaining suitable for future real project and GitHub data.

**Consequences**:

- Future computer-opened interfaces should reuse this visual language where appropriate.
- Player-facing non-computer UI does not automatically inherit this style.
- Future repository, branch, pull request, build, issue, and external-source information can fit naturally into this terminal language.
- Visual consistency must not justify duplicating simulation state.

**Future Revisit Conditions**: Revisit only if playtesting shows readability, accessibility, or navigation problems.
