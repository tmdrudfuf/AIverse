# Contract: Office Progression Visual State

## Consumer

`CompanyOfficeScene`

## Provider

`OfficeProgressionVisualStateLayer`

## Interface

```ts
type OfficeProgressionVisualStateLayer = {
  update(progression?: CompanyProgressionSnapshot, layout?: OfficeLayoutSnapshot): void;
  destroy(): void;
};
```

## View-Model Helper

```ts
function createOfficeProgressionVisualStateViewModel(
  progression?: CompanyProgressionSnapshot,
  layout?: OfficeLayoutSnapshot,
): OfficeProgressionVisualStateViewModel;
```

## Expected Behavior

- `update()` renders a visible summary and active-zone markers when both progression and layout are available.
- `update()` hides and clears marker text when either input is missing.
- `destroy()` destroys all Phaser display objects owned by the layer.
- The helper returns bounded, display-safe data without mutating inputs.
