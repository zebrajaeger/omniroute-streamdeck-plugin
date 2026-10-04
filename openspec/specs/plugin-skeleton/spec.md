## Purpose

Defines the baseline behavior of the OmniRoute Stream Deck plugin before its product actions are implemented, so the project can remain a valid, launchable plugin without shipping a template demo action.

## Requirements

### Requirement: Plugin runs without template actions
The plugin SHALL retain its identity and valid Stream Deck metadata while exposing no template/demo actions when no product actions have been implemented.

#### Scenario: Stream Deck loads the plugin skeleton
- **WHEN** Stream Deck loads the installed OmniRoute plugin
- **THEN** the plugin starts and connects successfully, and no Counter or other template action is listed

### Requirement: Plugin skeleton remains buildable
The plugin skeleton SHALL support the existing build process without requiring an action implementation or action-specific property inspector.

#### Scenario: Build an action-free plugin
- **WHEN** the plugin build is run with no product actions registered
- **THEN** a valid plugin bundle is produced with the existing plugin identity and no Counter demo assets or settings UI
