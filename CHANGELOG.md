# Changelog

## [Unreleased]

## [0.2.0] - 2026-11-18

### Changed
- **Multi-select menu**: icons and the red Delete are anchored on what T3 marks (the submenu and the destructive item) instead of the item's position, so they stay right if T3 adds or reorders items.

### Added
- **Thread details card**: each section shows its name (Workspace, Version Control, Usage limits, Context window); usage values read "67% left"; Add project script is a dashed button with an accent hover.
- **Project folders**: 20 px icons (monograms and favicons aligned), the thread count as a pill (accent when the folder is open), the open folder's name in bold, and a pulsing "working" dot (static when the system asks for reduced motion).
- **Tooltips**: the first line (the meter's label) is bold.
- **Media**: launch film (`media/t3-code-labs-film.mp4`, 1080p, synthesized music and sound effects), poster, before/after image and wipe clip, and preview GIFs for the meters, composer, menus and dark/light modes. All captured from a demo T3 Code instance; scripts in `media/src`.

## [0.1.0] - 2026-11-17

First release: T3 Clawd's layout rebranded as T3 Code Labs, with colour-coded usage and context meters.

### Added
- **Labs branding**: "T3 Code" header with a Labs badge; the theme is named T3 Code Labs.
- **Usage meters**: usage limits turn green, amber (below 35% left) or red (below 15% left).
- **Context meter**: the context window turns amber at 65% used and red at 85%.
- **Composer**: accent focus glow; the context strip (checkout, branch, access) shows as chips.
- **Menus**: rounded context menus with an accent hover, and icons for the multi-select menu when it renders in HTML.

### Changed
- **Windows shortcut**: the New chat button shows Ctrl+N instead of ⌘N.
