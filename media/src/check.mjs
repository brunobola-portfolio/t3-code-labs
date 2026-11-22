// Checks that every selector T3 Code Labs relies on still matches the T3 Code DOM, on a DEMO instance.
// Run it after a T3 Code update, before cutting a patch release. Exit code 1 if anything is missing.
//
//   T3_DEMO_HOME=D:\t3-demo\.home T3_DEMO_URL=http://127.0.0.1:3791 node check.mjs
//
// Never point this at your real T3 Code. It only reads the DOM, but it opens threads and popups.
import { chromium } from "playwright-core";
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import os from "node:os";

const URL = process.env.T3_DEMO_URL ?? "http://127.0.0.1:3791";
const HOME = process.env.T3_DEMO_HOME ?? "D:\\t3-demo\\.home";

function chromePath() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const root = join(os.homedir(), "AppData", "Local", "ms-playwright");
  const dirs = existsSync(root) ? readdirSync(root).filter((d) => /^chromium-\d+$/.test(d)).sort().reverse() : [];
  for (const d of dirs) for (const sub of ["chrome-win64", "chrome-win"]) {
    const p = join(root, d, sub, "chrome.exe");
    if (existsSync(p)) return p;
  }
  return undefined;
}
function pairUrl() {
  const cli = process.platform === "win32" ? "t3.cmd" : "t3";
  const out = execFileSync(cli, ["pair", "--base-dir", HOME, "--ttl", "10m", "--label", "selector-check"], {
    encoding: "utf8", shell: process.platform === "win32", env: { ...process.env, T3CODE_HOME: HOME },
  });
  const m = out.match(/Pairing URL:\s*(\S+)/);
  if (!m) throw new Error("could not pair:\n" + out.replace(/https?:\/\/\S+/g, "<redacted>"));
  return m[1];
}

// [where, label, selector]. Grouped by the screen they live on; see AGENTS.md for what each one styles.
const CHECKS = {
  thread: [
    ["header", 'a[aria-label="T3 Code home"]'],
    ["sidebar header", 'div:has(>div.shrink-0>[aria-label="New thread"])'],
    ["sidebar New thread touch target", '[aria-label="New thread"]>span[aria-hidden]'],
    ["breadcrumb crumb", 'nav[aria-label="Thread breadcrumb"] button[aria-label^="New thread in "]'],
    ["usage meters", 'section[aria-label="Usage limits"] [aria-label$="% left"]'],
    ["context meter", 'section[aria-label="Context window"] [aria-label$="% used"]'],
    ["details card sections", "[data-thread-details-card] section[aria-label]"],
    ["composer surface", "[data-chat-composer-surface]"],
    ["composer footer", "[data-chat-composer-footer]>div:first-child"],
    ["composer strip", "[data-slot=composer-context-strip]"],
    ["branch chip", '[data-slot=composer-context-strip] [aria-label^="Branch:"]'],
    ["model picker trigger", "[data-chat-provider-model-picker]"],
  ],
  folders: [
    ["project folder row", "li[data-testid=sidebar-project-folder]>button[data-sidebar-row]"],
    ["project folder New pill", 'li[data-testid=sidebar-project-folder] button[aria-label^="New thread in "]'],
    ["project switcher", "[data-draft-project-trigger]"],
    ["permissions chip (new thread)", '[data-slot=composer-context-strip] button[aria-label^="Permissions:"]'],
    ["start without a project", "div:has(>div>h1 [data-draft-project-trigger])>p>button"],
  ],
  filter: [
    ["project filter chip", 'div:has(>div.shrink-0>[aria-label="New thread"])>div.shrink-0>:is([aria-label^="Filter threads by project:"],[aria-label^="Projects: "])'],
    ["filter chip icon and pill", ':is([aria-label^="Filter threads by project:"],[aria-label^="Projects: "])>span:first-child~span:last-child'],
    ["picker below the chip", "[data-slot=combobox-positioner][data-side=bottom]>span"],
    ["picker All projects row", "[data-slot=combobox-item]:not(:has(button)):has([data-slot=combobox-item-content]>span:first-child)"],
    ["picker scroll root", "[data-slot=combobox-popup]>div>[data-slot=scroll-area-viewport]"],
    ["picker search", '[data-slot=combobox-popup] [data-slot=combobox-input]'],
  ],
  picker: [
    ["model picker", "[data-model-picker-content]"],
    ["model picker providers", "[data-model-picker-provider]"],
    ["model picker items", "[data-model-picker-content] [data-slot=combobox-item]"],
  ],
  projectPicker: [
    ["command palette", "[data-command-palette]"],
    ["palette rows", "[data-command-palette] [data-slot=command-item]"],
    ["palette footer", "[data-command-palette] [data-slot=command-footer]"],
    ["project picker Back", "[data-command-palette] [aria-label=Back]"],
  ],
  usage: [
    ["Usage dialog", "[role=dialog][aria-label=Usage]"],
    ["limit bars", '[role=dialog][aria-label=Usage] button[aria-label*="% left, "]'],
  ],
};

const browser = await chromium.launch({ executablePath: chromePath() });
const page = await (await browser.newContext({ viewport: { width: 1440, height: 810 }, colorScheme: "dark" })).newPage();
const results = [];
const run = async (group) => {
  for (const [label, sel] of CHECKS[group]) {
    const n = await page.locator(sel).count().catch(() => -1);
    results.push({ group, label, sel, n });
  }
};

await page.goto(pairUrl());
await page.waitForTimeout(3000);
await page.evaluate(() => {
  const k = "t3code:client-settings:v1";
  const s = JSON.parse(localStorage.getItem(k) || "{}");
  localStorage.setItem(k, JSON.stringify({ ...s, persistComposerContextStrip: true, boringSidebarEnabled: false,
    threadDetailsItems: { ...(s.threadDetailsItems || {}), usage: true, context: true } }));
});
await page.goto(URL + "/");
await page.waitForTimeout(2500);

// a thread with usage and context in its details card
await page.locator("[data-thread-item], [data-testid=sidebar-row-card]").last().click();
await page.waitForTimeout(2500);
await run("thread");
// model picker
await page.locator("[data-chat-provider-model-picker]").click().catch(() => {});
await page.waitForTimeout(800);
await run("picker");
await page.keyboard.press("Escape");
// the theme itself: is it loaded, and does every rule parse?
const theme = await page.evaluate(() => document.adoptedStyleSheets.reduce((n, s) => n + s.cssRules.length, 0));
// project folders and the new thread screen
await page.evaluate(() => {
  const k = "t3code:client-settings:v1";
  const s = JSON.parse(localStorage.getItem(k) || "{}");
  localStorage.setItem(k, JSON.stringify({ ...s, boringSidebarEnabled: true, sidebarProjectGroupingMode: "repository" }));
});
await page.goto(URL + "/");
await page.waitForTimeout(2500);
await run("folders");
// the project filter chip, and its picker opened over it
const filter = page.locator('[aria-label^="Filter threads by project"], [aria-label^="Projects"][data-slot=combobox-trigger]').first();
await filter.click();
await page.waitForTimeout(500);
await page.locator("[data-slot=combobox-item]:has(button)").nth(1).click();
await page.waitForTimeout(500);
await filter.click({ position: { x: 60, y: 18 } });
await page.waitForTimeout(600);
await run("filter");
await page.locator(CHECKS.filter[3][1]).click();
await page.waitForTimeout(500);
const cleared = await page.locator(CHECKS.filter[0][1]).count() === 0;
results.push({ group: "filter", label: "Clear removes the filter", sel: CHECKS.filter[3][1], n: cleared ? 1 : 0 });
// the project picker New thread opens
await page.locator('[aria-label="New thread"]').first().click();
await page.waitForTimeout(900);
await run("projectPicker");
await page.keyboard.press("Escape");
// Usage -> Limits
await page.locator('[aria-label="Usage"]').first().click();
await page.waitForTimeout(1500);
await page.locator('[role=dialog][aria-label=Usage] [data-slot=toggle][title^="Limits"]').first().click().catch(() => {});
await page.waitForTimeout(2000);
await run("usage");
await browser.close();

const missing = results.filter((r) => r.n < 1);
for (const r of results) console.log(`${r.n > 0 ? "ok  " : "MISS"} ${r.group.padEnd(13)} ${r.label.padEnd(32)} ${r.n}`);
console.log(theme ? `theme stylesheet: ${theme} top-level rules` : "theme stylesheet: NOT LOADED (run t3 theme set on the demo)");
console.log(missing.length ? `\n${missing.length} selector(s) no longer match. Find the new attribute in the DOM (see AGENTS.md).` : "\nAll selectors match.");
process.exit(missing.length || !theme ? 1 : 0);
