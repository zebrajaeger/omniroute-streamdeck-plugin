## Context

The Stream Deck plugin manifest (`omniroute/de.lars-brandt.omniroute.sdPlugin/manifest.json`) points its plugin-level `Icon` at `imgs/plugin/marketplace` and its `CategoryIcon` at `imgs/plugin/category-icon`. Both paths resolve to packaged PNG assets. The supplied 512×512 OmniRoute icon is `doc/icon-512.png`; installed icons must be local assets rather than references to a localhost URL.

## Goals / Non-Goals

**Goals:**
- Use the supplied OmniRoute artwork in both the plugin-level and category icon slots.
- Keep the icons available offline and preserve the existing manifest asset-path convention.

**Non-Goals:**
- Change the action icon, key image, or action behavior.
- Fetch the logo from the OmniRoute service at runtime.
- Modify the supplied source image in `doc/`.

## Decisions

- **Keep the current manifest paths and replace the artwork at both paths.** This avoids changing manifest references and retains offline, package-local asset lookup.
- **Derive all packaged icon variants directly from `doc/icon-512.png`.** Resize it to the current asset dimensions: 288×288 and 512×512 for the plugin-level icon, and 28×28 and 56×56 for the category icon. This preserves one source of truth and avoids SVG rendering or runtime dependencies.
- **Leave action imagery untouched.** The scope covers only the manifest's plugin-level and category icon paths.

## Risks / Trade-offs

- [The category icon is rendered at small dimensions] → Use high-quality downsampling from the 512×512 source and verify the 28×28 and 56×56 outputs visually and in Stream Deck.

## Migration Plan

Replace the plugin-level and category PNG assets with resized copies derived from `doc/icon-512.png`, keeping their existing paths and manifest references. Rebuild/reload the plugin and verify both icons in Stream Deck. Roll back by restoring the prior PNG artwork; no data or configuration migration is required.
