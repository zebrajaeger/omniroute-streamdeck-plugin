## MODIFIED Requirements

### Requirement: Quota action is an inert placeholder
The Quota action SHALL remain a display placeholder and SHALL NOT display quota data or increment a counter. It SHALL allow an optional action-specific `connectionId` assignment through its Property Inspector without requiring an assignment to place the action on a key.

#### Scenario: Use the placeholder key
- **WHEN** the user presses or configures a placed Quota key
- **THEN** no Counter behavior is presented and no quota value is claimed to be available

#### Scenario: Assign a provider before display is implemented
- **WHEN** the user selects an OmniRoute provider connection in the Quota Property Inspector
- **THEN** the connection ID is stored for that key while its display remains a placeholder
