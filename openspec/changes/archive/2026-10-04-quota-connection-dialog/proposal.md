## Why

The archived `connection-settings-dialog` change introduced a standalone Connection Settings action with an inline Property Inspector, which is not the intended user flow. Connection configuration should be reachable from the Quota action settings through a clearly identifiable control, while retaining one shared connection configuration.

## What Changes

- Replace the standalone connection-settings entry point in the intended user flow with a connection-icon button in the Quota action's Property Inspector.
- Open a modal dialog from that button for editing the existing shared OmniRoute URL and API key settings.
- Keep explicit Save and Cancel behavior, and persist the values plugin-wide so all action instances use the same configuration.
- Do not add connection testing, validation, or new security behavior.

## Capabilities

### New Capabilities
- `quota-connection-dialog`: Defines the Quota settings entry point and modal connection-settings dialog.

### Modified Capabilities
- `connection-settings`: Change its entry-point requirement from a standalone connection action with inline inspector to a modal launched from Quota settings; preserve its shared settings and edit behavior.

## Impact

The Stream Deck Quota action Property Inspector and manifest registration, the connection-settings UI and plugin messaging, and the existing plugin-wide SDK settings storage. The archived `connection-settings-dialog` change and its main spec provide the baseline; this proposal corrects the entry point and presentation rather than introducing a second settings store. No credentials belong in source, action settings, graphics, or logs.
