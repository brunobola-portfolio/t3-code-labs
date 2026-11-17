# Media sources

Scripts that produce everything in `media/`: the poster, the before/after image and clip, the preview GIFs and the
launch film. The UI in every frame is the real T3 Code web app, running on a **demo** instance with fake projects.

| File | What it does |
| --- | --- |
| `capture.mjs` | Drives the demo web app with Playwright and saves stills and frame sequences to `out/` (theme on and off, dark and light, meters, composer, menu). |
| `timeline.mjs` | Scene timing shared by the picture and the music. |
| `audio.mjs` | Synthesizes the soundtrack (pad, arpeggio, bass, soft drums, UI sound effects) into `out/soundtrack.wav`. |
| `film.html` | The compositor: draws the captured frames, titles and transitions for any time `t`, plus the poster and before/after layouts. |
| `film.mjs` | Renders `film.html` frame by frame and encodes `../t3-code-labs-film.mp4` (1080p30, H.264 + AAC). `--stills 2,9,17` previews single moments. |
| `gifs.mjs` | Writes `../poster.png`, `../before-after.png`, `../before-after.mp4` and the GIFs (cut from the film). |

## Requirements

- Node 20+, ffmpeg on `PATH`, the T3 Code CLI (`t3`).
- A Chromium: the scripts use the newest one Playwright has cached (`%LOCALAPPDATA%\ms-playwright`), or `CHROME_PATH`.
- `npm install` here (installs `playwright-core` only; no browser download).

## 1. Start a demo instance

Use a separate data directory and fake projects in a path with nothing personal in it:

```sh
mkdir D:\t3-demo && cd D:\t3-demo
# create a few small git repos: aurora-api, nebula-web, orbit-cli
t3 serve --base-dir D:\t3-demo\.home --port 3791 --host 127.0.0.1 --no-browser
t3 project add --base-dir D:\t3-demo\.home D:\t3-demo\aurora-api      # and the others
t3 thread start --base-dir D:\t3-demo\.home --provider claudeAgent --model claude-haiku-4-5 \
  --title "Add rate limiting to the public API" D:\t3-demo\aurora-api "Without using tools, ..."
t3 theme set --base-dir D:\t3-demo\.home ..\..\t3-code-labs.json
```

The film opens the thread titled **Add rate limiting to the public API**; the other threads only fill the sidebar.

## 2. Render

```sh
npm install
set T3_DEMO_HOME=D:\t3-demo\.home
set T3_DEMO_URL=http://127.0.0.1:3791
npm run capture      # pairs with the demo server itself (t3 pair)
npm run audio
npm run film         # ~4 minutes
node gifs.mjs
```

## Privacy

`capture.mjs` replaces the machine name on screen with `labs-demo` and throws instead of saving a frame if the
hostname, the OS user name, or any comma-separated value in `T3_DEMO_FORBIDDEN` appears in the page text, title or
labels. That is a safety net, not a review: look at the assets before committing them. Never run it against your
everyday T3 Code.
