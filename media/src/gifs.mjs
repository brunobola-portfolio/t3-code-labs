// Builds the README media from the film and the compositor:
//   media/poster.png, media/before-after.png, media/usage-limits.png, media/composer-picker.png,
//   media/before-after.mp4 and the preview GIFs.
// Run after `node film.mjs` (the GIFs are cut from the film so they share its captions).
import { spawnSync } from "node:child_process";
import { statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { openFilm } from "./film.mjs";
import { SCENES } from "./timeline.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const MEDIA = join(HERE, "..");
const FILM = join(MEDIA, "t3-code-labs-film.mp4");
const ff = (args) => {
  const r = spawnSync("ffmpeg", ["-y", "-loglevel", "error", ...args], { stdio: "inherit" });
  if (r.status !== 0) throw new Error("ffmpeg failed: " + args.join(" "));
};
const size = (f) => `${(statSync(f).size / 1e6).toFixed(2)} MB`;

// stills
const { page, close } = await openFilm();
await page.evaluate(() => window.poster());
await page.screenshot({ path: join(MEDIA, "poster.png") });
await page.evaluate(() => window.beforeAfter("dark"));
await page.screenshot({ path: join(MEDIA, "before-after.png"), clip: { x: 0, y: 100, width: 1920, height: 640 } });
// the Usage -> Limits dialog, cropped to its limit cards
const USAGE = { x: 290, y: 130, w: 1340, h: 480 };
await page.evaluate((c) => window.beforeAfter("dark", "usage", c), USAGE);
await page.screenshot({ path: join(MEDIA, "usage-limits.png"), clip: { x: 0, y: 100, width: 1920, height: Math.ceil(100 + 880 * USAGE.h / USAGE.w + 60) } });
// the model picker over the composer, with the key hints
const PICKER = { x: 500, y: 270, w: 1120, h: 800 };
await page.evaluate((c) => window.beforeAfter("dark", "picker", c), PICKER);
await page.screenshot({ path: join(MEDIA, "composer-picker.png"), clip: { x: 0, y: 100, width: 1920, height: Math.ceil(100 + 880 * PICKER.h / PICKER.w + 60) } });
await close();
for (const f of ["poster.png", "before-after.png", "usage-limits.png", "composer-picker.png"]) console.log(f, size(join(MEDIA, f)));

// before/after wipe as a short silent MP4 (plays inline on GitHub when opened)
const [ba0, ba1] = SCENES.beforeAfter;
ff(["-ss", String(ba0 + 0.4), "-to", String(ba1 - 0.3), "-i", FILM, "-an", "-vf", "scale=1280:-2",
  "-c:v", "libx264", "-crf", "24", "-preset", "slow", "-pix_fmt", "yuv420p", "-movflags", "+faststart", join(MEDIA, "before-after.mp4")]);
console.log("before-after.mp4", size(join(MEDIA, "before-after.mp4")));

// GIFs: palette per clip for clean colours
const GIFS = {
  "meters.gif": [SCENES.meters[0] + 0.6, SCENES.meters[1] - 1.6],
  "before-after.gif": [SCENES.beforeAfter[0] + 0.6, SCENES.beforeAfter[1] - 0.6],
  "composer.gif": [SCENES.composer[0] + 0.6, SCENES.composer[1] - 0.4],
  "menu.gif": [SCENES.menu[0] + 0.6, SCENES.menu[1] - 0.4],
  "dark-light.gif": [SCENES.modes[0] + 0.6, SCENES.modes[1] - 0.5],
};
for (const [name, [a, b]] of Object.entries(GIFS)) {
  const out = join(MEDIA, name);
  ff(["-ss", String(a), "-to", String(b), "-i", FILM, "-vf",
    "fps=15,scale=800:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=160:stats_mode=diff[p];[s1][p]paletteuse=dither=sierra2_4a:diff_mode=rectangle",
    "-loop", "0", out]);
  console.log(name, size(out));
}
