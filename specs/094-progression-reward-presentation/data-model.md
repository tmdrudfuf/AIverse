# Data Model: Progression Reward Presentation

## Visible Progression Reward Presentation

**Purpose**: A fixed city HUD panel that displays latest progression reward summaries.

**Fields**:

- `visible`: true only when at least one reward row exists
- `title`: static reward presentation heading
- `rows`: bounded list of reward presentation rows

**Rules**:

- Hidden when `WorldStateSnapshot.rewards` is empty or missing.
- Shows at most three rows.
- Does not mutate source world-state reward records.
- Is positioned separately from the existing progression event feed panel.

## Reward Presentation Row

**Purpose**: Display-safe summary of one world-state progression reward.

**Fields**:

- `id`: source reward id
- `title`: reached level and company stage summary
- `detail`: compact benefit summary containing capacity, floor count, and unlocked zones

**Rules**:

- Rows preserve reward order after selecting the latest bounded rewards.
- Long zone lists are summarized with a remaining count.
- Detail text is truncated to the compact HUD row budget.
- Returned rows are plain display objects and can be mutated without affecting rewards.

## World-State Reward Snapshot

**Purpose**: Existing copied reward list supplied by city world-state synchronization.

**Fields**:

- `rewards`: copied list of progression rewards

**Rules**:

- Empty lists render no presentation.
- Non-empty lists render bounded rows in reward order.
- Source rewards remain unchanged after presentation formatting.
