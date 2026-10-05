# quota-provider-selection Specification

## Purpose

Ermöglicht die eindeutige Zuordnung einer Quota-Taste zu einer OmniRoute-Provider-Verbindung, einschließlich mehrerer Accounts desselben Providers.

## Requirements

### Requirement: Discover connections from the configured OmniRoute instance
The plugin SHALL retrieve available connections using `GET /api/usage/quota` with the saved shared URL and bearer API key when the Quota Property Inspector opens or the user requests a reload. Concurrent discovery requests for the same configuration SHALL share one request. Discovery SHALL use `connectionId`, `provider` and optional `name` as metadata and SHALL NOT query provider APIs. Changing shared configuration SHALL invalidate prior discovery data and late responses.

#### Scenario: Open the provider selector
- **WHEN** a user opens the Quota Property Inspector with configured connection settings
- **THEN** the plugin discovers connections from that OmniRoute instance and supplies sanitized options to the inspector

#### Scenario: Two inspectors discover simultaneously
- **WHEN** two consumers request discovery concurrently for the same saved connection
- **THEN** one HTTP request serves both without leaking either inspector's action-specific settings

### Requirement: Select by connection identity
The Quota Property Inspector SHALL present a provider-connection selector and reload control using official Stream Deck UI components. Each option SHALL identify the account name when available, provider and connection ID, including a disambiguation sufficient for equal names/providers. Option values SHALL be `connectionId`, never provider name, label or list position. The existing connection-icon modal entry point SHALL remain available.

#### Scenario: Select one of two Codex accounts
- **WHEN** the discovered list contains two Codex accounts with different connection IDs
- **THEN** the user can distinguish and select either account independently

#### Scenario: Missing account name
- **WHEN** a connection has no usable account name
- **THEN** its provider and connection ID still produce an identifiable selectable option

### Requirement: Persist an independent assignment for each key
Selecting a connection SHALL persist its `connectionId` in that action's settings while preserving unrelated settings. Reopening the inspector or restarting the plugin SHALL restore the selection. The plugin SHALL NOT auto-select the first connection, replace other keys' selections, or copy the global URL/API key into action settings. Explicitly clearing the selector SHALL remove that action's assignment.

#### Scenario: Restore independent assignments
- **WHEN** two Quota keys have different saved connection IDs and their inspectors are reopened
- **THEN** each inspector restores only its own assignment

#### Scenario: Configure an existing unassigned key
- **WHEN** a Quota key has no saved connection ID
- **THEN** it remains unassigned until the user explicitly selects a connection

### Requirement: Preserve assignments during discovery failures
The inspector SHALL distinguish loading, ready, no connections, missing/invalid shared configuration, authentication failure, unavailable service and invalid response. During loading or failure it SHALL NOT silently change the stored connection ID. A saved ID absent from a successful discovery result SHALL be shown as unavailable with its ID preserved, allowing explicit reselection or clearing. Raw responses or credentials SHALL NOT be sent in discovery messages or rendered as diagnostics.

#### Scenario: Previously selected account is missing
- **WHEN** a successful discovery result omits the saved connection ID
- **THEN** the inspector marks that assignment unavailable without selecting another account

#### Scenario: Discovery fails with HTTP 401
- **WHEN** the discovery request returns HTTP 401
- **THEN** the inspector shows an authentication failure and retains the previous assignment

#### Scenario: No configured provider connections
- **WHEN** discovery successfully returns an empty connection collection
- **THEN** the inspector shows an explicit empty state rather than a service error or an automatic assignment
