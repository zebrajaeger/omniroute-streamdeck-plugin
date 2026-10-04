## Purpose

Provides a visible, placeable Quota key in the Stream Deck while the actual quota display functionality has not yet been implemented.

## ADDED Requirements

### Requirement: User can place a Quota action on a key
The plugin SHALL expose a keypad action named “Quota” in the Stream Deck actions list, and users SHALL be able to place it on a key.

#### Scenario: Find and place the Quota action
- **WHEN** a user views the OmniRoute actions in Stream Deck and drags “Quota” onto a key
- **THEN** the key is assigned the Quota action and the action appears on that key

### Requirement: Quota action is an inert placeholder
The Quota action SHALL remain a placeholder and SHALL NOT display quota data, increment a counter, or require action-specific settings.

#### Scenario: Use the placeholder key
- **WHEN** the user presses or configures a placed Quota key
- **THEN** no Counter behavior or settings UI is presented, and no quota value is claimed to be available
