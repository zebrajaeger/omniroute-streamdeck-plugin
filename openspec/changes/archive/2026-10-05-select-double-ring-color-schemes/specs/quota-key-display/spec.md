## ADDED Requirements

### Requirement: Select a double-ring color scheme per key
The Quota Property Inspector SHALL offer exactly ten visibly distinct predefined color schemes for the double-ring presentation, including the existing cyan/violet appearance as the default. For each scheme, the outer and inner ring SHALL use different, readily distinguishable accent colors against the key background and neutral tracks; window identification SHALL continue to use ring position and nonnumeric labels, not color alone. The scheme selection SHALL be stored independently in the settings of each Quota key and restored after reopening its inspector or restarting the plugin. Changing a scheme SHALL update a visible double-ring key from current shared quota data without another quota request and SHALL NOT alter other keys, their connection assignment, display name or presentation. In the text presentation, the saved scheme SHALL NOT change the image. Missing, malformed or unsupported saved scheme identifiers SHALL display the default scheme on the key and in the inspector without silently rewriting the saved identifier; an explicit user selection SHALL replace it. Ring geometry, quota progress and status indications SHALL remain the same across schemes.

#### Scenario: All ten schemes are selectable
- **WHEN** the double-ring color selector is opened
- **THEN** it lists ten distinct schemes, each with a stable identifier and distinguishable outer and inner ring accents

#### Scenario: Select a distinctive scheme
- **WHEN** a user chooses a non-default scheme for a visible double-ring key with two quota windows
- **THEN** that key displays the selected outer and inner accent colors without an additional quota request, and the windows remain identifiable by position and labels

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
