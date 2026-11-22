// Shared timeline for the launch film: the picture (film.html) and the music (audio.mjs) both read it,
// so sound effects land on the frame they belong to.
export const FPS = 30;
export const DURATION = 60; // seconds

export const SCENES = {
  intro: [0, 5],
  beforeAfter: [5, 13],
  meters: [13, 23],
  composer: [23, 30],
  menu: [30, 35],
  quick: [35, 41],
  filter: [41, 47],
  modes: [47, 53],
  outro: [53, 60],
};

// Meter clip: 150 captured frames played between these times.
export const METERS_PLAY = [14.2, 20.2];
// Matches capture.mjs: session = 96 - e*90 (left), context = 14 + e*82 (used), e = smoothstep(i/149).
const smooth = (t) => t * t * (3 - 2 * t);
function crossTime(fn, threshold) {
  for (let i = 0; i < 150; i++) if (fn(smooth(i / 149)) >= threshold) return METERS_PLAY[0] + (i / 149) * (METERS_PLAY[1] - METERS_PLAY[0]);
  return null;
}
export const METER_EVENTS = [
  { t: crossTime((e) => 14 + e * 82, 65), kind: "amber" },
  { t: crossTime((e) => 100 - (96 - e * 90), 100 - 35), kind: "amber" },
  { t: crossTime((e) => 14 + e * 82, 85), kind: "red" },
  { t: crossTime((e) => 100 - (96 - e * 90), 100 - 15), kind: "red" },
].sort((a, b) => a.t - b.t);

export const WIPE = [8.2, 10.4];      // before -> after wipe
export const MODE_SWITCH = [49.0, 50.4]; // dark -> light circular reveal
export const QUICK_PILL = 36.6;       // the New pill lights up on the hovered project
export const QUICK_SWAP = [38.0, 38.6]; // cross-fade to the project picker
export const FILTER_OPEN = 43.6;      // press on Clear: the picker opens over the chip
export const FILTER_DONE = 44.5;      // and the filter is gone
export const COMPOSER_PLAY = [24.0, 29.4];
export const MENU_STEP = 0.75;        // seconds per hovered item
export const MENU_START = 30.9;

export const SFX = [
  { t: 1.75, kind: "pop" },
  { t: 5.0, kind: "whoosh" },
  { t: WIPE[0], kind: "sweep" },
  { t: 13.0, kind: "whoosh" },
  ...METER_EVENTS.map((e) => ({ t: e.t, kind: e.kind === "red" ? "tickHi" : "tick" })),
  { t: 23.0, kind: "whoosh" },
  { t: 30.0, kind: "whoosh" },
  ...[0, 1, 2, 3, 4].map((k) => ({ t: MENU_START + k * MENU_STEP, kind: "click" })),
  { t: 35.0, kind: "whoosh" },
  { t: QUICK_PILL, kind: "click" },
  { t: QUICK_SWAP[0] + 0.2, kind: "pop" },
  { t: 41.0, kind: "whoosh" },
  { t: FILTER_OPEN, kind: "click" },
  { t: FILTER_DONE, kind: "pop" },
  { t: 47.0, kind: "whoosh" },
  { t: MODE_SWITCH[0], kind: "sweep" },
  { t: 53.0, kind: "whoosh" },
  { t: 55.2, kind: "pop" },
];
