# plugin-branding Specification

## Purpose

Defines the OmniRoute visual identity shown for the Stream Deck plugin, so users can recognize the plugin in Stream Deck listings and plugin details.

## Requirements

### Requirement: Show the OmniRoute mark as the plugin and category icon
The Stream Deck plugin SHALL display artwork derived from `doc/icon-512.png` as both its plugin-level icon in plugin listings and details and its category icon in the action list. These icons SHALL be available as part of the installed plugin and SHALL NOT require a running OmniRoute service to render.

#### Scenario: Plugin listing and details use OmniRoute branding
- **WHEN** the plugin appears in a Stream Deck plugin listing or plugin details
- **THEN** its plugin-level icon displays the artwork derived from `doc/icon-512.png`

#### Scenario: Action category uses OmniRoute branding
- **WHEN** the OmniRoute action category appears in the Stream Deck action list
- **THEN** its category icon displays artwork derived from `doc/icon-512.png`

#### Scenario: Plugin icon is available while OmniRoute is offline
- **WHEN** the plugin is installed and the OmniRoute service is unavailable
- **THEN** Stream Deck can still display both the plugin-level icon and category icon
