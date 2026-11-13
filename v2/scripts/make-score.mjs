// Adapted from the user-provided 1108 reference project. All changes and outputs belong to this repository.
// Procedurally synthesised 124 BPM EDM track, locked to the video's cut grid (src/score-timeline.json).
// No samples or third-party audio: every sound is generated here.
// Output: public/score.wav (44.1 kHz, 16-bit stereo)
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const TL = JSON.parse(fs.readFileSync(path.join(ROOT, "src/score-timeline.json"), "utf8"));

const SR = 44100;
const BEAT = 60 / TL.bpm;
const BAR = 4 * BEAT;
const S16 = BEAT / 4;
const G0 = TL.grid0;
const lastFrom = Math.round((G0 + TL.cutBars[TL.cutBars.length - 1] * BAR) * TL.fps - TL.overlap / 2);
const TOTAL = TL.total / TL.fps;
const N = Math.ceil(TOTAL * SR);
const tb = (bar, step = 0) => G0 + bar * BAR + step * S16; // time of bar/16th step

// ---------- deterministic RNG ----------
let seed = 21114;
const rnd = () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const noise = () => rnd() * 2 - 1;

// ---------- buses ----------
const mk = () => new Float32Array(N);
const drumL = mk(), drumR = mk();
const musL = mk(), musR = mk(); // sidechained
const fxL = mk(), fxR = mk();
const revL = mk(), revR = mk(); // reverb send
const dlyL = mk(), dlyR = mk(); // delay send
const chordL = mk(), chordR = mk(); // raw supersaw before filter

const addSt = (L, R, i, v, pan = 0.5) => {
  if (i < 0 || i >= N) return;
  L[i] += v * Math.cos((pan * Math.PI) / 2) * 1.414;
  R[i] += v * Math.sin((pan * Math.PI) / 2) * 1.414;
};

// ---------- biquad ----------
class Biquad {
  constructor(type, f, q = 0.707) {
    this.type = type;
    this.x1 = this.x2 = this.y1 = this.y2 = 0;
    this.set(f, q);
  }
  set(f, q = this.q) {
    this.q = q;
    const w = (2 * Math.PI * Math.min(f, SR * 0.45)) / SR;
    const c = Math.cos(w), s = Math.sin(w), a = s / (2 * q);
    let b0, b1, b2;
    if (this.type === "lp") { b0 = (1 - c) / 2; b1 = 1 - c; b2 = (1 - c) / 2; }
    else if (this.type === "hp") { b0 = (1 + c) / 2; b1 = -(1 + c); b2 = (1 + c) / 2; }
    else { b0 = a; b1 = 0; b2 = -a; } // bandpass
    const a0 = 1 + a;
    this.b0 = b0 / a0; this.b1 = b1 / a0; this.b2 = b2 / a0;
    this.a1 = (-2 * c) / a0; this.a2 = (1 - a) / a0;
  }
  p(x) {
    const y = this.b0 * x + this.b1 * this.x1 + this.b2 * this.x2 - this.a1 * this.y1 - this.a2 * this.y2;
    this.x2 = this.x1; this.x1 = x; this.y2 = this.y1; this.y1 = y;
    return y;
  }
}

// ---------- oscillators ----------
const blep = (t, dt) => {
  if (t < dt) { t /= dt; return t + t - t * t - 1; }
  if (t > 1 - dt) { t = (t - 1) / dt; return t * t + t + t + 1; }
  return 0;
};
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

// ---------- arrangement ----------
const secAt = (bar) => TL.sections.find((s) => bar >= s.from && bar < s.to) || { type: "none", from: bar, to: bar + 1 };
const P = {
  intro:     { kick: 1, clap: 0, hat: 0, ohat: 0, bass: 0.6, bassCut: 350, chord: 0.35, cut: [400, 1400], lead: 0, sc: 1 },
  drop:      { kick: 1, clap: 1, hat: 1, ohat: 1, bass: 0.95, bassCut: 950, chord: 0.85, cut: [4200, 5200], lead: 0.45, sc: 1 },
  grooveA:   { kick: 1, clap: 1, hat: 1, ohat: 0, bass: 0.65, bassCut: 500, chord: 0.35, cut: [750, 1100], lead: 0, sc: 1 },
  grooveA2:  { kick: 1, clap: 1, hat: 1, ohat: 0, bass: 0.68, bassCut: 650, chord: 0.4, cut: [950, 1550], lead: 0.14, sc: 1 },
  grooveB:   { kick: 1, clap: 1, hat: 1, ohat: 0, bass: 0.75, bassCut: 750, chord: 0.45, cut: [1200, 1900], lead: 0.2, sc: 1 },
  build:     { kick: 1, clap: 0, hat: 2, ohat: 0, bass: 0.9, bassCut: 900, chord: 0.75, cut: [350, 4200], lead: 0.2, sc: 1 },
  breakdown: { kick: 0, clap: 0, hat: 0, ohat: 0, bass: 0, bassCut: 400, chord: 0.5, cut: [450, 1300], lead: 0.15, sc: 0 },
  tail:      { kick: 0, clap: 0, hat: 0, ohat: 0, bass: 0, bassCut: 400, chord: 0.6, cut: [2500, 600], lead: 0, sc: 0 },
  none:      { kick: 0, clap: 0, hat: 0, ohat: 0, bass: 0, bassCut: 400, chord: 0, cut: [500, 500], lead: 0, sc: 0 },
};
// F-sharp minor: F#m9 – Dmaj7 – Aadd9 – Esus, each chord lasts two bars.
const PROG = [
 {bass:42,ch:[57,61,64,68]},
 {bass:38,ch:[57,61,66,69]},
 {bass:45,ch:[57,59,64,69]},
 {bass:40,ch:[56,59,64,69]}
];
const chordAt = (bar) => PROG[((Math.floor(bar / 2) % 4) + 4) % 4];

// ---------- instruments ----------
function kick(t, v = 1) {
  const i0 = Math.round(t * SR), n = Math.round(0.42 * SR);
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const tt = i / SR;
    const f = 46 + 120 * Math.exp(-tt * 38);
    ph += (2 * Math.PI * f) / SR;
    let s = Math.sin(ph) * Math.exp(-tt * 6.5);
    if (i < 220) s += noise() * 0.35 * Math.exp(-i / 35);
    s = Math.tanh(s * 1.8) * 0.95 * v;
    addSt(drumL, drumR, i0 + i, s);
  }
}
function clap(t, v = 1) {
  const i0 = Math.round(t * SR), n = Math.round(0.32 * SR);
  const bp = new Biquad("bp", 1400, 0.9), hp = new Biquad("hp", 600);
  for (let i = 0; i < n; i++) {
    const tt = i / SR;
    let e = 0;
    for (const o of [0, 0.011, 0.022]) if (tt >= o) e = Math.max(e, Math.exp(-(tt - o) * (o < 0.02 ? 140 : 14)));
    const s = hp.p(bp.p(noise())) * e * 2.4 * v;
    addSt(drumL, drumR, i0 + i, s, 0.48);
    if (i0 + i < N) { revL[i0 + i] += s * 0.35; revR[i0 + i] += s * 0.35; }
  }
}
function snare(t, v = 1) {
  const i0 = Math.round(t * SR), n = Math.round(0.16 * SR);
  const bp = new Biquad("bp", 2200, 0.7);
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const tt = i / SR;
    ph += (2 * Math.PI * 190) / SR;
    const s = (bp.p(noise()) * 1.6 * Math.exp(-tt * 22) + Math.sin(ph) * 0.5 * Math.exp(-tt * 30)) * v;
    addSt(drumL, drumR, i0 + i, s, 0.52);
    if (i0 + i < N) { revL[i0 + i] += s * 0.25; revR[i0 + i] += s * 0.25; }
  }
}
function hat(t, v = 1, open = false, pan = 0.62) {
  const i0 = Math.round(t * SR), n = Math.round((open ? 0.26 : 0.05) * SR);
  const hp = new Biquad("hp", 7600, 0.8);
  const dec = open ? 11 : 75;
  for (let i = 0; i < n; i++) {
    const s = hp.p(noise()) * Math.exp(-(i / SR) * dec) * 0.42 * v;
    addSt(drumL, drumR, i0 + i, s, pan);
  }
}
function crash(t, v = 1) {
  const i0 = Math.round(t * SR), n = Math.round(2.2 * SR);
  const hpL = new Biquad("hp", 4200), hpR = new Biquad("hp", 4200);
  for (let i = 0; i < n && i0 + i < N; i++) {
    const e = Math.exp(-(i / SR) * 2.1) * 0.32 * v;
    fxL[i0 + i] += hpL.p(noise()) * e;
    fxR[i0 + i] += hpR.p(noise()) * e;
  }
}
function impact(t, v = 1) {
  const i0 = Math.round(t * SR), n = Math.round(1.6 * SR);
  let ph = 0;
  for (let i = 0; i < n && i0 + i < N; i++) {
    const tt = i / SR;
    ph += (2 * Math.PI * (32 + 40 * Math.exp(-tt * 9))) / SR;
    const s = Math.tanh(Math.sin(ph) * Math.exp(-tt * 2.6) * 1.4) * 0.7 * v;
    fxL[i0 + i] += s; fxR[i0 + i] += s;
    revL[i0 + i] += s * 0.2; revR[i0 + i] += s * 0.2;
  }
}
function riser(t0, t1, v = 1) {
  const i0 = Math.round(t0 * SR), i1 = Math.min(N, Math.round(t1 * SR));
  const bpL = new Biquad("bp", 300, 1.2), bpR = new Biquad("bp", 300, 1.2);
  let ph = 0;
  for (let i = i0; i < i1; i++) {
    const p = (i - i0) / (i1 - i0);
    if ((i - i0) % 64 === 0) { const fc = 300 * Math.pow(30, p); bpL.set(fc, 1.2); bpR.set(fc, 1.2); }
    const f = 180 * Math.pow(8, p);
    ph = (ph + f / SR) % 1;
    const saw = (2 * ph - 1) * 0.08 * p * p;
    const a = p * p * 0.55 * v;
    fxL[i] += bpL.p(noise()) * a + saw;
    fxR[i] += bpR.p(noise()) * a + saw;
    revL[i] += saw * 0.6; revR[i] += saw * 0.6;
  }
}
function bassNote(t, dur, midi, v, cut) {
  const i0 = Math.round(t * SR), n = Math.round(dur * SR);
  const f = mtof(midi), dt = f / SR;
  const lp = new Biquad("lp", cut, 1.1);
  let ph = rnd(), ph2 = 0;
  for (let i = 0; i < n; i++) {
    ph += dt; if (ph >= 1) ph -= 1;
    ph2 += dt / 2; if (ph2 >= 1) ph2 -= 1;
    const saw = 2 * ph - 1 - blep(ph, dt);
    const sub = Math.sin(2 * Math.PI * ph2) * 0.9;
    const env = Math.min(1, i / (0.003 * SR)) * Math.min(1, (n - i) / (0.008 * SR)) * (0.75 + 0.25 * Math.exp(-(i / SR) * 18));
    const s = (lp.p(saw) * 0.55 + sub * 0.45) * env * v * 0.8;
    addSt(musL, musR, i0 + i, s);
  }
}
function supersaw(t, dur, notes, v) {
  const i0 = Math.round(t * SR), n = Math.round(dur * SR), xf = Math.round(0.012 * SR);
  const cents = [-24, -15, -7, 0, 7, 15, 24];
  for (const m of notes) {
    cents.forEach((c, k) => {
      const f = mtof(m) * Math.pow(2, c / 1200), dt = f / SR;
      let ph = rnd();
      const pan = 0.15 + (0.7 * k) / (cents.length - 1);
      const gl = Math.cos((pan * Math.PI) / 2), gr = Math.sin((pan * Math.PI) / 2);
      const amp = (0.085 * v) / Math.sqrt(notes.length);
      for (let i = 0; i < n + xf && i0 + i < N; i++) {
        ph += dt; if (ph >= 1) ph -= 1;
        const s = (2 * ph - 1 - blep(ph, dt)) * amp * Math.min(1, i / xf) * Math.min(1, (n + xf - i) / xf);
        chordL[i0 + i] += s * gl; chordR[i0 + i] += s * gr;
      }
    });
  }
}
function pluck(t, midi, v, pan) {
  const i0 = Math.round(t * SR), n = Math.round(0.28 * SR);
  const f = mtof(midi), dt = f / SR;
  const lp = new Biquad("lp", 5200, 0.9);
  let ph = rnd(), ph2 = rnd();
  for (let i = 0; i < n; i++) {
    ph += dt; if (ph >= 1) ph -= 1;
    ph2 += dt * 1.005; if (ph2 >= 1) ph2 -= 1;
    const sq = (ph2 < 0.5 ? 1 : -1) * 0.5;
    const tt = i / SR;
    if (i % 32 === 0) lp.set(900 + 5200 * Math.exp(-tt * 16), 1.4);
    const s = lp.p(2 * ph - 1 - blep(ph, dt) + sq) * Math.exp(-tt * 11) * Math.min(1, i / 40) * 0.17 * v;
    addSt(musL, musR, i0 + i, s, pan);
    if (i0 + i < N) { dlyL[i0 + i] += s * 0.5; dlyR[i0 + i] += s * 0.5; revL[i0 + i] += s * 0.3; revR[i0 + i] += s * 0.3; }
  }
}

// ---------- tension + engage (cold open, before the grid) ----------
{
  const tEng = TL.engage;
  const n = Math.round((tEng + 0.3) * SR);
  const lp = new Biquad("bp", 200, 0.8);
  let a = 0, b = 0, c = 0;
  for (let i = 0; i < n; i++) {
    const tt = i / SR;
    const e = Math.min(1, tt / 1.0) * Math.max(0, Math.min(1, (tEng + 0.05 - tt) / 0.08));
    if (i % 64 === 0) lp.set(150 * Math.pow(12, tt / tEng), 1.0);
    a += (2 * Math.PI * 110) / SR; b += (2 * Math.PI * 116.5) / SR; c += (2 * Math.PI * 55 * (1 + tt / tEng)) / SR;
    const wob = 0.5 + 0.5 * Math.sin(2 * Math.PI * (2 + 6 * tt / tEng) * tt);
    const s = (lp.p(noise()) * 0.5 * (tt / tEng) + (Math.sin(a) + Math.sin(b)) * 0.08 * wob + Math.tanh(Math.sin(c) * 2) * 0.12) * e;
    fxL[i] += s; fxR[i] += s * 0.95;
  }
  riser(tEng - 2.4, tEng, 0.7);
  impact(tEng, 1);
  crash(tEng, 0.7);
}

// ---------- sequence the grid ----------
const firstBar = TL.sections[0].from;
const lastBar = TL.sections[TL.sections.length - 1].to;
for (let bar = firstBar; bar < lastBar; bar++) {
  const sec = secAt(bar);
  const p = P[sec.type];
  const lastOfSec = bar === sec.to - 1;
  const ch = chordAt(bar);
  const secLen = sec.to - sec.from;
  const prog = (bar - sec.from) / secLen;
  // drums
  const kickOn = p.kick && !(sec.type === "build" && lastOfSec);
  for (let s = 0; s < 16; s++) {
    const t = tb(bar, s);
    if (t >= TOTAL) break;
    if (kickOn && s % 4 === 0) kick(t, 1);
    if (p.clap && (s === 4 || s === 12)) clap(t, 0.9);
    if (p.hat === 1 && s % 4 === 2) hat(t, 0.8);
    if (p.hat === 2) {
      if (s % 4 === 2) hat(t, p.ohat ? 0.75 : 0.85, !!p.ohat, 0.66);
      else hat(t, 0.35 + 0.1 * (s % 2), false, 0.38);
    }
    if (p.bass && [2, 3, 6, 7, 10, 11, 14, 15].includes(s) && !(sec.type === "build" && lastOfSec)) {
      const note = ch.bass + (s % 4 === 3 ? 12 : 0);
      bassNote(t, S16 * 0.92, note, p.bass, p.bassCut * (sec.type === "build" ? 0.6 + prog : 1));
    }
  }
  // drum fill every 8 bars in grooves/drops (last half-bar snare 16ths)
  if (["drop", "grooveA2", "grooveB"].includes(sec.type) && ((bar - sec.from) % 8 === 7) && !lastOfSec) {
    for (let s = 12; s < 16; s++) snare(tb(bar, s), 0.35 + 0.1 * (s - 12));
  }
  // chords: sustained supersaw per bar
  if (p.chord) supersaw(tb(bar), BAR, ch.ch, p.chord);
  // lead arp (16ths, chord tones up an octave)
  if (p.lead) {
    const pat = [0, 1, 2, 3, 2, 1, 3, 2, 0, 2, 1, 3, 2, 3, 1, 2];
    const notes = ch.ch.map((m) => m + 12);
    for (let s = 0; s < 16; s++) {
      const t = tb(bar, s);
      if (t >= TOTAL) break;
      if (sec.type === "build" && prog < 0.5) continue;
      if (![0,3,6,8,11,14].includes(s)) continue;
      pluck(t, notes[pat[s]], p.lead * (s % 4 === 0 ? 1 : 0.75), s % 2 ? 0.3 : 0.7);
    }
  }
  // builds: snare roll + riser over last 4 bars (last 1 bar for intro/breakdown)
  if (["build", "intro", "breakdown"].includes(sec.type)) {
    const rollBars = sec.type === "build" ? 4 : sec.type === "intro" ? 2 : 2;
    const k = sec.to - bar; // bars remaining incl. this
    if (k <= rollBars) {
      const density = [16, 8, 4, 4][Math.min(3, k - 1)];
      for (let j = 0; j < density; j++) {
        const t = tb(bar) + (j * BAR) / density;
        const vv = 0.25 + 0.75 * (1 - (k - 1 + 1 - j / density) / rollBars);
        snare(t, vv * 0.55);
      }
      if (k === rollBars) riser(tb(bar), tb(sec.to), 0.5);
    }
  }
}

// section-start accents: crash + impact on drops, crash on new grooves
TL.sections.forEach((s) => {
  const t = tb(s.from);
  if (t < 0 || s.type === "intro") return;
  if (s.type === "drop") { crash(t, 1); impact(t, 1); }
  else if (["grooveA", "grooveA2", "grooveB", "build"].includes(s.type)) crash(t, 0.55);
  else if (s.type === "tail") { crash(t, 0.9); impact(t, 0.9); }
});

// ---------- chord bus: time-varying low-pass ----------
{
  const lpL = new Biquad("lp", 1000, 0.9), lpR = new Biquad("lp", 1000, 0.9);
  for (let i = 0; i < N; i++) {
    if (i % 64 === 0) {
      const t = i / SR;
      const bar = Math.floor((t - G0) / BAR);
      const sec = secAt(bar);
      const p = P[sec.type];
      const pr = Math.max(0, Math.min(1, (t - tb(sec.from)) / (tb(sec.to) - tb(sec.from))));
      const fc = p.cut[0] * Math.pow(p.cut[1] / p.cut[0], sec.type === "build" ? pr * pr : pr);
      lpL.set(fc, sec.type === "build" ? 2.2 : 0.9);
      lpR.set(fc, sec.type === "build" ? 2.2 : 0.9);
    }
    const l = lpL.p(chordL[i]), r = lpR.p(chordR[i]);
    musL[i] += l; musR[i] += r;
    revL[i] += l * 0.15; revR[i] += r * 0.15;
  }
}

// ---------- tail fade for the pad ----------
{
  const t0 = tb(TL.sections[TL.sections.length - 1].from);
  for (let i = Math.round(t0 * SR); i < N; i++) {
    const g = Math.max(0, 1 - (i / SR - t0) / (TOTAL - t0));
    musL[i] *= g; musR[i] *= g;
  }
}

// ---------- sidechain pump on music bus ----------
for (let i = 0; i < N; i++) {
  const t = i / SR;
  const bt = (t - G0) / BEAT;
  const bar = Math.floor(bt / 4);
  const sec = secAt(bar);
  const p = P[sec.type];
  const kickOn = p.kick && !(sec.type === "build" && bar === sec.to - 1);
  if (!kickOn || t < TL.engage) continue;
  const x = (bt - Math.floor(bt)) * BEAT;
  const g = 0.18 + 0.82 * Math.pow(Math.min(1, x / 0.24), 1.6);
  musL[i] *= g; musR[i] *= g;
}

// ---------- ping-pong delay (dotted 8th) ----------
{
  const d = Math.round(0.75 * BEAT * SR);
  const bL = new Float32Array(d), bR = new Float32Array(d);
  let w = 0;
  for (let i = 0; i < N; i++) {
    const oL = bL[w], oR = bR[w];
    bL[w] = dlyL[i] + oR * 0.42;
    bR[w] = oL * 0.42;
    musL[i] += oL * 0.5; musR[i] += oR * 0.5;
    w = (w + 1) % d;
  }
}

// ---------- reverb (Freeverb-style) ----------
function freeverb(inp, spread) {
  const combs = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617].map((x) => Math.round(((x + spread) * SR) / 44100));
  const aps = [556, 441, 341, 225].map((x) => Math.round(((x + spread) * SR) / 44100));
  const cb = combs.map((l) => ({ b: new Float32Array(l), i: 0, f: 0 }));
  const ab = aps.map((l) => ({ b: new Float32Array(l), i: 0 }));
  const out = new Float32Array(N);
  const fb = 0.86, damp = 0.3;
  for (let n = 0; n < N; n++) {
    const x = inp[n] * 0.015;
    let y = 0;
    for (const c of cb) {
      const o = c.b[c.i];
      c.f = o * (1 - damp) + c.f * damp;
      c.b[c.i] = x + c.f * fb;
      c.i = (c.i + 1) % c.b.length;
      y += o;
    }
    for (const a of ab) {
      const o = a.b[a.i];
      a.b[a.i] = y + o * 0.5;
      a.i = (a.i + 1) % a.b.length;
      y = o - y;
    }
    out[n] = y;
  }
  return out;
}
const wetL = freeverb(revL, 0), wetR = freeverb(revR, 23);

// ---------- master ----------
const outL = new Float32Array(N), outR = new Float32Array(N);
const hpL = new Biquad("hp", 28), hpR = new Biquad("hp", 28);
const LEVEL = { intro: [0.62, 0.8], drop: [1, 1], grooveA: [0.66, 0.66], grooveA2: [0.72, 0.72], grooveB: [0.84, 0.84], build: [0.7, 1], breakdown: [1.7, 1.9], tail: [1.6, 1.6], none: [1, 1] };
let peak = 0, lvl = 1;
for (let i = 0; i < N; i++) {
  if (i % 64 === 0) {
    const t = i / SR;
    const bar = Math.floor((t - G0) / BAR);
    const sec = secAt(bar);
    const [a, b] = LEVEL[sec.type];
    const pr = Math.max(0, Math.min(1, (t - tb(sec.from)) / (tb(sec.to) - tb(sec.from))));
    lvl = t < TL.engage ? 1 : a + (b - a) * pr;
  }
  let l = (drumL[i] * 0.9 + musL[i] * 0.85) * lvl + fxL[i] + wetL[i] * 1.1;
  let r = (drumR[i] * 0.9 + musR[i] * 0.85) * lvl + fxR[i] + wetR[i] * 1.1;
  l = hpL.p(l); r = hpR.p(r);
  outL[i] = l; outR[i] = r;
  peak = Math.max(peak, Math.abs(l), Math.abs(r));
}
// soft-clip "glue" then normalise
const drive = 1.25;
let peak2 = 0;
for (let i = 0; i < N; i++) {
  outL[i] = Math.tanh((outL[i] / peak) * drive);
  outR[i] = Math.tanh((outR[i] / peak) * drive);
  peak2 = Math.max(peak2, Math.abs(outL[i]), Math.abs(outR[i]));
}
const fadeOut = Math.round(1.5 * SR);
const buf = Buffer.alloc(44 + N * 4);
buf.write("RIFF", 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write("WAVE", 8);
buf.write("fmt ", 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22);
buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34);
buf.write("data", 36); buf.writeUInt32LE(N * 4, 40);
let sumsq = 0;
for (let i = 0; i < N; i++) {
  const g = (0.94 / peak2) * Math.min(1, (N - i) / fadeOut);
  const l = Math.max(-1, Math.min(1, outL[i] * g)), r = Math.max(-1, Math.min(1, outR[i] * g));
  sumsq += l * l + r * r;
  buf.writeInt16LE(Math.round(l * 32767), 44 + i * 4);
  buf.writeInt16LE(Math.round(r * 32767), 46 + i * 4);
}
const out = path.join(ROOT, "public/score.wav");
fs.writeFileSync(out, buf);
console.log("wrote", out, TOTAL.toFixed(2) + "s", "rms dBFS", (10 * Math.log10(sumsq / (2 * N))).toFixed(1));
