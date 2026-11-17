// Synthesizes the film's soundtrack from scratch: no samples, no libraries.
// Warm pad + plucked arpeggio + sub bass + soft drums, and UI sound effects timed by timeline.mjs.
//
//   node audio.mjs   -> out/soundtrack.wav (48 kHz, 16-bit stereo)
import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { DURATION, SFX, SCENES } from "./timeline.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const SR = 48000;
const N = Math.ceil(DURATION * SR);
const L = new Float32Array(N), R = new Float32Array(N);
const TAU = Math.PI * 2;

// deterministic noise
let seed = 0x1234567;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296) * 2 - 1;

const BPM = 100, BEAT = 60 / BPM, BAR = BEAT * 4;
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
// A minor feel with a lift: Am9 - Fmaj7 - C - G6 (MIDI notes)
const CHORDS = [
  { root: 45, notes: [57, 60, 64, 67, 71] },
  { root: 41, notes: [57, 60, 64, 65, 69] },
  { root: 48, notes: [55, 60, 64, 67, 72] },
  { root: 43, notes: [55, 59, 62, 64, 67] },
];
const chordAt = (t) => CHORDS[Math.floor(t / BAR) % CHORDS.length];

function add(i, l, r) { if (i >= 0 && i < N) { L[i] += l; R[i] += r; } }

// --- pad: additive saw-ish voices, detuned, slow swells, one chord per bar
function pad() {
  const bars = Math.ceil(DURATION / BAR);
  for (let b = 0; b < bars; b++) {
    const t0 = b * BAR, ch = CHORDS[b % CHORDS.length];
    const len = BAR + 1.2;
    for (const [ni, m] of ch.notes.slice(0, 4).entries()) {
      for (const det of [-0.12, 0.0, 0.11]) {
        const f = mtof(m) * Math.pow(2, det / 12);
        const pan = 0.5 + det * 3 + (ni - 1.5) * 0.08;
        const s0 = Math.floor(t0 * SR), s1 = Math.min(N, Math.floor((t0 + len) * SR));
        let ph = rnd() * TAU;
        for (let s = s0; s < s1; s++) {
          const tt = (s - s0) / SR;
          const env = Math.min(1, tt / 0.9) * Math.min(1, (len - tt) / 1.2);
          ph += (TAU * f) / SR;
          let v = 0;
          for (let h = 1; h <= 6; h++) v += Math.sin(ph * h) / (h * h * 0.9 + 0.1);
          v *= env * 0.0105;
          add(s, v * (1 - pan), v * pan);
        }
      }
    }
  }
}

// --- plucked arpeggio with a ping-pong delay
const arpL = new Float32Array(N), arpR = new Float32Array(N);
function arp() {
  const step = BEAT / 2;
  const pattern = [0, 2, 1, 3, 2, 4, 3, 1];
  const [a, b] = [SCENES.beforeAfter[0], SCENES.outro[1] - 2.5];
  for (let t = a, k = 0; t < b; t += step, k++) {
    const ch = chordAt(t);
    const m = ch.notes[pattern[k % pattern.length]] + 12;
    const f = mtof(m);
    const vel = (k % 4 === 0 ? 1 : 0.7) * (t < SCENES.meters[0] ? 0.6 : 1);
    const s0 = Math.floor(t * SR), len = Math.floor(0.6 * SR);
    for (let s = 0; s < len && s0 + s < N; s++) {
      const tt = s / SR;
      const env = Math.exp(-tt * 7) * Math.min(1, tt / 0.004);
      const v = (Math.sin(TAU * f * tt) * 0.8 + Math.sin(TAU * f * 2 * tt) * 0.18 * Math.exp(-tt * 14)) * env * 0.05 * vel;
      arpL[s0 + s] += v * 0.62; arpR[s0 + s] += v * 0.38;
    }
  }
  const d = Math.floor(BEAT * 0.75 * SR);
  for (let s = 0; s < N; s++) {
    const l = arpL[s] + (s >= d ? arpR[s - d] * 0.42 : 0);
    const r = arpR[s] + (s >= d ? arpL[s - d] * 0.42 : 0);
    arpL[s] = l; arpR[s] = r;
    L[s] += l; R[s] += r;
  }
}

// --- sub bass on the root, from the first cut
function bass() {
  for (let t = SCENES.beforeAfter[0]; t < SCENES.outro[1] - 2; t += BEAT * 2) {
    const f = mtof(chordAt(t).root - 12 + 12);
    const s0 = Math.floor(t * SR), len = Math.floor(BEAT * 2 * SR);
    for (let s = 0; s < len && s0 + s < N; s++) {
      const tt = s / SR;
      const env = Math.min(1, tt / 0.02) * Math.exp(-tt * 1.3);
      const v = Math.sin(TAU * f * tt) * env * 0.09;
      add(s0 + s, v, v);
    }
  }
}

// --- soft drums in the middle section
function drums() {
  const [a, b] = [SCENES.meters[0], SCENES.outro[0]];
  for (let t = a, k = 0; t < b; t += BEAT, k++) {
    if (k % 2 === 0) { // kick
      const s0 = Math.floor(t * SR);
      let ph = 0;
      for (let s = 0; s < 0.35 * SR; s++) {
        const tt = s / SR;
        const f = 45 + 80 * Math.exp(-tt * 30);
        ph += (TAU * f) / SR;
        const v = Math.sin(ph) * Math.exp(-tt * 9) * 0.16;
        add(s0 + s, v, v);
      }
    }
    // closed hat on the off-beat
    const h0 = Math.floor((t + BEAT / 2) * SR);
    let prev = 0;
    for (let s = 0; s < 0.05 * SR; s++) {
      const n = rnd(); const hp = n - prev; prev = n;
      const v = hp * Math.exp((-s / SR) * 90) * 0.018;
      add(h0 + s, v * 0.8, v);
    }
  }
}

// --- sound effects
const SFXGEN = {
  pop(s0) {
    for (let s = 0; s < 0.25 * SR; s++) {
      const tt = s / SR; const f = 660 + 600 * Math.exp(-tt * 40);
      const v = Math.sin(TAU * f * tt) * Math.exp(-tt * 18) * 0.12;
      add(s0 + s, v, v);
    }
  },
  click(s0) {
    for (let s = 0; s < 0.03 * SR; s++) {
      const tt = s / SR; const v = (Math.sin(TAU * 2200 * tt) * 0.5 + rnd() * 0.3) * Math.exp(-tt * 260) * 0.08;
      add(s0 + s, v, v);
    }
  },
  tick(s0, f = 1320) {
    for (let s = 0; s < 0.18 * SR; s++) {
      const tt = s / SR;
      const v = (Math.sin(TAU * f * tt) + 0.4 * Math.sin(TAU * f * 1.5 * tt)) * Math.exp(-tt * 22) * 0.05;
      add(s0 + s, v, v);
    }
  },
  tickHi(s0) { SFXGEN.tick(s0, 1760); SFXGEN.tick(s0 + Math.floor(0.09 * SR), 1760); },
  // noise through a resonant band-pass that sweeps up then down
  whoosh(s0, dur = 0.9, lo = 300, hi = 3200) {
    let y1 = 0, y2 = 0, x1 = 0, x2 = 0;
    const len = Math.floor(dur * SR);
    for (let s = 0; s < len; s++) {
      const p = s / len;
      const f = lo + (hi - lo) * Math.sin(Math.PI * p);
      const w0 = (TAU * f) / SR, Q = 1.6, al = Math.sin(w0) / (2 * Q);
      const b0 = al, b2 = -al, a0 = 1 + al, a1 = -2 * Math.cos(w0), a2 = 1 - al;
      const x = rnd();
      const y = (b0 * x + b2 * x2 - a1 * y1 - a2 * y2) / a0;
      x2 = x1; x1 = x; y2 = y1; y1 = y;
      const env = Math.sin(Math.PI * p) ** 2 * 0.22;
      add(s0 + s, y * env * (1 - p * 0.6), y * env * (0.4 + p * 0.6));
    }
  },
  sweep(s0) { SFXGEN.whoosh(s0, 1.6, 200, 5000); },
};

pad(); arp(); bass(); drums();
for (const e of SFX) SFXGEN[e.kind](Math.floor(e.t * SR));

// master: fades, soft clip, 16-bit
const buf = Buffer.alloc(44 + N * 4);
buf.write("RIFF", 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write("WAVE", 8);
buf.write("fmt ", 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22);
buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34);
buf.write("data", 36); buf.writeUInt32LE(N * 4, 40);
let peak = 0;
for (let s = 0; s < N; s++) peak = Math.max(peak, Math.abs(L[s]), Math.abs(R[s]));
const gain = 0.9 / Math.max(peak, 1e-6);
for (let s = 0; s < N; s++) {
  const t = s / SR;
  const fade = Math.min(1, t / 1.2) * Math.min(1, (DURATION - t) / 2.5);
  const l = Math.tanh(L[s] * gain * 1.2 * fade) * 0.92, r = Math.tanh(R[s] * gain * 1.2 * fade) * 0.92;
  buf.writeInt16LE(Math.round(l * 32767), 44 + s * 4);
  buf.writeInt16LE(Math.round(r * 32767), 46 + s * 4);
}
mkdirSync(join(HERE, "out"), { recursive: true });
writeFileSync(join(HERE, "out", "soundtrack.wav"), buf);
console.log(`soundtrack.wav: ${DURATION}s, peak ${peak.toFixed(3)} -> normalized`);
