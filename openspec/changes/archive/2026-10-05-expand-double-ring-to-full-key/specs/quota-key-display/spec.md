## MODIFIED Requirements

### Requirement: Display generic quota windows compactly
The key SHALL render a readable combined 72×72 layout with up to two quota windows in its selected presentation. Window keys SHALL be selected in lexicographic Unicode code-point order independent of response ordering; the first selected window SHALL occupy the first text row or outer ring and the second SHALL occupy the second text row or inner ring. The text presentation SHALL identify each displayed window and show its normalized remaining percentage rounded to the nearest integer, `∞` for unlimited, or `?` for unknown. In the double-ring presentation, identification SHALL remain possible without relying on color alone; the bottom row of numeric percentages SHALL NOT be shown, and remaining limited quota SHALL instead be visualized by ring fill. Zero SHALL remain zero progress, not an error or unknown value. If more than two windows exist, an overflow indicator SHALL reveal the number of omitted windows. Labels and the display name SHALL be deterministically shortened to fit without hiding the text presentation's quota values or the ring presentation's status. The text presentation SHALL preserve its existing layout when no custom name is configured.

#### Scenario: Codex session and weekly values
- **WHEN** an assigned snapshot has `session` remaining 84 percent and `weekly` remaining 76 percent
- **THEN** both presentations show the effective display name, the text presentation shows `84%` and `76%`, and the double-ring presentation shows corresponding outer and inner fills without a bottom percentage row

#### Scenario: Non-Codex windows and overflow
- **WHEN** a provider supplies three arbitrary quota-window keys
- **THEN** either presentation displays the lexicographically first two windows and an indicator that one further window exists

#### Scenario: Unlimited, unknown and exhausted
- **WHEN** a rendered window is unlimited, unknown or exhausted
- **THEN** text shows respectively `∞`, `?` or `0%`, while double-ring shows distinct nonnumeric special states or an empty progress arc respectively, without a fabricated percentage

### Requirement: Visualize remaining quotas as concentric rings
The double-ring presentation SHALL show both selected windows on one 72×72 key as concentric progress rings spanning nearly the full usable key area without clipping, with the effective display name in the center. For `session` and `weekly`, session SHALL be outer and weekly inner. Limited windows SHALL fill clockwise from twelve o'clock in proportion to their normalized remaining percentage, with a visible neutral background track; zero SHALL have no progress arc and 100 percent SHALL form a complete progress ring. The two windows SHALL have distinct, consistent visual styling and remain identifiable by outer/inner position and concise nonnumeric window labels, without relying on color alone. The bottom row of numeric window values SHALL be omitted in this presentation. Unlimited and unknown windows SHALL have distinct nonnumeric indicators rather than fabricated numeric fill. A single window SHALL use only the outer ring, without inventing a second value. No-window, loading, configuration and error states SHALL remain explicit without invented arcs. Cached quota rings SHALL retain a visible stale marker and error-category indicator until recovery; optional plan and overflow information SHALL remain readable without covering the rings or obscuring the state.

#### Scenario: Two remaining quotas
- **WHEN** double-ring is selected for session remaining 84 percent and weekly remaining 76 percent
- **THEN** the outer ring is 84 percent filled, the inner ring is 76 percent filled, the name appears centrally, both windows can be identified without relying on color alone, and no `S 84%` or `W 76%` bottom row appears

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
