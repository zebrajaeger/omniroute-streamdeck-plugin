## Purpose

Defines how users configure and persist the shared OmniRoute instance URL and API key from the Stream Deck plugin, so every use of the plugin can rely on one connection configuration.

## ADDED Requirements

### Requirement: Provide a connection settings entry point
The plugin SHALL expose a dedicated OmniRoute connection action in Stream Deck. Selecting that action SHALL show the connection settings form in its Property Inspector. The form is an inline Property Inspector surface, not a separate operating-system modal dialog.

#### Scenario: Open connection settings
- **WHEN** a user selects the OmniRoute connection action in Stream Deck
- **THEN** the Property Inspector displays the connection settings form

### Requirement: Edit the connection settings with standard Stream Deck components
The connection settings form SHALL provide exactly two ordinary text fields, one for the OmniRoute instance URL and one for the API key, and **Cancel** and **Save** buttons. It SHALL use existing official Stream Deck Property Inspector components and SHALL NOT introduce custom UI components.

#### Scenario: Display connection fields and actions
- **WHEN** the connection settings form is displayed
- **THEN** it contains an editable URL text field, an editable API-key text field, and Cancel and Save controls

#### Scenario: Treat the API key as ordinary text
- **WHEN** a user enters or views the API key in the form
- **THEN** the field behaves as an ordinary text field, without masking or additional security behavior

### Requirement: Persist one shared connection configuration
The plugin SHALL persist the URL and API key as plugin-wide settings, shared by all instances of the connection action. Whenever the Property Inspector is opened, it SHALL prefill both fields with the currently saved values; if no values have been saved, both fields SHALL be empty.

#### Scenario: Reopen settings with saved values
- **WHEN** a user opens the connection settings after saving a URL and API key
- **THEN** both fields are prefilled with those saved values

#### Scenario: Share settings across action instances
- **WHEN** a user saves connection settings through one instance of the connection action and opens the Property Inspector for another instance
- **THEN** the second instance shows the same saved URL and API key

### Requirement: Save or discard edits explicitly
Changes made in the fields SHALL remain drafts until the user selects **Save**. Selecting **Save** SHALL persist both current field values together as the plugin-wide connection configuration. Selecting **Cancel** SHALL discard the draft and leave the last saved values unchanged.

#### Scenario: Save edited values
- **WHEN** a user edits either or both fields and selects Save
- **THEN** both current values are persisted and are shown when the form is next opened

#### Scenario: Cancel edited values
- **WHEN** a user edits either or both fields and selects Cancel
- **THEN** the edits are discarded and the last saved values remain unchanged

### Requirement: Do not validate or test connection values
The form SHALL accept entered URL and API-key text without validating its format or testing connectivity to the configured OmniRoute instance.

#### Scenario: Save values without validation
- **WHEN** a user saves arbitrary text in either field, including empty text
- **THEN** the form persists the entered values without a format or connectivity check
