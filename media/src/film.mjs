// Renders film.html frame by frame and encodes the launch film with the synthesized soundtrack.
//
//   node film.mjs                 -> ../t3-code-labs-film.mp4 (1080p30, H.264 + AAC)
//   node film.mjs --stills 2,9,17 -> out/preview-<t>.png only (quick check of single moments)
import { chromium } from "playwright-core";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync, readdirSync, statSync } from "node:fs";
import { spawn } from "node:child_process";
import { join, dirname, extname, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import os from "node:os";
import { FPS, DURATION } from "./timeline.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const MEDIA = join(HERE, "..");
const TYPES = { ".html": "text/html", ".mjs": "text/javascript", ".png": "image/png", ".js": "text/javascript" };

export function chromePath() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const root = join(os.homedir(), "AppData", "Local", "ms-playwright");
  const dirs = existsSync(root) ? readdirSync(root).filter((d) => /^chromium-\d+$/.test(d)).sort() : [];
  for (const d of dirs.reverse()) for (const sub of ["chrome-win64", "chrome-win", "chrome-linux"]) {
    const p = join(root, d, sub, process.platform === "win32" ? "chrome.exe" : "chrome");
    if (existsSync(p)) return p;
  }
  return undefined;
}

export async function openFilm() {
  const server = createServer(async (req, res) => {
    const path = resolve(HERE, "." + decodeURIComponent(new URL(req.url, "http://x").pathname));
    if (!path.startsWith(resolve(HERE) + sep) || !(extname(path) in TYPES)) { res.writeHead(403).end(); return; }
    let body;
    try { body = await readFile(path); } catch { res.writeHead(404).end(); return; }
    res.writeHead(200, { "content-type": TYPES[extname(path)] ?? "application/octet-stream" }).end(body);
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const browser = await chromium.launch({ executablePath: chromePath() });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  page.on("pageerror", (e) => console.error("page error:", e.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/film.html`);
  await page.waitForFunction(() => window.ready);
  await page.evaluate(() => window.ready);
  return { page, close: async () => { await browser.close(); server.close(); } };
}

async function main() {
  const stillsArg = process.argv.indexOf("--stills");
  const { page, close } = await openFilm();
  if (stillsArg > 0) {
    for (const t of process.argv[stillsArg + 1].split(",").map(Number)) {
      await page.evaluate((t) => window.render(t), t);
      await page.screenshot({ path: join(HERE, "out", `preview-${t}.png`) });
    }
    await close();
    return;
  }
  const out = join(MEDIA, "t3-code-labs-film.mp4");
  const ff = spawn("ffmpeg", ["-y", "-loglevel", "error",
    "-f", "image2pipe", "-framerate", String(FPS), "-c:v", "png", "-i", "-",
    "-i", join(HERE, "out", "soundtrack.wav"),
    "-c:v", "libx264", "-preset", "slow", "-crf", "22", "-tune", "animation", "-pix_fmt", "yuv420p",
    "-maxrate", "2200k", "-bufsize", "4400k", "-g", "60",
    "-c:a", "aac", "-b:a", "160k", "-shortest", "-movflags", "+faststart", out], { stdio: ["pipe", "inherit", "inherit"] });
  const frames = Math.round(DURATION * FPS);
  const t0 = Date.now();
  for (let f = 0; f < frames; f++) {
    await page.evaluate((t) => window.render(t), f / FPS);
    const buf = await page.screenshot({ type: "png" });
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once("drain", r));
    if (f % 150 === 0) console.log(`frame ${f}/${frames} (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
  }
  ff.stdin.end();
  await new Promise((r) => ff.on("close", r));
  await close();
  console.log(`${out}: ${(statSync(out).size / 1e6).toFixed(2)} MB`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === normalize(process.argv[1])) main().catch((e) => { console.error(e); process.exit(1); });
