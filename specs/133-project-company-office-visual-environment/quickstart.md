# Quickstart: Project Company Office Visual Environment

## Focused Validation

Run the focused tests for the office visual environment feature:

```powershell
npx vitest run src/features/city-view/scene/office/OfficeVisualEnvironment.test.ts src/features/city-view/scene/office/OfficeVisualLayer.test.ts
```

Expected result: both test files pass, covering enabled detail reads, defensive copies, validation, rendering with environment details, optional metadata, refresh isolation, and destroy cleanup.

Run whitespace validation:

```powershell
git diff --check
```

Expected result: no whitespace errors.

## Manual Scenario

1. Enter the Daily Proof office from the city.
2. Confirm the office title, foundation zones, and environment details are visible.
3. Open the project workspace from the existing computer interaction.
4. Close or exit the workflow and return to the city through the existing exit zone.

Expected result: environment visuals add office atmosphere without changing portal or exit behavior.
