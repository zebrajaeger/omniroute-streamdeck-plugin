# quota-connection-dialog Specification

## Purpose

Provides a discoverable way to open shared OmniRoute connection settings from the Quota action without requiring a separate connection action on the Stream Deck.

## Requirements

### Requirement: Open the connection settings modal from Quota settings
The Quota action SHALL expose a connection-icon button in its Property Inspector. Selecting the button SHALL open a modal dialog containing the shared OmniRoute connection settings form.

#### Scenario: Open connection settings from Quota
- **WHEN** a user selects the connection-icon button in the Quota Property Inspector
- **THEN** a modal dialog opens with the connection settings form

#### Scenario: Dismiss the modal without changing settings
- **WHEN** a user dismisses the connection settings modal without saving
- **THEN** no connection setting is changed

### Requirement: Make the Quota settings inspector available
The Quota action SHALL provide a Property Inspector that contains the connection-settings entry point.

#### Scenario: Configure a Quota action
- **WHEN** a user selects a Quota key in Stream Deck
- **THEN** its Property Inspector displays the connection-icon button
