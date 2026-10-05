## MODIFIED Requirements

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
