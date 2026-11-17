# T3 Code Labs

A premium, observability-first theme for [T3 Code](https://github.com/pingdotgg/t3code). One file, no fork.

[Português](README.pt.md)

T3 Code Labs keeps the T3 Code name and adds a small **Labs** badge. It restyles the app with warm clay colours, a cleaner sidebar and composer, and colour-coded usage and context meters, so you can see at a glance how much of your limits and context window a thread has used.

## What changes

**Look and feel**
- Warm dark and light palettes with a clay accent.
- "T3 Code" header with a **Labs** badge.
- Sidebar menu: search, Projects, Add project, and a big **New chat** button showing its shortcut (Ctrl+N).
- Two-line thread rows, a "Recents" heading, and tidier Working / Settled shelves.
- A single-column model picker with effort levels as a segmented bar.
- Rounded, softer context menus with an accent hover. Icons are added to the multi-select menu (Settle, Snooze, Regenerate titles, Mark unread, Delete) when T3 Code renders it in HTML.

**Observability**
- Usage-limit meters in the thread details card are **green** while you have room, **amber** below 35% left and **red** below 15% left.
- The context-window meter turns **amber** at 65% used and **red** at 85%, so you know when a thread is getting full.
- The composer gets a soft accent glow while you type. Its context strip (checkout, branch, access) shows as chips.

## Install

**With the T3 CLI** (publishes the theme and switches T3 Code to it):

```sh
curl -LO https://raw.githubusercontent.com/brunobola-portfolio/t3-code-labs/main/t3-code-labs.json
t3 theme set ./t3-code-labs.json
```

**Or by hand:** download [`t3-code-labs.json`](t3-code-labs.json). In T3 Code, open **Settings → Appearance → Add theme**, drop the file in (or paste it into **Theme JSON**), then pick **T3 Code Labs**.

Dark and light modes are both included.

### Recommended settings

The theme styles information T3 Code already has, but some of it is off by default. Turn it on to get the full dashboard:

1. **Settings → Appearance → Thread details**: enable **Usage limits** and **Context window**.
2. **Settings → Appearance → Advanced → Composer context**: on. This keeps the branch and worktree visible below the composer after a thread starts.

For cost per model, tokens and cache savings, open T3 Code's built-in usage page with **Ctrl+U**.

## Requirements and notes

- Needs a T3 Code build whose themes accept `css`. It was tested on Nightly `0.1.10-nightly.20261116`; older nightlies import the colours only.
- On the desktop app, right-click menus are native OS menus, which themes cannot style. The menu icons show up when T3 Code runs in the browser.
- T3 Code styles can change between releases. The theme uses T3's stable selectors where it can; if something looks off after an update, [open an issue](https://github.com/brunobola-portfolio/t3-code-labs/issues).

## Build from source

`t3-code-labs.json` is generated. Edit `scripts/build.py` (or `src/base.json`), then run:

```sh
python scripts/build.py
```

## Credits

Built on [T3 Clawd](https://github.com/rohit3a/t3-clawd) by [@rohit3a](https://github.com/rohit3a) (MIT), whose layout work is the base of this theme.

Unofficial. Not affiliated with T3 Tools Inc. T3 Code is a product of T3 Tools Inc.

## License

[MIT](LICENSE). Made by [BolaLabs](https://github.com/BolaLabs).
