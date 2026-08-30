# Contract: In-Office Development Request

## Target Resolution

- Mutation target is `activeProjectCompanyContext.projectId` when active context exists.
- `selectedProjectId` may be used only when there is no active office context.
- If the active project is unavailable, request creation/preparation/execution returns disabled or blocked state.

## Request Preparation

Input:

- Active project/company context
- Registered project identity
- Full request text
- Existing request/preparation/run records for the same project

Output:

- Project-scoped development request record
- Durable requirements artifact metadata
- Prepared ADOS run metadata with feature identity and requirements file path

Guarantees:

- Full request text is preserved in requirements content.
- Raw request text is not placed into command arguments.
- Hard-coded AIverse Spec 138 and older Spec 130 identities are not used as target project feature identity.

## Execution Start

Input:

- Project id from target resolution
- Matching registered project
- Matching prepared ADOS metadata
- Optional existing execution record

Output:

- Accepted execution record and result, or blocked/failed result only

Guarantees:

- Existing execution prevents duplicate spawn.
- Missing local binding or unsafe command blocks.
- Provider acceptance is required before showing started.
