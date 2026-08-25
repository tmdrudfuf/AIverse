# Contract: Repository Identity Edit Overlay

## Entry Point

- Surface: Project Portal Project Dashboard for the external project draft.
- Trigger: Activate the dashboard action when the selected dashboard project is the external project draft.
- Expected result: Portal switches to repository identity edit overlay mode with a selected identity choice.

## Overlay Controls

- `Up` / `Down`: Move between available identity choices.
- `Enter`: Apply the selected identity choice, persist browser session state, return to the project dashboard.
- `Space` / action: Apply the selected identity choice, persist browser session state, return to the project dashboard.
- `Esc`: Cancel the overlay and return to the project dashboard without registry mutation or browser-session save caused by the overlay.

## Data Contract

- Applying a choice updates the external project draft registry entry.
- Derived portal project rows must be re-created from registry entries.
- Repository mappings must be re-created from registry entries and remain absent for local-only unknown choices.
- No live repository validation, filesystem reads, GitHub reads, repository writes, runtime starts, or agent starts are allowed.
