# Data Model: Spec 089 - Company Progression Trigger Foundation

## CompanyProgressionTrigger

- `triggerId`: deterministic id for the reached level, e.g. `company-level-2-reached`
- `triggerType`: currently `company_level_reached`
- `source`: currently `company_progression`
- `fromLevel`: previous resolved company level
- `toLevel`: newly reached company level
- `companyStage`: reached level's stage
- `layoutId`: reached level's layout id
- `floorCount`: reached level's floor count
- `maxEmployees`: reached level's capacity
- `unlockedOfficeZones`: copied list of zones available at the reached level
- `milestones`: copied evaluated milestones for the reached level

## CompanyProgressionTriggerEvaluation

- `previousSnapshot`: optional previous `CompanyProgressionSnapshot`
- `currentSnapshot`: optional current `CompanyProgressionSnapshot`
- `reachedSnapshots`: snapshots for levels reached during an upward transition

## ProjectPortalState.companyProgressionTriggers

- Latest computed `CompanyProgressionTrigger[]`
- Empty on initialization, unchanged progression, or regression
- In-memory only
