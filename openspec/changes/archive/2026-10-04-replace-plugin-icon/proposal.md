## Why

The Stream Deck plugin's current plugin-level and category icons do not consistently use the supplied OmniRoute mark. Replacing both makes the plugin recognizable in Stream Deck listings, plugin details, and the action category.

## What Changes

- Replace the plugin-level and category icons referenced by the Stream Deck manifest with artwork derived from `doc/icon-512.png`.
- Keep the action icon and key images unchanged.
- Include a static, Stream Deck-compatible asset in the plugin so the icon does not depend on the local OmniRoute server being available at runtime.

## Capabilities

### New Capabilities
- `plugin-branding`: Defines the OmniRoute visual identity used for the Stream Deck plugin icon.

### Modified Capabilities
- None.

## Impact

- `omniroute/de.lars-brandt.omniroute.sdPlugin/manifest.json` plugin-level `Icon` entry.
- Static image assets under `omniroute/de.lars-brandt.omniroute.sdPlugin/imgs/plugin/`, derived from `doc/icon-512.png` and sized for the existing plugin-level and category icon paths.
- No API, runtime behavior, or dependency changes are intended.
