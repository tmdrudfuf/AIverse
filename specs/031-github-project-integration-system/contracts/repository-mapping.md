# Contract: Repository Mapping

## Purpose

Define the relationship between one AIverse project and one GitHub repository reference.

## Mapping Fields

- AIverse project id
- external source id
- GitHub owner
- GitHub repository name
- repository URL metadata
- visibility expectation
- enabled/disabled state
- timestamps where available

## Invariants

- Mapping data is not GitHub repository state.
- Mapping data is not AIverse task or employee state.
- Disabling a mapping must not delete internal simulation state.
- Invalid mappings must produce unavailable source status.
- Multiple AIverse projects may reference the same repository only when explicitly configured.

## Product Decision Pending

Repository selection flow requires approval before implementation:

- developer-configured mapping
- player-entered owner/name
- authenticated repository picker
