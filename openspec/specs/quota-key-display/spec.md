# quota-key-display Specification

## Purpose

Zeigt die verbleibenden Quotas der jeweils zugeordneten OmniRoute-Verbindung kompakt auf Stream-Deck-Tasten und macht fehlende, veraltete oder fehlerhafte Daten sichtbar.

## Requirements

### Requirement: Render the assigned provider snapshot
Each Quota key SHALL render only the snapshot matching its saved `connectionId`, using the shared data source rather than making its own HTTP request. Each key SHALL remain assigned to exactly one provider connection. The key SHALL show its effective display name (a nonblank custom name, otherwise the provider name) and optional plan. Multiple keys assigned to different accounts of the same provider SHALL remain independent. Becoming visible or changing action settings, including presentation or name, SHALL update the key from the current shared state without additional quota requests.

#### Scenario: Show two accounts independently
- **WHEN** two visible keys are assigned to two different Codex connection IDs with different remaining quotas
- **THEN** each key displays the values belonging to its own connection without overwriting the other key

#### Scenario: Reappear after background updates
- **WHEN** a previously hidden assigned key becomes visible
- **THEN** it displays the latest shared state using its saved presentation and name rather than its old rendered values

#### Scenario: Change presentation without fetching quotas
- **WHEN** a user changes the presentation or display name of an assigned visible key
- **THEN** that key updates using the current shared state without an additional quota request or changing another key

### Requirement: Display generic quota windows compactly
The key SHALL render a readable combined 72×72 layout with up to two quota windows in its selected presentation. Window keys SHALL be selected in lexicographic Unicode code-point order independent of response ordering; the first selected window SHALL occupy the first text row or outer ring and the second SHALL occupy the second text row or inner ring. Each displayed window SHALL identify the quota key and show the normalized remaining percentage rounded to the nearest integer, `∞` for unlimited, or `?` for unknown. Zero SHALL remain `0%`, not an error or unknown value. If more than two windows exist, an overflow indicator SHALL reveal the number of omitted windows. Labels and the display name SHALL be deterministically shortened to fit without hiding quota values. The text presentation SHALL preserve its existing layout when no custom name is configured.

#### Scenario: Codex session and weekly values
- **WHEN** an assigned snapshot has `session` remaining 84 percent and `weekly` remaining 76 percent
- **THEN** both selected presentations show the effective display name and both windows with `84%` and `76%`

#### Scenario: Non-Codex windows and overflow
- **WHEN** a provider supplies three arbitrary quota-window keys
- **THEN** either presentation displays the lexicographically first two keys and an indicator that one further window exists

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

### Requirement: Select and persist a presentation per key
The Quota Property Inspector SHALL offer the available presentations, initially text and double-ring, using a presentation selector. A selected presentation SHALL be persisted with a stable identifier in that action's settings while preserving the connection assignment, display name and unrelated settings. Changing the selection SHALL update the visible key to the newly selected presentation from the current shared quota state without an additional quota request; it SHALL NOT alter another key's presentation. Missing, malformed or unsupported presentation identifiers SHALL render and appear in the inspector as text without silently rewriting an unsupported saved identifier. Reopening the inspector or restarting the plugin SHALL restore supported selections. Additional registered presentations SHALL be available through the same selector.

#### Scenario: Existing key remains compatible
- **WHEN** an existing assigned key has no presentation setting
- **THEN** it uses the existing text presentation and the inspector shows text selected

#### Scenario: Change presentation and persist it
- **WHEN** a user selects double-ring instead of text for a visible assigned key with current quota data
- **THEN** that key displays double-ring without an additional quota request, its action settings retain the selection together with its connection, name and unrelated settings, and other keys remain unchanged

#### Scenario: Switch back to text
- **WHEN** a user selects text for a visible key previously set to double-ring
- **THEN** that key displays text without an additional quota request and text is stored as its selected presentation

#### Scenario: Restore independent presentations
- **WHEN** two keys use text and double-ring respectively and their inspectors are reopened after a restart
- **THEN** each retains its own presentation, connection and name

#### Scenario: Unsupported saved presentation
- **WHEN** a key has an unsupported saved presentation identifier
- **THEN** the key safely renders text and the inspector shows text without modifying the stored identifier until the user explicitly selects a presentation

#### Scenario: Extend available presentations
- **WHEN** a further presentation is registered in the plugin
- **THEN** it is selectable and restorable through the existing per-key selection mechanism without changing connection selection or quota polling behavior

### Requirement: Configure a display name per key
The Quota Property Inspector SHALL provide an editable name field for the key. Without a saved nonblank custom name, the field SHALL be prefilled from the assigned provider name currently used as the key heading when metadata is available, and the key SHALL use that automatic provider name. This automatic prefill SHALL NOT itself create a custom override. A user-entered nonblank name SHALL be saved only in that action's settings and used in both presentations. Clearing the field or entering whitespace only SHALL remove the override and restore the automatic provider name. Changing the connection SHALL update an automatic name but SHALL NOT overwrite a custom name. Opening the inspector before provider metadata arrives SHALL NOT save a placeholder as a custom name. User text SHALL be safely rendered without executing markup or breaking the key image.

#### Scenario: Prefill existing heading
- **WHEN** a Codex key without a custom name opens its inspector and assigned provider metadata is available
- **THEN** the name field is prefilled with the provider name used by the existing heading without saving a custom override

#### Scenario: Preserve a custom name
- **WHEN** a user saves `Work` as the name, switches presentation or connection, and restarts the plugin
- **THEN** that key retains `Work` while other keys remain unchanged

#### Scenario: Restore automatic naming
- **WHEN** the user clears a custom name or replaces it with whitespace
- **THEN** the override is removed and the assigned provider name is used again

#### Scenario: Delayed metadata and unsafe text
- **WHEN** the inspector opens before discovery finishes and the user subsequently enters text containing XML or HTML delimiters
- **THEN** delayed metadata does not overwrite the user's edit and the text is treated as plain text in the inspector and key image

### Requirement: Visualize remaining quotas as concentric rings
The double-ring presentation SHALL show both selected windows on one key as concentric progress rings, with the effective display name in the center. For `session` and `weekly`, session SHALL be outer and weekly inner. Limited windows SHALL fill clockwise from twelve o'clock in proportion to their normalized remaining percentage, with a visible neutral background track; zero SHALL have no progress arc and 100 percent SHALL form a complete progress ring. The two windows SHALL have distinct, consistent visual styling and readable key/value labels so identification does not rely on color alone. Numeric ring fill SHALL use the normalized value, while its text uses nearest-integer rounding. Unlimited and unknown windows SHALL show `∞` and `?` respectively with distinct nonnumeric styling rather than fabricated numeric fill. A single window SHALL use only the outer ring, without inventing a second value. No-window, loading, configuration and error states SHALL remain explicit without invented arcs. Cached quota rings SHALL retain the existing visible stale marker and error-category indicator until recovery; optional plan and overflow information SHALL remain readable without obscuring values.

#### Scenario: Two remaining quotas
- **WHEN** double-ring is selected for session remaining 84 percent and weekly remaining 76 percent
- **THEN** the outer ring is 84 percent filled, the inner ring is 76 percent filled, the name appears centrally, and `S 84%` and `W 76%` are readable and attributable

#### Scenario: Zero, full and fractional quota
- **WHEN** a limited window has remaining percentage 0, 100 or 12.5
- **THEN** its ring has respectively no progress arc, a complete progress ring or 12.5 percent fill, with text `0%`, `100%` or `13%`

#### Scenario: One window or special values
- **WHEN** a snapshot has only one window, or selected windows are unlimited or unknown
- **THEN** a sole window appears as the outer ring and special values use their nonnumeric indicators without a fabricated second value or percentage

#### Scenario: Stale rings and recovery
- **WHEN** a transient outage retains an assigned snapshot and a later refresh succeeds
- **THEN** cached rings first show a visible stale marker with error category and then update to current values with that marker removed

#### Scenario: No usable quota data
- **WHEN** the assigned connection has no windows or no usable snapshot is available because of loading, configuration or a service error
- **THEN** double-ring shows the applicable explicit status rather than fabricated quota progress
