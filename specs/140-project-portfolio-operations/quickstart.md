# Quickstart: Project Portfolio Operations

## Targeted Validation

Run focused automated coverage while implementing:

```powershell
npm test -- PortfolioOperationsService CityProjectOperationsStatusService CityBuildingLayer BuildingInteractionPrompt BuildingTransitionController
```

## Runtime Visual Evidence

Use deterministic browser/session fixtures to render at least four project companies:

- Project A: Active implementation
- Project B: Needs Attention or Blocked
- Project C: Idle
- Project D: Recently Completed or Disconnected

Evidence must show:

1. Distinct compact building treatments in city view.
2. Selecting a company shows that project summary.
3. Entering the selected company preserves canonical project id and state.
4. Returning to the city and visiting another company does not contaminate project state.

## ADOS Boundary

This runtime does not run the full configured ADOS validation pipeline, review, publication, merge, deployment, or GitHub mutation. ADOS performs authoritative validation after implementation.
