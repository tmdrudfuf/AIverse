# Research: Runtime Preflight Foundation

## Decision: Provider-Neutral Evidence

Runtime Preflight introduces a provider interface rather than placing OS or process logic in controller/domain code. This keeps browser-facing product code buildable and testable while allowing later runtime adapters to supply real local evidence.

## Decision: Deterministic Latest Snapshot

Preflight identity is `<projectId>:runtime-preflight:<executionPlanId>:preflight-v1`. Result identity follows the same pattern. Repeated commands update the latest deterministic collection entry, preserving stable active state and avoiding duplicate rows.

## Decision: Approval Revalidation in Preflight

The preflight service directly validates approval exact-context binding, including the Spec 072 P3 explicit plan-ID guard. Plan and readiness revalidation remain delegated to the existing services through controller order.

## Decision: Unsafe Command Detection

Safety validation checks command and arguments together before any spawn-capable checks. Remote-mutating Git/GitHub commands and destructive shell patterns are blocked as unsafe evidence.
