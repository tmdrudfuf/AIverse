# Quickstart: Multi-Project Company Operations

## Runtime Verification Scenario

1. Seed or restore browser office session data with two bound projects:
   - Project A status: implementation
   - Project B status: review
2. Open the city scene.
3. Verify the two project company buildings show different attached operational badges.
4. Enter Project A's company office and verify Project Status and NPC work reflect Project A.
5. Return to the city, enter Project B's company office, and verify Project Status and NPC work reflect Project B.
6. Reload the browser and verify the same project-building associations and statuses remain.

## Expected Outcomes

- The city shows at least two different project statuses simultaneously.
- Switching companies does not copy request text, run id, target path, or status between projects.
- A project with no run remains idle even when another project has a newer run.
- A disconnected project binding disables mutation and does not substitute another project.
