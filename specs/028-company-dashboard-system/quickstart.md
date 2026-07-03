# Quickstart: Company Dashboard System

## Purpose

This quickstart describes how to validate the Company Dashboard first vertical slice after implementation.

## Preconditions

- The app builds successfully.
- The office/company experience is reachable.
- At least one employee and one project exist in the current simulation, or empty states are expected.

## Run Locally

```powershell
npm install
npm run dev
```

Open the local URL printed by the dev server.

## Manual Validation Checklist

1. Enter the company/office experience.
2. Open the Company Dashboard from the implemented dashboard entry point.
3. Verify the dashboard appears as a read-only company command center.
4. Verify company health is shown when existing progression data supports it.
5. Verify employee summary and employee state sections use current simulation state.
6. Verify project summary and project progress use existing project/progression data.
7. Verify workload and office occupancy reflect available existing systems.
8. Verify bottlenecks, risks, productivity, activity, and conversation summary show derived data or clear empty states.
9. Verify a short company summary appears without requiring an external integration.
10. Verify moving simulation state forward refreshes dashboard values where the app supports refresh.
11. Verify no task assignment, management action, editing, dialogue, project control, or direct employee-control affordance appears.
12. Verify existing office movement, employee insight, employee knowledge, project portal, and overlays still work.

## Required Validation Commands

Run before any phase commit:

```powershell
npm test
npx tsc --noEmit
npm run build
git diff --check
git diff --cached --check
```

## Expected Result

The player can understand the current company state within a few seconds, and the UI remains a read-only aggregation of existing simulation data through the Internal Simulation provider.
