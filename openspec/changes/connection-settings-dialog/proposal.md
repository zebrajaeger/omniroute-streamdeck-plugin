## Why

The plugin needs a place to configure which OmniRoute instance it connects to and which API key it uses. A dedicated connection action provides a discoverable settings surface while keeping one shared connection configuration for the plugin rather than duplicating it per action.

## What Changes

- Add a dedicated OmniRoute connection action whose Property Inspector presents the connection settings form.
- Provide ordinary text fields for the OmniRoute instance URL and API key, along with **Cancel** and **Save** buttons, using official Stream Deck UI components rather than custom components.
- Persist the values as plugin-wide settings; when the inspector is opened, prefill both fields from the saved values.
- Treat Cancel as discarding edits made since the last save. No connection test, URL validation, or additional security controls are part of this change.

## Capabilities

### New Capabilities
- `connection-settings`: Defines the plugin-wide OmniRoute connection settings form, persistence, and its Property Inspector entry point.

### Modified Capabilities
- None. The repository has no main specs yet; existing in-progress changes introduce separate capabilities.

## Impact

- Stream Deck action registration and `omniroute/de.lars-brandt.omniroute.sdPlugin/manifest.json` for the dedicated connection action and its Property Inspector.
- The plugin entry point and Property Inspector UI under `omniroute/src/` and `omniroute/de.lars-brandt.omniroute.sdPlugin/ui/`.
- Stream Deck SDK plugin-wide settings (`streamDeck.settings`) for persistence, plus the existing official SDPI Components UI approach. No new runtime dependency or connection/API behavior is intended.
- The API key is deliberately treated as an ordinary text field in this change; security hardening is out of scope.
