# connection-settings Specification

## Purpose

Defines how users configure and persist the shared OmniRoute instance URL and API key from the Stream Deck plugin, so every use of the plugin can rely on one connection configuration.

## Requirements

### Requirement: Provide a connection settings entry point
The plugin SHALL provide access to connection settings from the Quota action's Property Inspector through a connection-icon button that opens a modal dialog. The settings form SHALL be shown in that modal and SHALL NOT require a standalone connection-settings action or an inline connection-settings Property Inspector.

#### Scenario: Open connection settings
- **WHEN** a user selects the connection-icon button in the Quota Property Inspector
- **THEN** the modal displays the connection settings form

#### Scenario: No standalone connection action is needed
- **WHEN** a user wants to configure the OmniRoute connection
- **THEN** the user can open settings from the Quota action without placing a separate connection-settings action on a key

### Requirement: Edit the connection settings with standard Stream Deck components
The connection settings form SHALL provide exactly two ordinary text fields, one for the OmniRoute instance URL and one for the API key, and **Cancel** and **Save** buttons. It SHALL use existing official Stream Deck Property Inspector components and SHALL NOT introduce custom UI components. The form SHALL be presented within the modal opened from the Quota Property Inspector.

#### Scenario: Display connection fields and actions
- **WHEN** the connection settings modal is displayed
- **THEN** it contains an editable URL text field, an editable API-key text field, and Cancel and Save controls

#### Scenario: Treat the API key as ordinary text
- **WHEN** a user enters or views the API key in the form
- **THEN** the field behaves as an ordinary text field, without masking or additional security behavior

### Requirement: Persist one shared connection configuration
The plugin SHALL persist the URL and API key as plugin-wide settings, shared by all Quota action instances. Whenever the connection settings modal is opened, it SHALL prefill both fields with the currently saved values; if no values have been saved, both fields SHALL be empty.

#### Scenario: Reopen settings with saved values
- **WHEN** a user opens the connection settings modal after saving a URL and API key
- **THEN** both fields are prefilled with those saved values

#### Scenario: Share settings across action instances
- **WHEN** a user saves connection settings through one Quota action instance and opens the modal from another instance
- **THEN** the second instance shows the same saved URL and API key

### Requirement: Save or discard edits explicitly
Changes made in the fields SHALL remain drafts until the user selects **Save**. Selecting **Save** SHALL persist both current field values together as the plugin-wide connection configuration. Selecting **Cancel** SHALL discard the draft and leave the last saved values unchanged.

#### Scenario: Save edited values
- **WHEN** a user edits either or both fields and selects Save
- **THEN** both current values are persisted and are shown when the modal is next opened

#### Scenario: Cancel edited values
- **WHEN** a user edits either or both fields and selects Cancel
- **THEN** the modal closes, the edits are discarded, and the last saved values remain unchanged

### Requirement: Do not validate or test connection values
The form SHALL accept entered URL and API-key text without validating its format or testing connectivity to the configured OmniRoute instance.

#### Scenario: Save values without validation
- **WHEN** a user saves arbitrary text in either field, including empty text
- **THEN** the form persists the entered values without a format or connectivity check
