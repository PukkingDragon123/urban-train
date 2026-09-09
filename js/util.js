// Core utilities: namespace, seeded RNG, math helpers, value noise, timers.
window.PH = window.PH || {};
(function (PH) {
  'use strict';

  // ---- Seeded RNG (mulberry32) ----
  function RNG(seed) { this.s = (seed >>> 0) || 0x9e3779b9; }
  RNG.prototype.next = function () {
    let t = (this.s += 0x6D2B79F5) | 0;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  RNG.prototype.range = function (a, b) { return a + (b - a) * this.next(); };
  RNG.prototype.int = function (a, b) { return Math.floor(this.range(a, b + 1)); };
  RNG.prototype.pick = function (arr) { return arr[Math.floor(this.next() * arr.length)]; };
  RNG.prototype.chance = function (p) { return this.next() < p; };
  PH.RNG = RNG;
  PH.rng = new RNG(1337);
  PH.rand = function (a, b) { if (a === undefined) return PH.rng.next(); if (b === undefined) return PH.rng.next() * a; return PH.rng.range(a, b); };
  PH.randInt = function (a, b) { return PH.rng.int(a, b); };
  PH.pick = function (arr) { return PH.rng.pick(arr); };
  PH.chance = function (p) { return PH.rng.chance(p); };

  // ---- Math ----
  PH.clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  PH.lerp = function (a, b, t) { return a + (b - a) * t; };
  PH.smoothstep = function (t) { t = PH.clamp(t, 0, 1); return t * t * (3 - 2 * t); };
  PH.approach = function (v, target, step) { return v < target ? Math.min(v + step, target) : Math.max(v - step, target); };
  PH.dist = function (ax, ay, bx, by) { const dx = ax - bx, dy = ay - by; return Math.sqrt(dx * dx + dy * dy); };
  PH.sign = function (v) { return v < 0 ? -1 : v > 0 ? 1 : 0; };
  PH.wrap = function (v, m) { return ((v % m) + m) % m; };
  PH.easeOut = function (t) { return 1 - (1 - t) * (1 - t); };
  PH.easeInOut = function (t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; };
  PH.mod = function (a, n) { return ((a % n) + n) % n; };

  // ---- Hash / value noise (deterministic, for wallpaper, grass, flicker) ----
  PH.hash = function (x, y) {
    let h = (x | 0) * 374761393 + (y | 0) * 668265263;
    h = (h ^ (h >>> 13)) * 1274126177;
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  };
  PH.noise1 = function (x) {
    const i = Math.floor(x), f = x - i;
    const a = PH.hash(i, 7), b = PH.hash(i + 1, 7);
    return PH.lerp(a, b, PH.smoothstep(f));
  };
  PH.noise2 = function (x, y) {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const a = PH.hash(xi, yi), b = PH.hash(xi + 1, yi), c = PH.hash(xi, yi + 1), d = PH.hash(xi + 1, yi + 1);
    const u = PH.smoothstep(xf), v = PH.smoothstep(yf);
    return PH.lerp(PH.lerp(a, b, u), PH.lerp(c, d, u), v);
  };
  PH.fbm = function (x, y, oct) {
    let v = 0, amp = 0.5, f = 1;
    for (let i = 0; i < (oct || 3); i++) { v += amp * PH.noise2(x * f, y * f); amp *= 0.5; f *= 2; }
    return v;
  };

  // ---- Colors ----
  PH.hexToRgb = function (hex) {
    const h = hex.replace('#', '');
    return [parseInt(h.substr(0, 2), 16), parseInt(h.substr(2, 2), 16), parseInt(h.substr(4, 2), 16)];
  };
  PH.rgb = function (r, g, b, a) {
    r = PH.clamp(Math.round(r), 0, 255); g = PH.clamp(Math.round(g), 0, 255); b = PH.clamp(Math.round(b), 0, 255);
    return a === undefined ? 'rgb(' + r + ',' + g + ',' + b + ')' : 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
  };
  PH.shade = function (hex, k) { const c = PH.hexToRgb(hex); return PH.rgb(c[0] * k, c[1] * k, c[2] * k); };
  PH.mix = function (hexA, hexB, t) {
    const a = PH.hexToRgb(hexA), b = PH.hexToRgb(hexB);
    return PH.rgb(PH.lerp(a[0], b[0], t), PH.lerp(a[1], b[1], t), PH.lerp(a[2], b[2], t));
  };

  // ---- Spring (for procedural animation) ----
  function Spring(value, stiffness, damping) { this.v = value || 0; this.t = value || 0; this.vel = 0; this.k = stiffness || 120; this.d = damping || 12; }
  Spring.prototype.update = function (dt) {
    const f = (this.t - this.v) * this.k - this.vel * this.d;
    this.vel += f * dt; this.v += this.vel * dt; return this.v;
  };
  Spring.prototype.kick = function (impulse) { this.vel += impulse; };
  PH.Spring = Spring;

  // ---- Text helpers ----
  PH.wrapText = function (text, maxChars) {
    const words = String(text).split(' '); const lines = []; let line = '';
    for (const w of words) {
      if ((line + ' ' + w).trim().length > maxChars && line.length) { lines.push(line); line = w; }
      else line = (line ? line + ' ' : '') + w;
    }
    if (line) lines.push(line);
    return lines;
  };
  const GLITCH = '#%&@!?/\\|_-=+*^~<>[]{}';
  PH.glitchText = function (text, amount, seed) {
    if (amount <= 0) return text;
    let out = '';
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (c === ' ' || c === '\n') { out += c; continue; }
      const r = PH.hash(i * 31 + (seed | 0), Math.floor(PH.time * 6));
      if (r < amount * 0.6) out += GLITCH[Math.floor(PH.hash(i, seed + 99) * GLITCH.length)];
      else if (r < amount) out += '█';
      else out += c;
    }
    return out;
  };

  PH.time = 0; // global elapsed seconds, set by main loop
  PH.fmtClock = function (hours) {
    let h = Math.floor(hours) % 24, m = Math.floor((hours % 1) * 60);
    const ap = h >= 12 ? 'PM' : 'AM'; h = h % 12; if (h === 0) h = 12;
    return (h < 10 ? ' ' : '') + h + ':' + (m < 10 ? '0' : '') + m + ' ' + ap;
  };

  // Simple event bus
  const listeners = {};
  PH.on = function (ev, fn) { (listeners[ev] = listeners[ev] || []).push(fn); };
  PH.emit = function (ev, data) { const l = listeners[ev]; if (l) for (const f of l) f(data); };
})(window.PH);
