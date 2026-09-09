// Procedural audio: ambient drones, parrot vocalizations, foley, and sanity-driven filtering.
(function (PH) {
  'use strict';
  const A = {};
  let ctx = null, master = null, lowpass = null, ambGain = null, whisperGain = null, started = false;
  let musicNodes = null;
  A.enabled = true;
  A.muted = false;

  A.init = function () {
    if (started) return;
    started = true;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) { A.enabled = false; return; }
    master = ctx.createGain(); master.gain.value = 0.7;
    lowpass = ctx.createBiquadFilter(); lowpass.type = 'lowpass'; lowpass.frequency.value = 18000;
    lowpass.connect(master); master.connect(ctx.destination);
    ambGain = ctx.createGain(); ambGain.gain.value = 0.25; ambGain.connect(lowpass);
    whisperGain = ctx.createGain(); whisperGain.gain.value = 0; whisperGain.connect(lowpass);
    startAmbient();
    startWhispers();
  };
  A.resume = function () { if (ctx && ctx.state === 'suspended') ctx.resume(); };
  A.toggleMute = function () { A.muted = !A.muted; if (master) master.gain.value = A.muted ? 0 : 0.7; };

  function now() { return ctx.currentTime; }

  // ---- Noise buffer ----
  let noiseBuf = null;
  function getNoise() {
    if (noiseBuf) return noiseBuf;
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < d.length; i++) { // pinkish noise
      const w = Math.random() * 2 - 1;
      b0 = 0.99765 * b0 + w * 0.099; b1 = 0.963 * b1 + w * 0.2965; b2 = 0.57 * b2 + w * 1.0526;
      d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.15;
    }
    return noiseBuf;
  }

  // ---- Ambient layers ----
  let amb = {};
  function startAmbient() {
    // wind: filtered noise
    const wind = ctx.createBufferSource(); wind.buffer = getNoise(); wind.loop = true;
    const wf = ctx.createBiquadFilter(); wf.type = 'bandpass'; wf.frequency.value = 400; wf.Q.value = 0.6;
    const wg = ctx.createGain(); wg.gain.value = 0.0;
    wind.connect(wf); wf.connect(wg); wg.connect(ambGain); wind.start();
    amb.wind = { src: wind, filt: wf, gain: wg };
    // rain
    const rain = ctx.createBufferSource(); rain.buffer = getNoise(); rain.loop = true;
    const rf = ctx.createBiquadFilter(); rf.type = 'highpass'; rf.frequency.value = 2500;
    const rg = ctx.createGain(); rg.gain.value = 0;
    rain.connect(rf); rf.connect(rg); rg.connect(ambGain); rain.start();
    amb.rain = { gain: rg };
    // drone: two detuned oscillators, low
    const d1 = ctx.createOscillator(), d2 = ctx.createOscillator(); d1.type = 'sine'; d2.type = 'triangle';
    d1.frequency.value = 55; d2.frequency.value = 55.7;
    const dg = ctx.createGain(); dg.gain.value = 0.0;
    d1.connect(dg); d2.connect(dg); dg.connect(ambGain); d1.start(); d2.start();
    amb.drone = { gain: dg, o1: d1, o2: d2 };
    // house hum
    const h = ctx.createOscillator(); h.type = 'sawtooth'; h.frequency.value = 60;
    const hf = ctx.createBiquadFilter(); hf.type = 'lowpass'; hf.frequency.value = 120;
    const hg = ctx.createGain(); hg.gain.value = 0.0;
    h.connect(hf); hf.connect(hg); hg.connect(ambGain); h.start();
    amb.hum = { gain: hg };
  }

  function startWhispers() {
    // Whispers: modulated noise bursts, granular. Level driven by sanity/exposure.
    const src = ctx.createBufferSource(); src.buffer = getNoise(); src.loop = true;
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 6; f.frequency.value = 1200;
    const lfo = ctx.createOscillator(); lfo.frequency.value = 3.7; const lg = ctx.createGain(); lg.gain.value = 700;
    lfo.connect(lg); lg.connect(f.frequency); lfo.start();
    const trem = ctx.createGain(); const tl = ctx.createOscillator(); tl.frequency.value = 7.3; const tg = ctx.createGain(); tg.gain.value = 0.5;
    tl.connect(tg); tg.connect(trem.gain); trem.gain.value = 0.5; tl.start();
    src.connect(f); f.connect(trem); trem.connect(whisperGain); src.start();
  }

  // Called each frame with environment state.
  A.setEnvironment = function (env) {
    if (!ctx) return;
    const t = now(), r = 0.4;
    const set = (p, v) => { p.cancelScheduledValues(t); p.setTargetAtTime(v, t, r); };
    set(amb.wind.gain.gain, env.outdoor ? 0.35 * (0.5 + env.wind) : 0.05);
    amb.wind.filt.frequency.setTargetAtTime(300 + env.wind * 500 + Math.sin(PH.time * 0.3) * 80, t, r);
    set(amb.rain.gain.gain, env.rain * (env.outdoor ? 0.35 : 0.08));
    set(amb.drone.gain.gain, 0.05 + env.dread * 0.35);
    amb.drone.o2.frequency.setTargetAtTime(55.7 + env.dread * 4, t, r);
    set(amb.hum.gain.gain, env.outdoor ? 0 : 0.06);
    set(whisperGain.gain, env.whisper * 0.25);
    lowpass.frequency.setTargetAtTime(18000 - env.dread * 15000, t, r);
  };

  // ---- One-shots ----
  function env(g, t0, a, d, peak) {
    g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(peak, t0 + a); g.gain.exponentialRampToValueAtTime(0.001, t0 + a + d);
  }
  A.click = function () {
    if (!ctx || A.muted) return;
    const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'square'; o.frequency.value = 880;
    o.connect(g); g.connect(lowpass); env(g, now(), 0.001, 0.05, 0.08); o.start(); o.stop(now() + 0.08);
  };
  A.step = function (surface) {
    if (!ctx || A.muted) return;
    const s = ctx.createBufferSource(); s.buffer = getNoise();
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = surface === 'grass' ? 900 : surface === 'wood' ? 500 : 1400;
    const g = ctx.createGain(); s.connect(f); f.connect(g); g.connect(lowpass);
    env(g, now(), 0.005, surface === 'wood' ? 0.09 : 0.06, surface === 'wood' ? 0.35 : 0.22);
    s.start(now(), Math.random() * 1.5); s.stop(now() + 0.15);
  };
  A.door = function () {
    if (!ctx || A.muted) return;
    const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'triangle';
    o.frequency.setValueAtTime(180, now()); o.frequency.exponentialRampToValueAtTime(90, now() + 0.25);
    o.connect(g); g.connect(lowpass); env(g, now(), 0.01, 0.3, 0.25); o.start(); o.stop(now() + 0.35);
    A.step('wood');
  };
  A.pickup = function () {
    if (!ctx || A.muted) return;
    const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine';
    o.frequency.setValueAtTime(520, now()); o.frequency.setValueAtTime(780, now() + 0.06);
    o.connect(g); g.connect(lowpass); env(g, now(), 0.005, 0.15, 0.2); o.start(); o.stop(now() + 0.2);
  };
  A.pour = function () {
    if (!ctx || A.muted) return;
    const s = ctx.createBufferSource(); s.buffer = getNoise();
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.setValueAtTime(1500, now()); f.frequency.linearRampToValueAtTime(2600, now() + 0.6); f.Q.value = 2;
    const g = ctx.createGain(); s.connect(f); f.connect(g); g.connect(lowpass); env(g, now(), 0.05, 0.7, 0.3); s.start(); s.stop(now() + 0.8);
  };
  A.seeds = function () {
    if (!ctx || A.muted) return;
    for (let i = 0; i < 8; i++) {
      const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'square'; o.frequency.value = 2000 + Math.random() * 2500;
      const t0 = now() + i * 0.03 + Math.random() * 0.02; o.connect(g); g.connect(lowpass); env(g, t0, 0.001, 0.02, 0.05); o.start(t0); o.stop(t0 + 0.04);
    }
  };
  A.heartbeat = function (intensity) {
    if (!ctx || A.muted) return;
    for (let i = 0; i < 2; i++) {
      const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine';
      const t0 = now() + i * 0.18; o.frequency.setValueAtTime(70, t0); o.frequency.exponentialRampToValueAtTime(35, t0 + 0.15);
      o.connect(g); g.connect(lowpass); env(g, t0, 0.01, 0.16, 0.5 * intensity * (i ? 0.7 : 1)); o.start(t0); o.stop(t0 + 0.2);
    }
  };
  A.phoneBuzz = function () {
    if (!ctx || A.muted) return;
    const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'square'; o.frequency.value = 140;
    o.connect(g); g.connect(lowpass); env(g, now(), 0.01, 0.2, 0.08); o.start(); o.stop(now() + 0.25);
    const o2 = ctx.createOscillator(), g2 = ctx.createGain(); o2.type = 'sine'; o2.frequency.value = 1320;
    o2.connect(g2); g2.connect(lowpass); env(g2, now() + 0.25, 0.005, 0.15, 0.1); o2.start(now() + 0.25); o2.stop(now() + 0.45);
  };
  A.sting = function (strength) {
    if (!ctx || A.muted) return;
    const s = strength || 1;
    const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sawtooth';
    o.frequency.setValueAtTime(110, now()); o.frequency.exponentialRampToValueAtTime(40, now() + 1.2);
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 600;
    o.connect(f); f.connect(g); g.connect(lowpass); env(g, now(), 0.02, 1.4, 0.35 * s); o.start(); o.stop(now() + 1.5);
    const n = ctx.createBufferSource(); n.buffer = getNoise(); const ng = ctx.createGain(); n.connect(ng); ng.connect(lowpass); env(ng, now(), 0.01, 0.5, 0.25 * s); n.start(); n.stop(now() + 0.6);
  };
  A.glass = function () {
    if (!ctx || A.muted) return;
    for (let i = 0; i < 5; i++) {
      const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.value = 3000 + Math.random() * 4000;
      const t0 = now() + Math.random() * 0.1; o.connect(g); g.connect(lowpass); env(g, t0, 0.001, 0.4, 0.06); o.start(t0); o.stop(t0 + 0.45);
    }
  };
  A.thump = function () {
    if (!ctx || A.muted) return;
    const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine';
    o.frequency.setValueAtTime(90, now()); o.frequency.exponentialRampToValueAtTime(30, now() + 0.3);
    o.connect(g); g.connect(lowpass); env(g, now(), 0.005, 0.35, 0.6); o.start(); o.stop(now() + 0.4);
  };

  // ---- Parrot vocalizations: synthesized per species profile ----
  // profile: {base, range, type, harsh, len}
  A.parrot = function (kind, profile, pan) {
    if (!ctx || A.muted) return;
    const p = profile || { base: 1800, range: 900, harsh: 0.3, len: 0.25 };
    const o = ctx.createOscillator(), g = ctx.createGain();
    const pn = ctx.createStereoPanner ? ctx.createStereoPanner() : null; if (pn) pn.pan.value = PH.clamp(pan || 0, -1, 1);
    o.type = p.harsh > 0.5 ? 'sawtooth' : 'triangle';
    const t0 = now();
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = p.harsh > 0.5 ? 3500 : 6000;
    o.connect(f); f.connect(g); if (pn) { g.connect(pn); pn.connect(lowpass); } else g.connect(lowpass);
    const vol = 0.12;
    if (kind === 'chirp') {
      o.frequency.setValueAtTime(p.base, t0); o.frequency.exponentialRampToValueAtTime(p.base + p.range, t0 + p.len * 0.5); o.frequency.exponentialRampToValueAtTime(p.base * 0.9, t0 + p.len);
      env(g, t0, 0.01, p.len, vol);
    } else if (kind === 'whistle') {
      const n = 3 + Math.floor(Math.random() * 3); let t = t0;
      for (let i = 0; i < n; i++) { const fr = p.base * (0.8 + Math.random() * 0.9); o.frequency.setValueAtTime(fr, t); o.frequency.linearRampToValueAtTime(fr * (0.9 + Math.random() * 0.4), t + 0.14); t += 0.16; }
      env(g, t0, 0.02, n * 0.16, vol * 0.9);
    } else if (kind === 'squawk') {
      o.type = 'sawtooth'; f.frequency.value = 2500;
      o.frequency.setValueAtTime(p.base * 0.5, t0); o.frequency.linearRampToValueAtTime(p.base * 0.7, t0 + 0.08); o.frequency.linearRampToValueAtTime(p.base * 0.45, t0 + 0.3);
      env(g, t0, 0.01, 0.35, vol * 1.3);
    } else if (kind === 'scream') {
      o.type = 'sawtooth'; f.frequency.value = 4000;
      o.frequency.setValueAtTime(p.base * 0.9, t0); o.frequency.linearRampToValueAtTime(p.base * 1.4, t0 + 0.2); o.frequency.linearRampToValueAtTime(p.base * 0.8, t0 + 0.6);
      env(g, t0, 0.02, 0.7, vol * 1.5);
    } else if (kind === 'mumble') { // mimicked human speech-like
      let t = t0; const n = 4 + Math.floor(Math.random() * 4);
      o.type = 'sawtooth'; f.frequency.value = 1200;
      for (let i = 0; i < n; i++) { o.frequency.setValueAtTime(180 + Math.random() * 120, t); t += 0.09 + Math.random() * 0.06; }
      env(g, t0, 0.02, t - t0, vol * 0.8);
    } else if (kind === 'purr') {
      o.type = 'square'; f.frequency.value = 800; o.frequency.value = p.base * 0.15;
      const lfo = ctx.createOscillator(); lfo.frequency.value = 22; const lg = ctx.createGain(); lg.gain.value = 40; lfo.connect(lg); lg.connect(o.frequency); lfo.start(); lfo.stop(t0 + 0.6);
      env(g, t0, 0.05, 0.6, vol * 0.5);
    }
    o.start(t0); o.stop(t0 + 1.4);
  };

  // ---- Music: record player (simple generative piano-like arpeggio) ----
  A.music = function (on) {
    if (!ctx) return;
    if (!on) { if (musicNodes) { musicNodes.gain.gain.setTargetAtTime(0, now(), 0.5); const m = musicNodes; setTimeout(() => { try { m.stop(); } catch (e) { } }, 1500); musicNodes = null; } return; }
    if (musicNodes) return;
    const g = ctx.createGain(); g.gain.value = 0; g.connect(lowpass); g.gain.setTargetAtTime(0.18, now(), 1.0);
    const notes = [261.6, 311.1, 392.0, 466.2, 523.3, 622.3, 392.0, 349.2];
    let i = 0, alive = true;
    function tick() {
      if (!alive) return;
      const o = ctx.createOscillator(), og = ctx.createGain(); o.type = 'triangle'; o.frequency.value = notes[i % notes.length] * (i % 16 > 7 ? 0.75 : 1);
      o.connect(og); og.connect(g); env(og, now(), 0.01, 0.9, 0.5); o.start(); o.stop(now() + 1);
      // vinyl crackle
      if (Math.random() < 0.4) { const n = ctx.createBufferSource(); n.buffer = getNoise(); const ng = ctx.createGain(); n.connect(ng); ng.connect(g); env(ng, now(), 0.001, 0.02, 0.15); n.start(now(), Math.random()); n.stop(now() + 0.03); }
      i++; setTimeout(tick, 420 + (i % 4 === 0 ? 200 : 0));
    }
    tick();
    musicNodes = { gain: g, stop: () => { alive = false; g.disconnect(); } };
  };
  A.musicPlaying = () => !!musicNodes;

  PH.audio = A;
})(window.PH);
