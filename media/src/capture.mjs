// Captures stills and frame sequences of T3 Code from a DEMO instance, with and without the theme.
//
// Never point this at your real T3 Code: it must only ever see demo projects and threads.
// See media/src/README.md for how the demo instance is set up.
//
//   T3_DEMO_HOME=D:\t3-demo\.home T3_DEMO_URL=http://127.0.0.1:3791 node capture.mjs
import { chromium } from "playwright-core";
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, existsSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import os from "node:os";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "out");
const URL = process.env.T3_DEMO_URL ?? "http://127.0.0.1:3791";
const HOME = process.env.T3_DEMO_HOME ?? "D:\\t3-demo\\.home";
const W = 1440, H = 810, DSF = 4 / 3; // 1920x1080 output

// Text that must never reach a frame. Extend it with anything private on your machine.
const MACHINE = os.hostname();
const FORBIDDEN = [MACHINE, os.userInfo().username, ...(process.env.T3_DEMO_FORBIDDEN ?? "").split(",")]
  .map((s) => s.trim()).filter((s) => s.length > 2);
const DEMO_MACHINE = "labs-demo";

function chromePath() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const root = join(os.homedir(), "AppData", "Local", "ms-playwright");
  const dirs = existsSync(root) ? readdirSync(root).filter((d) => /^chromium-\d+$/.test(d)).sort() : [];
  for (const d of dirs.reverse()) {
    for (const sub of ["chrome-win64", "chrome-win"]) {
      const p = join(root, d, sub, "chrome.exe");
      if (existsSync(p)) return p;
    }
  }
  return undefined; // let playwright-core find a channel
}

function pairUrl() {
  const cli = process.platform === "win32" ? "t3.cmd" : "t3";
  const out = execFileSync(cli, ["pair", "--base-dir", HOME, "--ttl", "30m", "--label", "media-capture"], {
    encoding: "utf8", shell: process.platform === "win32", env: { ...process.env, T3CODE_HOME: HOME },
  });
  const m = out.match(/Pairing URL:\s*(\S+)/);
  if (!m) throw new Error("could not pair:\n" + out);
  return m[1];
}

// Runs in the page: hides the machine name, and exposes helpers the capture drives.
const pageInit = (args) => {
  const { forbidden, demoMachine } = args;
  const fix = (node) => {
    const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = walker.nextNode())) {
      const v = clean(n.nodeValue);
      if (v !== n.nodeValue) n.nodeValue = v;
    }
    const els = node.nodeType === 1 ? [node, ...node.querySelectorAll("[title],[aria-label]")] : [];
    for (const e of els) fixAttrs(e);
  };
  const res = forbidden.map((f) => new RegExp(f.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"));
  const clean = (s) => res.reduce((acc, re) => acc.replace(re, demoMachine), s);
  const fixAttrs = (e) => {
    for (const a of ["title", "aria-label"]) {
      const v = e.getAttribute?.(a);
      if (v && clean(v) !== v) e.setAttribute(a, clean(v));
    }
  };
  const start = () => {
    fix(document.body);
    new MutationObserver((ms) => ms.forEach((m) => {
      if (m.type === "characterData") fix(m.target.parentNode ?? document.body);
      if (m.type === "attributes") fixAttrs(m.target);
      m.addedNodes.forEach((a) => (a.nodeType === 3 ? fix(a.parentNode) : a.nodeType === 1 && fix(a)));
    })).observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true,
      attributeFilter: ["title", "aria-label"] });
  };
  if (document.body) start(); else addEventListener("DOMContentLoaded", start);

  window.__labs = {
    sheets: null,
    off() { // the stock look: drop the theme's stylesheet
      if (!this.sheets) this.sheets = [...document.adoptedStyleSheets];
      document.adoptedStyleSheets = [];
    },
    on() { if (this.sheets) document.adoptedStyleSheets = this.sheets; },
    leak() {
      const text = document.body.innerText + " " + document.title + " " +
        [...document.querySelectorAll("[title],[aria-label]")].map((e) => (e.title || "") + " " + (e.getAttribute("aria-label") || "")).join(" ");
      return forbidden.filter((f) => text.toLowerCase().includes(f.toLowerCase()));
    },
    // Sets a meter row: label like "Session", value 0-100, kind "left" | "used".
    meter(sectionLabel, name, pct, kind) {
      const rows = document.querySelectorAll(`section[aria-label="${sectionLabel}"] [aria-label]`);
      for (const r of rows) {
        if (!r.getAttribute("aria-label").startsWith(name + ":")) continue;
        r.setAttribute("aria-label", `${name}: ${pct}% ${kind}`);
        const bar = r.querySelector(":scope > span:nth-child(2) > span");
        if (bar) bar.style.width = `max(${pct}%, 6px)`;
        const val = r.querySelector(":scope > span:last-child");
        if (val && kind === "left") val.textContent = `${pct}%`;
        if (val && kind === "used") val.textContent = `${Math.round(pct * 2)}k / 200k`;
      }
    },
    // Sets the i-th limit card of the Usage dialog (single account) to `pct` % left.
    limit(i, pct) {
      const rows = [...document.querySelectorAll('[role=dialog][aria-label=Usage] section>div')]
        .filter((r) => r.querySelector('button[aria-label*="% left, "]'));
      const row = rows[i];
      if (!row) return;
      const big = row.querySelector(":scope>div:first-child>span:nth-child(2)>span:first-child");
      if (big) big.textContent = `${pct}%`;
      const bar = row.querySelector('button[aria-label*="% left, "]');
      bar.setAttribute("aria-label", bar.getAttribute("aria-label").replace(/: \d+% left/, `: ${pct}% left`));
      const [fill, rest] = bar.querySelectorAll("div[aria-hidden]>div>div");
      if (fill) fill.style.width = `${pct}%`;
      if (rest) rest.style.width = `${100 - pct}%`;
    },
  };
};

async function main() {
  rmSync(OUT, { recursive: true, force: true });
  for (const d of ["stills", "seq/meters", "seq/composer", "seq/menu"]) mkdirSync(join(OUT, d), { recursive: true });

  const browser = await chromium.launch({ executablePath: chromePath() });
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: DSF, colorScheme: "dark" });
  await ctx.addInitScript(pageInit, { forbidden: FORBIDDEN, demoMachine: DEMO_MACHINE });
  const page = await ctx.newPage();

  await page.goto(pairUrl());
  await page.waitForTimeout(3000);
  // Client settings live in localStorage: show usage + context in thread details, keep the composer strip.
  await page.evaluate(() => {
    const k = "t3code:client-settings:v1";
    const s = JSON.parse(localStorage.getItem(k) || "{}");
    Object.assign(s, {
      persistComposerContextStrip: true, panelAnimationDurationMs: 0,
      threadDetailsItems: { ...(s.threadDetailsItems || {}), usage: true, context: true, openIn: false, scripts: false,
        servers: false, automations: false, lineage: false, sideChats: false },
    });
    localStorage.setItem(k, JSON.stringify(s));
    localStorage.setItem("t3code:theme-appearance-mode", "system");
  });
  await page.goto(URL + "/");
  await page.waitForTimeout(2500);

  let shotN = 0;
  const shot = async (path) => {
    const leaks = await page.evaluate(() => window.__labs.leak());
    if (leaks.length) throw new Error(`private text on screen (${leaks.join(", ")}), refusing to capture ${path}`);
    await page.screenshot({ path: join(OUT, path) });
    shotN++;
  };
  const scheme = async (s) => { await page.emulateMedia({ colorScheme: s }); await page.waitForTimeout(500); };
  const themed = async (on) => { await page.evaluate((v) => (v ? window.__labs.on() : window.__labs.off()), on); await page.waitForTimeout(250); };
  const mouseAway = () => page.mouse.move(W - 5, H - 5);

  // ---- thread view: before / after, light / dark
  await page.getByText("Add rate limiting to the public API").first().click();
  await page.waitForTimeout(3000);
  await page.evaluate(() => window.__labs.on());
  await page.evaluate(() => { // calm, readable demo values
    window.__labs.meter("Usage limits", "Session", 72, "left");
    window.__labs.meter("Usage limits", "Weekly", 41, "left");
    window.__labs.meter("Usage limits", "Weekly · Fable", 88, "left");
    window.__labs.meter("Context window", "Context", 34, "used");
  });
  await mouseAway();
  for (const s of ["dark", "light"]) {
    await scheme(s);
    await themed(true); await shot(`stills/thread-after-${s}.png`);
    await themed(false); await shot(`stills/thread-before-${s}.png`);
  }
  await themed(true);

  // ---- meters sequence (dark): green -> amber -> red
  await scheme("dark");
  const N = 150;
  const ease = (t) => t * t * (3 - 2 * t);
  for (let i = 0; i < N; i++) {
    const t = ease(i / (N - 1));
    const session = Math.round(96 - t * 90); // 96% left -> 6% left
    const weekly = Math.round(70 - t * 52);  // 70 -> 18
    const ctxUsed = Math.round(14 + t * 82); // 14% used -> 96% used
    await page.evaluate(([a, b, c]) => {
      window.__labs.meter("Usage limits", "Session", a, "left");
      window.__labs.meter("Usage limits", "Weekly", b, "left");
      window.__labs.meter("Usage limits", "Weekly · Fable", Math.max(40, b + 22), "left");
      window.__labs.meter("Context window", "Context", c, "used");
    }, [session, weekly, ctxUsed]);
    await shot(`seq/meters/${String(i).padStart(4, "0")}.png`);
  }
  // the stock meters at the end state, for the comparison
  await themed(false); await shot("stills/meters-before-dark.png"); await themed(true);

  // ---- composer (dark): focus glow + chips while typing, on a new chat
  await page.keyboard.press("Escape");
  await page.goto(URL + "/");
  await page.waitForTimeout(2000);
  await page.getByText("New chat").first().click().catch(() => {});
  await page.waitForTimeout(1500);
  await mouseAway();
  await shot("stills/draft-after-dark.png");
  await themed(false); await shot("stills/draft-before-dark.png"); await themed(true);
  const editor = page.locator("[contenteditable=true]").first();
  await page.evaluate(() => document.querySelectorAll("[contenteditable]").forEach((e) => e.setAttribute("spellcheck", "false")));
  await editor.click();
  await mouseAway();
  const msg = "Add a /health endpoint with uptime and version";
  let f = 0;
  for (let k = 0; k < 8; k++) await shot(`seq/composer/${String(f++).padStart(4, "0")}.png`);
  for (const ch of msg) {
    await page.keyboard.type(ch);
    await shot(`seq/composer/${String(f++).padStart(4, "0")}.png`);
  }
  await page.locator("[data-slot=composer-context-strip] [data-slot=combobox-trigger]").first().hover().catch(() => {});
  for (let k = 0; k < 12; k++) await shot(`seq/composer/${String(f++).padStart(4, "0")}.png`);
  await page.keyboard.press("Control+A"); await page.keyboard.press("Delete");
  await page.evaluate(() => document.activeElement?.blur());

  // ---- multi-select menu (dark): Ctrl+click two threads, right-click
  await page.goto(URL + "/");
  await page.waitForTimeout(2000);
  await mouseAway();
  const rows = page.locator("[data-thread-item]");
  await rows.nth(1).click({ modifiers: ["Control"] });
  await rows.nth(2).click({ modifiers: ["Control"] });
  await rows.nth(2).click({ button: "right" });
  await page.waitForTimeout(600);
  const items = page.locator('[data-context-menu][data-level="0"] button[role=menuitem]');
  const count = await items.count();
  await mouseAway(); await page.waitForTimeout(200);
  await shot("stills/menu-after-dark.png");
  await themed(false); await shot("stills/menu-before-dark.png"); await themed(true);
  for (let k = 0; k < count; k++) {
    await items.nth(k).hover();
    await page.waitForTimeout(150);
    await shot(`seq/menu/${String(k).padStart(4, "0")}.png`);
  }
  await page.keyboard.press("Escape");
  await scheme("light");
  await rows.nth(2).click({ button: "right" });
  await page.waitForTimeout(500);
  await items.nth(count - 1).hover();
  await shot("stills/menu-after-light.png");
  await page.keyboard.press("Escape"); await page.keyboard.press("Escape");

  // ---- Usage -> Limits dialog (dark), with demo values covering green, amber and red
  await scheme("dark");
  await page.locator('[aria-label="Usage"]').first().click();
  await page.waitForTimeout(1500);
  await page.locator('[role=dialog][aria-label=Usage] [data-slot=toggle][title^="Limits"]').first().click();
  await page.waitForTimeout(2500);
  // Account labels can carry an organisation name ("Claude · <org>"). Fail closed unless every bar
  // belongs to a bare provider name, so a demo instance signed in to a work account never gets captured.
  const accounts = await page.evaluate(() => [...document.querySelectorAll('[role=dialog][aria-label=Usage] button[aria-label*="% left, "]')]
    .map((b) => b.getAttribute("aria-label").split(":")[0].trim()));
  const named = accounts.filter((a) => !/^(Claude|Codex|OpenAI|Gemini|Cursor)$/i.test(a));
  if (!accounts.length || named.length) throw new Error(`Usage dialog shows account names (${named.join(", ") || "none found"}); use a demo instance with a single unnamed account`);
  await page.evaluate(() => [28, 11, 82].forEach((pct, i) => window.__labs.limit(i, pct)));
  await mouseAway(); await page.waitForTimeout(300);
  await shot("stills/usage-after-dark.png");
  await themed(false); await shot("stills/usage-before-dark.png"); await themed(true);
  await page.keyboard.press("Escape");

  // ---- model picker over the focused composer (dark): key hints in the footer and in the popup
  await page.goto(URL + "/");
  await page.waitForTimeout(2000);
  await page.getByText("Add rate limiting to the public API").first().click();
  await page.waitForTimeout(2500);
  await page.locator("[data-testid=composer-editor]").click();
  await page.locator("[data-chat-provider-model-picker]").click();
  await page.waitForTimeout(800);
  await page.locator("[data-model-picker-content] [data-slot=combobox-item]").nth(1).hover();
  await page.waitForTimeout(300);
  await shot("stills/picker-after-dark.png");
  await themed(false); await shot("stills/picker-before-dark.png"); await themed(true);
  await page.keyboard.press("Escape");

  // ---- new thread screen with project folders (dark): the one-click "New" pill on a hovered folder, the project
  // switcher chevron and the Ctrl Alt N chip
  await page.evaluate(() => {
    const k = "t3code:client-settings:v1";
    const s = JSON.parse(localStorage.getItem(k) || "{}");
    localStorage.setItem(k, JSON.stringify({ ...s, boringSidebarEnabled: true, sidebarProjectGroupingMode: "repository" }));
  });
  await page.goto(URL + "/");
  await page.waitForTimeout(2500);
  await page.locator("li[data-testid=sidebar-project-folder]").first().hover();
  await page.waitForTimeout(400);
  await shot("stills/newthread-after-dark.png");
  await themed(false); await shot("stills/newthread-before-dark.png"); await themed(true);
  // the project picker New chat opens, with the tip on how to skip it
  await page.locator('[aria-label="New thread"]').first().click();
  await page.waitForTimeout(900);
  await mouseAway();
  await shot("stills/projpicker-after-dark.png");
  await themed(false); await shot("stills/projpicker-before-dark.png"); await themed(true);
  await page.keyboard.press("Escape");

  console.log(`captured ${shotN} frames into ${OUT}`);
  await browser.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
