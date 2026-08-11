# Research: Spec 086 - Approved Re-Review Promotion Execution Foundation

## Decision: Reuse the existing Review Decision promotion path

**Rationale**: The current controller promotes through `ReviewDecisionService.promote`, which reclassifies the live review chain and writes immutable promotion/result records. Reusing that path keeps post-validation promotion execution aligned with original review promotion execution.

**Alternatives considered**: Add a post-validation-specific promotion service. Rejected because it would duplicate promotion preconditions and increase drift risk between original and continuation promotion behavior.

## Decision: Verify promotion result semantics, not only promotion record fields

**Rationale**: Earlier coverage proves the promotion record points to the post-validation reviewer runtime. Spec 086 needs execution certainty: the user action must also produce the granted result record and remain idempotent on repeat.

**Alternatives considered**: Only inspect the final promotion collection. Rejected because a missing or stale result record would leave the workflow audit trail incomplete.

## Decision: Prove Promote does not start downstream execution by count snapshots

**Rationale**: The post-validation path already has prior fix, validation, target, and reviewer records. Count snapshots around the Promote input prove promotion execution itself does not start additional stages.

**Alternatives considered**: Assert the collections are empty. Rejected because this continuation flow legitimately contains earlier records before Promote is pressed.
