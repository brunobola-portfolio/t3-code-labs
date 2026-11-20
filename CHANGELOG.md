# Changelog

## [Unreleased]

### Changed
- **New chat…** now ends in an ellipsis: like T3's own New thread button, a click opens the project picker
  (Enter picks the current project). Shift+click or Ctrl+Shift+N skips the picker.

### Added
- **Project folders**: the hover action, T3's one-click "New thread in <project>", becomes an accent **New** pill.
- **New thread screen**: a chevron on the project name (it opens the project switcher) and a **Ctrl Alt N** chip on
  "or start without a project".
- **Command palette and project picker**: rounded rows, the highlighted row in the accent, and in the project picker a
  tip that Shift+click on New chat skips it. The project switcher, branch picker and menus use the same accent row.
- New README image: the new thread screen, before and after. Film, poster and GIFs recaptured.

### Fixed
- The breadcrumb's hover **+** no longer leaks onto other "New thread in …" buttons.

## [0.4.0] - 2026-11-20

### Changed
- **Sidebar header**: search, Projects and Add project share one row (icon buttons with T3's tooltips), and **New chat** sits under them with its shortcuts beside the label: Ctrl N, and ⇧ project for a new thread in the current project (Shift+click or Ctrl+Shift+N). About 75 px shorter than before.

### Added
- **Composer key hints**: while the composer has focus, its footer shows ↵ send, ⇧↵ new line and Ctrl+Shift+M model (T3's default bindings); hidden on narrow windows.
- **Permission chip**: the access mode below the composer is green, or amber for Full access; the branch chip uses monospace.
- **Model picker**: the active provider and the hovered model use the accent, the chosen model gets an accent edge, the selected effort is bold, and a footer lists the keys (↑↓, ↵, Esc, Ctrl+Shift+M).
- **Breadcrumb**: the project crumb shows a "+" on hover, since clicking it starts a new thread in that project.
- **Text selection** in the accent colour.
- **Media**: a before/after image of the composer and model picker (`media/composer-picker.png`); the film, poster and GIFs were recaptured with the new sidebar and composer.

## [0.3.0] - 2026-11-18

### Added
- **Usage → Limits**: each limit is a card with a quiet title and a traffic-light number (single-account limits); account bars keep their colour but get a fuller fill, calmer hatching, a crisper pace marker and an amber or red ring when that account runs low; "ahead of pace" shows amber and "under pace" green; the active Cost / Tokens / Limits view uses the accent.
- **README**: a before/after image of Usage → Limits, release and licence badges, and install links that point at the latest release.
- **Issue form** for reports like "something looks off after a T3 Code update", with a reminder to share demo data only.

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
