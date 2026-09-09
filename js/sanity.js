// Sanity: not a health bar. Exposure to hazards, grounding, perception distortion, hallucinations, time skips.
(function (PH) {
  'use strict';
  function Sanity() {
    this.value = 74; this.exposures = {}; this.pressure = 0; this.groundToday = {}; this.distortion = 0; this.whisper = 0; this.dread = 0;
    this.hallT = PH.rand(30, 70); this.active = []; this.slow = 1; this.breaking = 0; this.lowest = 74; this.timeSkips = 0; this.flickerT = 0; this.figure = null; this.heartT = 0;
    this.stareTarget = null; this.log = [];
  }
  Sanity.prototype.tier = function () { const v = this.value; return v > 60 ? 0 : v > 50 ? 1 : v > 38 ? 2 : v > 22 ? 3 : v > 0 ? 4 : 5; };
  Sanity.prototype.change = function (d, why) { this.value = PH.clamp(this.value + d, 0, 100); this.lowest = Math.min(this.lowest, this.value); if (d < -3 || d > 3) this.log.push({ d, why, t: PH.time }); };
  Sanity.prototype.exposure = function (id, amt) { this.exposures[id] = (this.exposures[id] || 0) + amt; this.pressure = Math.max(this.pressure, Math.min(3, this.exposures[id])); };
  Sanity.prototype.ground = function (amt, source) {
    // diminishing returns per source per day
    const used = this.groundToday[source] || 0; const mult = Math.max(0.15, 1 - used / 30);
    this.groundToday[source] = used + amt; this.change(amt * mult * 0.8, 'ground:' + source);
    this.pressure = Math.max(0, this.pressure - amt * 0.2);
    for (const k in this.exposures) this.exposures[k] = Math.max(0, this.exposures[k] - amt * 0.3);
  };
  Sanity.prototype.onStep = function () { };
  Sanity.prototype.newDay = function () { this.groundToday = {}; };

  Sanity.prototype.update = function (dt, game) {
    const room = PH.world.room(game.room), pl = game.player, W = PH.world;
    // ---- Hazard exposure ----
    let exposed = false; this.stareTarget = null;
    const hazCond = (c) => !c || (c === 'tvstatic' ? (game.flags.tv && this.value < 60) : c === 'lowsanity' ? this.value < 50 : c === 'reading' ? game.ui.reading : c === 'night' ? game.isNight() : true);
    if (!game.ui.blocking() || game.ui.reading) {
      for (const p of room.props) {
        if (!p.hazard || !hazCond(p.hazard.cond)) continue;
        const sz = PH.props.size(p.p); const px = W.propX(room, p) + sz[0] / 2; const dx = px - pl.x;
        const facing = Math.sign(dx) === pl.dir || Math.abs(dx) < 8;
        if (Math.abs(dx) < p.hazard.range && facing) {
          const id = p.id || p.p; this.exposures[id] = (this.exposures[id] || 0) + p.hazard.rate * dt * (p.altActive ? 1.6 : 1) * (this.value < 40 ? 1.5 : 1);
          exposed = true; this.stareTarget = { prop: p, e: this.exposures[id] };
          if (this.exposures[id] > 1.2) this.change(-dt * p.hazard.rate * 1.6 * Math.min(3, this.exposures[id] - 0.7), 'stare:' + id);
        }
      }
      if (room.hazard === 'ambient') { this.exposures.room = (this.exposures.room || 0) + dt * 0.5; exposed = true; if (this.exposures.room > 1) this.change(-dt * 0.9, 'room'); this.stareTarget = { prop: null, e: this.exposures.room }; }
    }
    // decay exposures not currently active
    for (const k in this.exposures) { if (!this.stareTarget || (this.stareTarget.prop ? (this.stareTarget.prop.id || this.stareTarget.prop.p) !== k : k !== 'room')) this.exposures[k] = Math.max(0, this.exposures[k] - dt * 0.5); }
    let maxE = 0; for (const k in this.exposures) maxE = Math.max(maxE, this.exposures[k]);
    this.pressure = PH.approach(this.pressure, Math.min(3, maxE), dt * 2);

    // ---- Passive drift ----
    const iso = game.story.isolationDays(); const care = game.story.careScore();
    let baseline = 55 + care * 12 - iso * 7 + (game.flock.avgTrust() - 55) * 0.2 + (game.flags.music && (game.room === 'living') ? 6 : 0) + (game.isNight() ? -8 : 0) + (game.story.contactsToday() > 0 ? 6 : -4);
    baseline = PH.clamp(baseline, 10, 90);
    const driftRate = (game.isNight() ? 0.05 : 0.03) * dt / 60 * 60; // ~ per real second small
    this.change((baseline - this.value) * driftRate * 0.06, 'drift');
    // Birds present & content are grounding
    if (game.room === 'aviary') { const calm = game.flock.alive().filter((b) => b.needs.fear < 30 && !b.sick).length; this.ground(dt * 0.15 * calm / 6, 'aviary'); }
    if (game.flags.music && game.room === 'living') this.ground(dt * 0.3, 'music');

    // ---- Perception values ----
    const tier = this.tier();
    const target = PH.clamp((70 - this.value) / 70, 0, 1) * 0.8 + Math.min(0.5, this.pressure * 0.2);
    this.distortion = PH.approach(this.distortion, PH.clamp(target, 0, 1), dt * 0.5);
    this.whisper = PH.approach(this.whisper, PH.clamp(this.pressure * 0.5 + (tier >= 3 ? 0.25 : 0), 0, 1), dt);
    this.dread = PH.approach(this.dread, PH.clamp(PH.clamp((60 - this.value) / 60, 0, 1) * (game.isNight() ? 1 : 0.7) + this.pressure * 0.15, 0, 1), dt * 0.4);
    this.slow = 1 - this.distortion * 0.15;
    // heartbeat at high pressure
    if (this.pressure > 1.5 || this.value < 20) { this.heartT -= dt; if (this.heartT <= 0) { this.heartT = 1.1 - Math.min(0.5, this.pressure * 0.15); PH.audio.heartbeat(Math.min(1, this.pressure * 0.4 + (this.value < 20 ? 0.5 : 0))); } }
    // room stretch
    const wantStretch = tier >= 2 && !room.outdoor && room.bg !== 'aviary' ? 1 + (tier - 1) * 0.35 + (room.bg === 'longhall' ? 1 : 0) : 1;
    room.stretch = PH.approach(room.stretch, wantStretch, dt * 0.05);
    // flicker
    this.flickerT -= dt; if (this.flickerT < 0) this.flickerT = PH.rand(0.5, tier >= 2 ? 3 : 12);
    this.flicker = this.flickerT < 0.1 && tier >= 1;

    // ---- Hallucination scheduler ----
    this.hallT -= dt * (1 + tier * 0.6);
    if (this.hallT <= 0 && !game.ui.blocking() && !game.ending) { this.hallT = PH.rand(30, 70); if (tier >= 1) this.triggerHallucination(game, tier); }
    for (let i = this.active.length - 1; i >= 0; i--) { const h = this.active[i]; h.t -= dt; if (h.t <= 0) { if (h.end) h.end(); this.active.splice(i, 1); } }
    if (this.figure) { this.figure.t -= dt; if (this.figure.t <= 0) this.figure = null; }

    // ---- Breaking point ----
    if (this.value <= 0 && !game.ending) { this.breaking += dt; if (this.breaking > 0.1 && !this.breakWarned) { this.breakWarned = true; game.notify('Everything is very loud and very far away.'); PH.audio.sting(1.2); } if (this.breaking > 45) { game.beginEnding('collapse'); } }
    else if (this.value > 12) { this.breaking = 0; this.breakWarned = false; }
    if (this.breaking > 0 && this.value <= 0 && (game.room === 'aviary' || game.ui.phoneOpen)) { this.change(dt * 1.5, 'holding on'); }
  };

  // Concrete hallucinations by tier.
  Sanity.prototype.triggerHallucination = function (game, tier) {
    const room = PH.world.room(game.room); const opts = [];
    const alts = room.props.filter((p) => p.alt && !p.altActive);
    if (alts.length) opts.push('alt');
    opts.push('phrase'); opts.push('sound');
    if (tier >= 2) { opts.push('clock', 'figure', 'lights', 'reflection'); if (game.room === 'aviary') opts.push('birdstare'); }
    if (tier >= 3) { opts.push('timeskip', 'blood', 'phone', 'altlong', 'voice'); }
    if (tier >= 4) opts.push('timeskip', 'figure', 'blood', 'stretch');
    const kind = PH.pick(opts); this.hallucinate(kind, alts);
  };
  Sanity.prototype.hallucinate = function (kind, alts) {
    const game = PH.game, room = PH.world.room(game.room);
    switch (kind) {
      case 'alt': case 'altlong': { const p = alts ? PH.pick(alts) : PH.pick(room.props.filter((x) => x.alt)); if (!p) return; p.altActive = true; this.active.push({ t: kind === 'alt' ? PH.rand(3, 7) : PH.rand(20, 60), end: () => { p.altActive = false; } }); if (p.p === 'plant_dead' && game.room === room.id) game.notify('The plant is blooming. It has been dead for a year.'); if (p.p === 'fountain') game.notify('The fountain has stopped.'); break; }
      case 'phrase': { const b = PH.pick(game.flock.alive()); if (!b) return; const line = PH.pick(game.story.strangePhrases()); if (game.room === 'aviary') { b.say('"' + line + '"', 3.5); b.vocalize('mumble'); game.story.flag('heard_' + line.length); } else { game.notify('From the aviary, faintly: "' + line + '"'); } if (this.tier() >= 2) this.change(-2, 'phrase'); break; }
      case 'sound': { PH.pick([() => PH.audio.thump(), () => PH.audio.glass(), () => PH.audio.door(), () => PH.audio.phoneBuzz()])(); if (PH.chance(0.5)) game.notify(PH.pick(['Something upstairs.', 'Glass, somewhere.', 'A door you did not open.', 'Your phone did not buzz. You check it anyway.'])); break; }
      case 'clock': { game.clockOffset = PH.rand(-3, 3); this.active.push({ t: PH.rand(10, 30), end: () => { game.clockOffset = 0; } }); break; }
      case 'figure': { const eff = PH.world.effWidth(room); const px = game.player.x; let fx = px + (PH.chance(0.5) ? 1 : -1) * PH.rand(120, 220); fx = PH.clamp(fx, 20, eff - 20); this.figure = { x: fx, y: room.floor, t: PH.rand(2, 5), room: game.room, seen: false }; break; }
      case 'lights': { game.lightsOut = PH.rand(1.5, 4); PH.audio.click(); break; }
      case 'reflection': { game.reflectionWrong = PH.rand(6, 14); break; }
      case 'birdstare': { for (const b of game.flock.alive()) { b.anim.headTurn = 1; b.attention = 1; b.decideT = 4; } game.notify('All of them are looking at you. All at once.'); this.change(-3, 'stare'); break; }
      case 'timeskip': { game.timeSkip(); break; }
      case 'blood': { game.decals.push({ room: game.room, x: game.player.x + PH.rand(-60, 60), y: room.floor - PH.rand(0, 3), kind: 'blood', t: PH.rand(15, 40) }); if (PH.chance(0.5)) game.decals.push({ room: game.room, x: game.player.x + PH.rand(-40, 40), y: 60 + PH.rand(0, 100), kind: 'handprint', t: PH.rand(15, 40) }); PH.audio.sting(0.5); this.change(-3, 'blood'); break; }
      case 'phone': { game.phone.ghostMessage(); break; }
      case 'voice': { game.notify(PH.pick(['"You could have called someone." Your own voice, from the kitchen.', '"Sign it, Adrian." Nobody is in the study.', 'Someone says your name. It is your voice.'])); this.change(-2, 'voice'); PH.audio.sting(0.3); break; }
      case 'stretch': { room.stretch = Math.min(2.4, room.stretch + 0.5); break; }
      case 'figure_wardrobe': { this.figure = { x: PH.world.propX(room, room.props.find((p) => p.id === 'wardrobe')) + 20, y: room.floor, t: 2.5, room: game.room, wardrobe: true }; PH.audio.sting(0.8); this.change(-6, 'wardrobe'); game.say(['There is someone standing in the wardrobe.', 'There is nobody standing in the wardrobe. There are suits.']); break; }
    }
  };
  Sanity.prototype.mirrorInteract = function (prop) {
    const game = PH.game, v = this.value;
    if (v > 60) game.say(['You look older than the man in the business pages. Tired. Unshaven.', 'But it is you, and the reflection does what you do.']);
    else if (v > 40) { game.say(['You look at yourself for a while.', 'The reflection blinks a half second after you do. You decide not to test that again.']); this.exposure(prop.id, 1.5); }
    else if (v > 20) { game.say(['The face in the mirror is yours, but it is not tired.', 'It looks at you the way you look at the birds. Fond. Patient. Waiting for you to finish.']); this.exposure(prop.id, 2.5); PH.audio.sting(0.4); }
    else { prop.altActive = true; game.say(['You do not see yourself in the mirror.', 'You see the aviary, from the inside, at night. Something with your shape is standing in it, very still, and the birds are all asleep.', 'You look away. It takes real effort.']); this.change(-6, 'mirror'); PH.audio.sting(0.9); this.active.push({ t: 30, end: () => { prop.altActive = false; } }); }
    game.story.flag('mirror');
  };
  PH.Sanity = Sanity;
})(window.PH);
