# quota-key-display Specification

## Purpose

Zeigt die verbleibenden Quotas der jeweils zugeordneten OmniRoute-Verbindung kompakt auf Stream-Deck-Tasten und macht fehlende, veraltete oder fehlerhafte Daten sichtbar.

## Requirements

### Requirement: Render the assigned provider snapshot
Each Quota key SHALL render only the snapshot matching its saved `connectionId`, using the shared data source rather than making its own HTTP request. The key SHALL show provider and optional plan as its heading. Multiple keys assigned to different accounts of the same provider SHALL remain independent. Becoming visible or changing action settings SHALL update the key from the current shared state.

#### Scenario: Show two accounts independently
- **WHEN** two visible keys are assigned to two different Codex connection IDs with different remaining quotas
- **THEN** each key displays the values belonging to its own connection without overwriting the other key

#### Scenario: Reappear after background updates
- **WHEN** a previously hidden assigned key becomes visible
- **THEN** it displays the latest shared state rather than its old rendered values

### Requirement: Display generic quota windows compactly
The key SHALL render a readable combined 72×72 layout with up to two quota windows. Window keys SHALL be selected in lexicographic order independent of response ordering. Each line SHALL identify the quota key and show the normalized remaining percentage rounded to the nearest integer, `∞` for unlimited, or `?` for unknown. Zero SHALL remain `0%`, not an error or unknown value. If more than two windows exist, an overflow indicator SHALL reveal the number of omitted windows. Labels SHALL be deterministically shortened to fit without hiding the quota value.

#### Scenario: Codex session and weekly values
- **WHEN** an assigned snapshot has `session` remaining 84 percent and `weekly` remaining 76 percent
- **THEN** the key shows the provider heading and both windows with `84%` and `76%`

#### Scenario: Non-Codex windows and overflow
- **WHEN** a provider supplies three arbitrary quota-window keys
- **THEN** the key displays the lexicographically first two keys and an indicator that one further window exists

#### Scenario: Unlimited, unknown and exhausted
- **WHEN** a rendered window is unlimited, unknown or exhausted
- **THEN** its value is respectively `∞`, `?` or `0%`, without a fabricated percentage

### Requirement: Make configuration and data failures visible
The key SHALL distinguish unassigned action, missing/invalid shared configuration, initial loading, missing selected connection after a successful snapshot, unknown quota for a connection without windows, authentication failure, unavailable OmniRoute and invalid response. A service error SHALL NOT be mislabeled as a missing connection or exhausted quota. No credentials or raw server errors SHALL appear on the key.

#### Scenario: Unassigned action
- **WHEN** a Quota key has no connection ID
- **THEN** it displays a configure/select-connection state rather than quota values

#### Scenario: Selected connection disappears
- **WHEN** a successful current snapshot does not contain the selected connection ID
- **THEN** the key shows connection unavailable and retains the assignment rather than showing another account

#### Scenario: Authentication failure without previous data
- **WHEN** the shared source reports HTTP 401/403 and no usable snapshot exists
- **THEN** the key shows an authentication failure without inventing quota values

### Requirement: Mark stale values and recover promptly
If the shared source retains a previous successful snapshot after an error, the key SHALL display matching cached values only with a visible stale marker and an error-category indicator. A successful refresh SHALL remove that marker and update the values. A global configuration change SHALL remove old-instance values immediately. Key visibility SHALL NOT create additional polling loops, and hidden or removed keys SHALL NOT continue receiving rendering updates.

#### Scenario: Preserve data during a transient outage
- **WHEN** OmniRoute becomes unavailable after a successful snapshot
- **THEN** the assigned key shows the last known values visibly marked stale with an unavailable indicator

#### Scenario: Switch instance while old data exists
- **WHEN** the shared OmniRoute URL or API key changes
- **THEN** old values are removed until data from the new configuration is available

#### Scenario: Hidden key stops rendering
- **WHEN** a Quota key disappears from the visible profile
- **THEN** subsequent shared-state changes do not render to that hidden key
