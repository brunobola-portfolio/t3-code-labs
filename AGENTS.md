# AGENTS.md

Guidance for agents working on T3 Code Labs, a T3 Code theme (one JSON file with colours and CSS).

## Layout

- `t3-code-labs.json`: the theme users install. Generated; never edit it by hand.
- `src/base.json`: T3 Clawd (MIT, rohit3a/t3-clawd) with ⌘N changed to Ctrl+N. The layout base.
- `scripts/build.py`: applies the Labs changes to the base and writes `t3-code-labs.json`. Every change goes here.

## Workflow

1. Edit `scripts/build.py`.
2. `python scripts/build.py`.
3. Apply locally: `t3 theme set ./t3-code-labs.json` (or the T3 MCP tool `t3_theme_set` after copying the file to
   `~/.t3/userdata/themes/t3-code-labs.json`).
4. Check the result, in both dark and light mode. Agents cannot see the desktop app: use screenshots, or open
   T3 Code's web app (`http://127.0.0.1:3773`) in a browser after `t3 pair --scope orchestration:read --ttl 5m`, and
   inspect the DOM there. The web app applies the same theme.
5. Add a line to `CHANGELOG.md`.

## What a theme can and cannot do

- `css` is capped at 50,000 characters. No `@import`; `url()` only with `data:` or `#id`. Icons are inline SVG masks.
- CSS restyles the DOM that exists. It cannot add data (repo, cost, session) that T3 does not render; prefer turning
  on T3 settings (Thread details → Usage limits / Context window; Advanced → Composer context) and styling those.
- On the desktop app, context menus are native Electron menus (`desktopBridge.showContextMenu`) and cannot be styled.
  The HTML menu (`[data-context-menu]`) only appears in the web app.
- Prefer T3's stable selectors (`t3_theme_read` lists them: `[data-slot=…]`, `[data-thread-item]`,
  `[data-chat-composer-form]`, `[data-thread-details-card]`, …). Tailwind class names change between releases.

## Selectors this theme relies on

- Header: `a[aria-label="T3 Code home"]`.
- Multi-select menu: `[data-context-menu][data-level="0"]` with no item that starts with an `svg`. Item order comes
  from T3's source: [Unpin], Settle, [Snooze ▸], [Regenerate titles], Mark unread, Delete.
- Usage meters: `section[aria-label="Usage limits"] [aria-label$="% left"]` (label like `Session: 97% left`).
- Context meter: `section[aria-label="Context window"] [aria-label$="% used"]`.
- Composer strip: `[data-slot=composer-context-strip]` with `[data-composer-context-control]` and the branch
  `[data-slot=combobox-trigger]`.

If an update breaks one of these, find the new attribute in the web app's DOM before reaching for class names.

## Commits and pull requests

- Conventional commits (`feat:`, `fix:`, `docs:`, `chore:`), small and focused.
- No tool attribution in pull requests: a PR title or description never says "Generated with Claude Code" (or any
  other tool).
- Keep rohit3a's copyright line in `LICENSE` and the credit in both READMEs.
- Screenshots in `media/` must use demo data: no real project names, clients, costs or paths.

## Ask a human before

- Pushing, tagging or publishing a release.
- Changing the theme's id (`t3-code-labs`) or name, which breaks users' saved choice.
