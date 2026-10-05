## MODIFIED Requirements

### Requirement: Render the assigned provider snapshot
Each Quota key SHALL render only the snapshot matching its saved `connectionId`, using the shared data source rather than making its own HTTP request. Each key SHALL remain assigned to exactly one provider connection. The key SHALL show its effective display name (a nonblank custom name, otherwise the provider name); the optional plan SHALL appear in the text presentation but SHALL NOT appear in the double-ring presentation. Multiple keys assigned to different accounts of the same provider SHALL remain independent. Becoming visible or changing action settings, including presentation or name, SHALL update the key from the current shared state without additional quota requests.

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
The key SHALL render a readable combined 72×72 layout with up to two quota windows in its selected presentation. Window keys SHALL be selected in lexicographic Unicode code-point order independent of response ordering; the first selected window SHALL occupy the first text row or outer ring and the second SHALL occupy the second text row or inner ring. The text presentation SHALL identify each displayed window and show its normalized remaining percentage rounded to the nearest integer, `∞` for unlimited, or `?` for unknown. In the double-ring presentation the order and outer/inner position SHALL remain stable, but the center SHALL NOT show window labels, including `S / W`, nor the bottom row of numeric percentages; remaining limited quota SHALL instead be visualized by ring fill. Zero SHALL remain zero progress, not an error or unknown value. If more than two windows exist, an overflow indicator SHALL reveal the number of omitted windows. Labels and the display name SHALL be deterministically shortened to fit without hiding the text presentation's quota values or the ring presentation's status. The text presentation SHALL preserve its existing layout when no custom name is configured.

#### Scenario: Codex session and weekly values
- **WHEN** an assigned snapshot has `session` remaining 84 percent and `weekly` remaining 76 percent
- **THEN** both presentations show the effective display name, the text presentation shows `84%` and `76%`, and the double-ring presentation shows corresponding outer and inner fills without a window legend or bottom percentage row

#### Scenario: Non-Codex windows and overflow
- **WHEN** a provider supplies three arbitrary quota-window keys
- **THEN** either presentation displays the lexicographically first two windows and an indicator that one further window exists; double-ring uses outer/inner position rather than a center label

#### Scenario: Unlimited, unknown and exhausted
- **WHEN** a rendered window is unlimited, unknown or exhausted
- **THEN** text shows respectively `∞`, `?` or `0%`, while double-ring shows distinct nonnumeric special states or an empty progress arc respectively, without a fabricated percentage

### Requirement: Configure a display name per key
The Quota Property Inspector SHALL provide an editable name field for the key. Without a saved nonblank custom name, the field SHALL be prefilled from the assigned provider name currently used as the key heading when metadata is available, and the key SHALL use that automatic provider name. This automatic prefill SHALL NOT itself create a custom override. A user-entered nonblank name SHALL be saved only in that action's settings and used in both presentations. An explicit change to the name field SHALL persist even when no settings notification follows the write, and SHALL update the visible key from the current shared quota state without a new quota request. The two literal characters `\n` in a custom name SHALL create a line break on the key in both presentations. The resulting text block SHALL be horizontally and vertically centered within the existing name area in the text presentation; in the double-ring presentation the effective name, including the automatic name or a single-line custom name, SHALL be horizontally and vertically centered in the ring center instead of the plan and window legend. The text presentation SHALL retain its quota, plan and status positions; the ring presentation SHALL retain its ring, status and overflow positions. Without a custom name, the text presentation's existing single-line automatic-name layout SHALL remain unchanged. Clearing the field or entering whitespace only SHALL remove the override and restore the automatic provider name. Changing the connection SHALL update an automatic name but SHALL NOT overwrite a custom name. Opening the inspector before provider metadata arrives SHALL NOT save a placeholder as a custom name. User text SHALL be safely rendered without executing markup or breaking the key image.

#### Scenario: Prefill existing heading
- **WHEN** a Codex key without a custom name opens its inspector and assigned provider metadata is available
- **THEN** the name field is prefilled with the provider name used by the existing heading without saving a custom override

#### Scenario: Save a name from the inspector and redraw immediately
- **WHEN** a user edits the Display name field on a visible assigned key to `Work` and commits the edit
- **THEN** `Work` is saved in that key's action settings and replaces the provider name on that key in either presentation without a quota request or a settings notification, while other keys and unrelated settings remain unchanged

#### Scenario: Preserve a custom name
- **WHEN** a user saves `Work` as the name, switches presentation or connection, and restarts the plugin
- **THEN** that key retains `Work` in its inspector and on the key while other keys remain unchanged

#### Scenario: Explicit line break in a custom name
- **WHEN** a user saves the literal input `Work\nTeam` as the display name and selects either text or double-ring presentation
- **THEN** the name is retained as entered in that key's settings and inspector, and `Work` and `Team` appear as separate lines centered in the text presentation's name area or the double-ring's ring center without obscuring the text view's quota/plan or either view's status information

#### Scenario: Ring center belongs to the effective name
- **WHEN** a double-ring key has two quota windows and an optional plan, with an automatic, single-line custom or multiline custom display name
- **THEN** only the effective name is drawn in the ring center, centered on both axes; the plan and window label such as `S / W` do not appear on the ring key, while the text presentation continues to show its plan and quota labels

#### Scenario: Restore automatic naming
- **WHEN** the user clears a custom name or replaces it with whitespace and commits the edit
- **THEN** the override is removed from that action's settings and the assigned provider name is used again in the field and on the key

#### Scenario: Delayed metadata and unsafe text
- **WHEN** the inspector opens before discovery finishes and the user subsequently enters text containing XML or HTML delimiters
- **THEN** delayed metadata does not overwrite the user's edit and the text is treated as plain text in the inspector and key image

### Requirement: Visualize remaining quotas as concentric rings
The double-ring presentation SHALL show both selected windows on one 72×72 key as concentric progress rings spanning nearly the full usable key area without clipping, with only the effective display name centered inside the rings instead of optional plan text and window labels. For `session` and `weekly`, session SHALL be outer and weekly inner. Limited windows SHALL fill clockwise from twelve o'clock in proportion to their normalized remaining percentage, with a visible neutral background track; zero SHALL have no progress arc and 100 percent SHALL form a complete progress ring. The two windows SHALL have distinct, consistent visual styling and a stable outer/inner position; the center SHALL NOT show a window legend. The bottom row of numeric window values SHALL be omitted in this presentation. Unlimited and unknown windows SHALL have distinct nonnumeric indicators rather than fabricated numeric fill. A single window SHALL use only the outer ring, without inventing a second value. No-window, loading, configuration and error states SHALL remain explicit without invented arcs. Cached quota rings SHALL retain a visible stale marker and error-category indicator until recovery; overflow information SHALL remain readable without covering the rings or obscuring the state. The optional plan SHALL remain available in the text presentation but SHALL NOT appear in the double-ring image.

#### Scenario: Two remaining quotas
- **WHEN** double-ring is selected for session remaining 84 percent and weekly remaining 76 percent, with an optional plan
- **THEN** the outer ring is 84 percent filled, the inner ring is 76 percent filled, only the effective name appears centrally, and neither plan, `S / W` nor a numeric percentage row appears

#### Scenario: Zero, full and fractional quota
- **WHEN** a limited window has remaining percentage 0, 100 or 12.5
- **THEN** its ring has respectively no progress arc, a complete progress ring or 12.5 percent fill, without numeric percentage text in the double-ring presentation

#### Scenario: One window or special values
- **WHEN** a snapshot has only one window, or selected windows are unlimited or unknown
- **THEN** a sole window appears as the outer ring and special values remain identifiable through distinct nonnumeric indicators without a fabricated second value or percentage

#### Scenario: Stale rings and recovery
- **WHEN** a transient outage retains an assigned snapshot and a later refresh succeeds
- **THEN** cached rings first show a visible stale marker with error category and then update to current values with that marker removed

#### Scenario: No usable quota data
- **WHEN** the assigned connection has no windows or no usable snapshot is available because of loading, configuration or a service error
- **THEN** double-ring shows the applicable explicit status rather than fabricated quota progress

### Requirement: Select a double-ring color scheme per key
The Quota Property Inspector SHALL offer exactly ten visibly distinct predefined color schemes for the double-ring presentation, including the existing cyan/violet appearance as the default. For each scheme, the outer and inner ring SHALL use different, readily distinguishable accent colors against the key background and neutral tracks; the outer/inner order SHALL remain stable across palettes and the ring center SHALL be reserved for the effective display name rather than window labels. The scheme selection SHALL be stored independently in the settings of each Quota key and restored after reopening its inspector or restarting the plugin. Changing a scheme SHALL update a visible double-ring key from current shared quota data without another quota request and SHALL NOT alter other keys, their connection assignment, display name or presentation. In the text presentation, the saved scheme SHALL NOT change the image. Missing, malformed or unsupported saved scheme identifiers SHALL display the default scheme on the key and in the inspector without silently rewriting the saved identifier; an explicit user selection SHALL replace it. Ring geometry, quota progress and status indications SHALL remain the same across schemes.

#### Scenario: All ten schemes are selectable
- **WHEN** the double-ring color selector is opened
- **THEN** it lists ten distinct schemes, each with a stable identifier and distinguishable outer and inner ring accents

#### Scenario: Select a distinctive scheme
- **WHEN** a user chooses a non-default scheme for a visible double-ring key with two quota windows
- **THEN** that key displays the selected outer and inner accent colors without an additional quota request, and the stable outer/inner order is preserved without adding window labels in the ring center

#### Scenario: Different keys retain different schemes
- **WHEN** two keys select different schemes and their inspectors are reopened after a plugin restart
- **THEN** each key displays and selects its own saved scheme without changing its connection, name or presentation

#### Scenario: Existing key uses established colors
- **WHEN** an existing double-ring key has no saved scheme
- **THEN** its rings retain the existing cyan/violet colors and its inspector shows the default scheme

#### Scenario: Unknown saved scheme is not overwritten
- **WHEN** a key has a malformed or unsupported saved scheme identifier
- **THEN** its double-ring image and inspector use the default scheme without modifying that saved identifier until the user explicitly chooses a supported scheme

#### Scenario: Text view ignores saved scheme
- **WHEN** a key with a saved non-default scheme switches to text and later back to double-ring
- **THEN** the text image is unchanged by the scheme, and double-ring again uses the saved colors

#### Scenario: Progress and special states do not depend on palette
- **WHEN** a selected scheme renders zero, full, fractional, unlimited, unknown, stale or error states
- **THEN** progress, special indicators and error markers retain their existing meanings; a status without usable quota data does not invent progress rings
