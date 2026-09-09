// Parrots: species, procedural animation & physics, utility AI, needs, memory, relationships, mimicry.
(function (PH) {
  'use strict';
  const G = PH.gfx;

  const SPECIES = {
    grey: { name: 'African Grey', s: 1.0, body: '#8c8c94', bodyD: '#6a6a72', head: '#b4b4bc', face: '#e8e8ec', wing: '#74747c', wingD: '#585860', tail: '#c8302a', beak: '#1a1a1e', eye: '#f0d060', crest: 0, voice: { base: 1500, range: 900, harsh: 0.4, len: 0.25 } },
    conure: { name: 'Sun Conure', s: 0.8, body: '#f0a020', bodyD: '#d07010', head: '#f8d040', face: '#f8c030', wing: '#5aa040', wingD: '#3a7a2a', tail: '#3a7aa0', beak: '#2a2a2e', eye: '#1a1a1a', crest: 0, voice: { base: 2800, range: 1200, harsh: 0.8, len: 0.18 } },
    eclectus: { name: 'Eclectus', s: 1.05, body: '#2a9a3a', bodyD: '#1a6a2a', head: '#3aaa4a', face: '#3aaa4a', wing: '#228a30', wingD: '#146020', tail: '#e0d040', beak: '#f08020', eye: '#e0a020', crest: 0, voice: { base: 1200, range: 600, harsh: 0.3, len: 0.35 } },
    macaw: { name: 'Blue & Gold Macaw', s: 1.5, body: '#f0c040', bodyD: '#c09020', head: '#2a6ad0', face: '#f0f0f0', wing: '#2a6ad0', wingD: '#1a4a9a', tail: '#3a7ae0', beak: '#1a1a1e', eye: '#f0e0a0', crest: 0, voice: { base: 900, range: 700, harsh: 0.9, len: 0.4 } },
    cockatiel: { name: 'Cockatiel', s: 0.75, body: '#9a9a9c', bodyD: '#727274', head: '#f0e070', face: '#f8f0a0', cheek: '#f08030', wing: '#8a8a8c', wingD: '#606062', tail: '#a0a0a2', beak: '#8a7a70', eye: '#1a1a1a', crest: 1, crestColor: '#f0e070', voice: { base: 2300, range: 900, harsh: 0.2, len: 0.3 } },
    galah: { name: 'Galah', s: 1.0, body: '#ec86a6', bodyD: '#c85a80', head: '#f0a0b8', face: '#f8d8e0', wing: '#a0a0a8', wingD: '#78787e', tail: '#8a8a90', beak: '#d8c8b8', eye: '#3a2a20', crest: 1, crestColor: '#fbe4ea', voice: { base: 1900, range: 800, harsh: 0.6, len: 0.3 } },
  };

  // The six birds. Personality traits 0..1.
  const ROSTER = [
    { id: 'pepper', name: 'Pepper', species: 'grey', personality: { bold: 0.45, social: 0.6, greedy: 0.4, vocal: 0.95, calm: 0.35, playful: 0.5 }, favFood: 'nuts', favToy: 'bell', trust: 62, bio: 'Talks more than anyone else in this house. Learned to say "goodnight" from someone who is no longer here.' },
    { id: 'saffron', name: 'Saffron', species: 'conure', personality: { bold: 0.9, social: 0.7, greedy: 0.9, vocal: 0.8, calm: 0.2, playful: 0.9 }, favFood: 'fruit', favToy: 'bell', trust: 55, bio: 'Loud, fearless, a thief. Will take anything shiny and feel no remorse.' },
    { id: 'ivo', name: 'Ivo', species: 'eclectus', personality: { bold: 0.4, social: 0.5, greedy: 0.7, vocal: 0.3, calm: 0.9, playful: 0.3 }, favFood: 'fruit', favToy: 'swing', trust: 70, bio: 'Slow, gentle, always eating. The only one who has never bitten anybody.' },
    { id: 'marlowe', name: 'Marlowe', species: 'macaw', personality: { bold: 0.8, social: 0.4, greedy: 0.5, vocal: 0.7, calm: 0.5, playful: 0.4 }, favFood: 'nuts', favToy: 'rope', trust: 40, bio: 'Proud, jealous, enormous. Trust has to be earned every single day.' },
    { id: 'wren', name: 'Wren', species: 'cockatiel', personality: { bold: 0.15, social: 0.8, greedy: 0.3, vocal: 0.6, calm: 0.3, playful: 0.5 }, favFood: 'seeds', favToy: 'swing', trust: 50, bio: 'Frightens easily. Sings when she feels safe, which is not often.' },
    { id: 'juno', name: 'Juno', species: 'galah', personality: { bold: 0.7, social: 0.9, greedy: 0.5, vocal: 0.5, calm: 0.6, playful: 0.95 }, favFood: 'seeds', favToy: 'rope', trust: 58, bio: 'Hangs upside down for no reason. Wants to be wherever you are.' },
  ];
  // relationship seeds: positive = friends, negative = rivals
  const BONDS = { 'pepper|wren': 0.7, 'marlowe|saffron': -0.7, 'juno|marlowe': -0.3, 'ivo|pepper': 0.3, 'saffron|juno': 0.5, 'ivo|wren': 0.4, 'juno|wren': 0.3 };
  function bondKey(a, b) { return a < b ? a + '|' + b : b + '|' + a; }

  const FOODS = { seeds: { nutrition: 18 }, pellets: { nutrition: 24 }, fruit: { nutrition: 14, water: 6 }, nuts: { nutrition: 22 }, treat: { nutrition: 8 } };

  // ---------------------------------------------------------------------------
  function Parrot(def, flock) {
    Object.assign(this, def);
    this.sp = SPECIES[def.species];
    this.flock = flock;
    this.x = 0; this.y = 0; this.vx = 0; this.vy = 0; this.dir = 1;
    this.state = 'perch'; this.stateT = 0; this.perch = null; this.target = null;
    this.needs = { hunger: 30 + PH.rand(20), thirst: 25 + PH.rand(20), boredom: 30 + PH.rand(30), fear: 5 + PH.rand(10), energy: 80, health: 90 + PH.rand(10), social: 40 };
    this.memories = []; this.phrases = []; this.learned = {};
    this.mood = 'content';
    this.decideT = PH.rand(0.5, 2);
    // animation params
    this.anim = {
      headBob: new PH.Spring(0, 160, 10), squash: new PH.Spring(1, 200, 14), puff: new PH.Spring(1, 40, 6),
      headTilt: 0, headTiltT: 0, headTurn: 0, wingAngle: 0, flap: 0, crest: 0.3, crestT: 0, tailSpread: 0.2, blink: 0, blinkT: PH.rand(2, 5),
      preen: 0, beakOpen: 0, legOff: 0, walk: 0, shiver: 0, bobT: 0, hang: 0,
    };
    this.bubble = null; this.bubbleT = 0;
    this.vocalCD = PH.rand(2, 8);
    this.sleeping = false;
    this.lastFedDay = 1; this.storyPhrases = [];
    this.scaredBy = null;
    this.stolen = null; this.stealCD = 0;
    this.attention = 0;
  }
  Parrot.SPECIES = SPECIES; Parrot.ROSTER = ROSTER; Parrot.FOODS = FOODS;

  Parrot.prototype.remember = function (type, weight, note) {
    this.memories.push({ type, weight, day: PH.game ? PH.game.day : 1, t: PH.time, note });
    if (this.memories.length > 60) this.memories.shift();
  };
  Parrot.prototype.recall = function (type, days) {
    let sum = 0; const day = PH.game ? PH.game.day : 1;
    for (const m of this.memories) if (m.type === type && day - m.day <= (days || 3)) sum += m.weight;
    return sum;
  };
  Parrot.prototype.adjustTrust = function (d) { this.trust = PH.clamp(this.trust + d, 0, 100); };
  Parrot.prototype.learn = function (phrase, important) {
    if (this.learned[phrase]) { this.learned[phrase] = Math.min(1, this.learned[phrase] + 0.25); return; }
    this.learned[phrase] = important ? 1 : 0.35; this.phrases.push(phrase);
    if (this.phrases.length > 12) { const old = this.phrases.shift(); delete this.learned[old]; }
  };
  Parrot.prototype.bond = function (other) { return this.flock.bond(this.id, other.id); };

  Parrot.prototype.say = function (text, t) { this.bubble = text; this.bubbleT = t || 2.5; };
  Parrot.prototype.vocalize = function (kind) {
    const pan = PH.game ? PH.clamp((this.x - PH.game.player.x) / 200, -1, 1) : 0;
    PH.audio.parrot(kind, this.sp.voice, pan);
    this.anim.beakOpen = kind === 'mumble' ? 0.8 : 1;
    if (kind === 'scream' || kind === 'squawk') this.flock.noise(this, kind === 'scream' ? 1 : 0.5);
  };

  // ---------------- Update ----------------
  Parrot.prototype.update = function (dt, env) {
    const a = this.anim, n = this.needs, p = this.personality;
    this.stateT += dt;
    // Needs drift (per real second; day ~ 16 min)
    const rate = dt / 60;
    n.hunger = PH.clamp(n.hunger + rate * (3 + p.greedy * 1.5), 0, 100);
    n.thirst = PH.clamp(n.thirst + rate * 3.5, 0, 100);
    n.boredom = PH.clamp(n.boredom + rate * (2.5 + p.playful * 2), 0, 100);
    n.fear = PH.clamp(n.fear - rate * (8 + p.calm * 12), 0, 100);
    n.social = PH.clamp(n.social + rate * p.social * 5, 0, 100);
    if (env.night) n.energy = PH.clamp(n.energy + (this.sleeping ? rate * 30 : -rate * 5), 0, 100); else n.energy = PH.clamp(n.energy - rate * 3, 0, 100);
    // Health
    const stress = (n.hunger > 80 ? 1 : 0) + (n.thirst > 80 ? 1.5 : 0) + (env.dirt > 70 ? 0.6 : 0) + (n.fear > 70 ? 0.3 : 0);
    if (stress > 0) n.health = PH.clamp(n.health - rate * stress * 2.5, 0, 100);
    else if (n.hunger < 50 && n.thirst < 50) n.health = PH.clamp(n.health + rate * 1.2, 0, 100);
    if (n.health < 20) this.sick = true; else if (n.health > 45) this.sick = false;
    if (n.health <= 0 && !this.dead) { this.dead = true; this.state = 'dead'; this.flock.onDeath(this); }
    if (this.dead) { this.updateAnim(dt, env); return; }

    // Mood label
    this.mood = this.sick ? 'unwell' : n.fear > 55 ? 'frightened' : n.hunger > 75 ? 'starving' : n.thirst > 75 ? 'parched' : n.hunger > 55 ? 'hungry' : n.boredom > 75 ? 'restless' : this.sleeping ? 'asleep' : n.energy < 25 ? 'tired' : this.trust > 75 && n.boredom < 40 ? 'affectionate' : 'content';

    // Player proximity
    const pl = PH.game.player; const nearPlayer = PH.game.room === 'aviary' && Math.abs(pl.x - this.x) < 60 && Math.abs(pl.y - this.y) < 70;
    this.nearPlayer = nearPlayer;
    if (nearPlayer) this.attention = Math.min(1, this.attention + dt * 0.5); else this.attention = Math.max(0, this.attention - dt * 0.3);
    if (nearPlayer && pl.running && this.trust < 45 && p.bold < 0.5 && this.state !== 'flee' && PH.chance(dt * 0.6)) this.startle(0.5, 'player');

    // Vocalizations
    this.vocalCD -= dt;
    if (this.vocalCD <= 0 && !this.sleeping) {
      this.vocalCD = PH.rand(3, 14) / (0.3 + p.vocal);
      this.randomVocal(env);
    }
    if (a.beakOpen > 0) a.beakOpen = Math.max(0, a.beakOpen - dt * 3);
    if (this.bubbleT > 0) { this.bubbleT -= dt; if (this.bubbleT <= 0) this.bubble = null; }
    if (this.stealCD > 0) this.stealCD -= dt;

    // State machine
    this.decideT -= dt;
    switch (this.state) {
      case 'perch': case 'sleep': case 'sick': this.updateIdle(dt, env); break;
      case 'fly': this.updateFly(dt, env); break;
      case 'hop': this.updateHop(dt, env); break;
      case 'climb': this.updateClimb(dt, env); break;
      case 'walk': this.updateWalk(dt, env); break;
      case 'eat': case 'drink': this.updateEat(dt, env); break;
      case 'play': this.updatePlay(dt, env); break;
      case 'argue': this.updateArgue(dt, env); break;
      case 'flee': this.updateFly(dt, env); break;
      case 'onPlayer': this.updateOnPlayer(dt, env); break;
      case 'hang': this.updateIdle(dt, env); break;
    }
    this.updateAnim(dt, env);
  };

  Parrot.prototype.randomVocal = function (env) {
    const p = this.personality, n = this.needs;
    const r = PH.rand();
    // Mimicry of learned phrases
    if (this.phrases.length && r < 0.25 + p.vocal * 0.25) {
      // weighted by learned strength; story phrases more likely at low sanity
      const san = PH.game.sanity.value;
      let pool = this.phrases.slice();
      if (san < 50 && this.storyPhrases.length && PH.chance(0.5)) pool = this.storyPhrases;
      const ph = PH.pick(pool);
      this.say('"' + ph + '"', 3); this.vocalize('mumble'); this.flock.onMimic(this, ph);
      return;
    }
    if (n.fear > 50) { this.vocalize('scream'); return; }
    if (n.hunger > 70) { this.vocalize('squawk'); this.say('...', 1); return; }
    if (this.species === 'cockatiel' || this.species === 'grey') { if (PH.chance(0.5)) { this.vocalize('whistle'); this.say('♪', 1.5); return; } }
    if (this.trust > 70 && this.nearPlayer && PH.chance(0.4)) { this.vocalize('purr'); return; }
    this.vocalize(PH.chance(0.7) ? 'chirp' : 'squawk');
  };

  // ---- Decision making (utility scoring) ----
  Parrot.prototype.decide = function (env) {
    const n = this.needs, p = this.personality, F = this.flock;
    const cands = [];
    const add = (name, score, data) => { if (score > 0) cands.push({ name, score: score * PH.rand(0.75, 1.25), data }); };
    if (env.night && n.energy < 90) add('sleep', 2 + (100 - n.energy) / 20);
    if (this.sick) add('sick', 3);
    const foodBowl = F.bestBowl('food', this); const waterBowl = F.bestBowl('water', this);
    if (foodBowl) add('eat', (n.hunger - 25) / 15 * (0.6 + p.greedy) + (foodBowl.food === this.favFood ? 1 : 0), foodBowl);
    if (waterBowl) add('drink', (n.thirst - 30) / 14, waterBowl);
    const toy = F.nearestToy(this);
    if (toy) add('play', (n.boredom - 35) / 20 * (0.5 + p.playful) + (toy.type === this.favToy ? 0.6 : 0), toy);
    add('hop', 0.8 + n.boredom / 80);
    add('fly', 0.4 + n.boredom / 60 + p.bold * 0.5);
    add('climb', 0.3 + p.playful * 0.6);
    add('walk', 0.4);
    add('preen', 0.8 + (n.fear < 20 ? 0.4 : 0));
    if (this.species === 'galah' || this.species === 'conure') add('hang', 0.3 + p.playful * 0.7);
    // social
    const friend = F.friendOf(this); if (friend && n.social > 40) add('approach', (n.social - 30) / 25 * p.social, friend);
    const rival = F.rivalNear(this); if (rival && n.fear < 40) add('argue', 0.6 + p.bold * 1.2 - p.calm * 0.8 + (n.hunger > 60 ? 0.6 : 0), rival);
    // player interactions
    if (this.nearPlayer) {
      const pl = PH.game.player;
      const item = pl.currentItem();
      const curiosity = (this.trust / 100) * (0.4 + p.bold * 0.8) * (1 + this.attention);
      add('approachPlayer', curiosity * 1.6 + (item && FOODS[item] ? 1.2 : 0));
      if (this.trust > 72 && p.social > 0.5 && pl.stillT > 1.5 && !F.someoneOnPlayer()) add('landOnPlayer', 1.2 + p.social);
      if (p.greedy > 0.7 && p.bold > 0.6 && item && !FOODS[item] && item !== 'phone' && this.stealCD <= 0 && Math.abs(pl.x - this.x) < 30) add('steal', 1.5 + p.greedy);
      if (this.trust < 35 && p.bold < 0.5) add('flee', (40 - this.trust) / 20 * (1 - p.bold));
    }
    if (!cands.length) return this.enterState('perch');
    cands.sort((a, b) => b.score - a.score);
    const c = cands[0];
    this.act(c.name, c.data, env);
  };

  Parrot.prototype.act = function (name, data, env) {
    const F = this.flock;
    switch (name) {
      case 'sleep': this.sleeping = true; this.enterState('sleep'); this.decideT = PH.rand(20, 60); if (!this.perch || this.perch.type !== 'perch') this.flyTo(F.randomPerch(this, true)); break;
      case 'sick': this.enterState('sick'); this.decideT = PH.rand(6, 12); if (this.perch && this.perch.type !== 'floor' && PH.chance(0.4)) this.flyTo(F.floorSpot(this.x)); break;
      case 'eat': case 'drink': this.eatTarget = data; this.pendingState = name; this.flyTo({ x: data.x + (PH.chance(0.5) ? -8 : 8) * this.sp.s, y: data.y, type: 'bowl', obj: data }); break;
      case 'play': this.playTarget = data; this.pendingState = 'play'; this.flyTo({ x: data.x, y: data.y + (data.type === 'swing' ? 26 : data.type === 'rope' ? 20 : 0), type: 'toy', obj: data }); break;
      case 'hop': { const t = F.hopTarget(this); if (t) this.hopTo(t); else this.enterState('perch'); break; }
      case 'fly': this.flyTo(F.randomPerch(this)); break;
      case 'climb': { const c = F.randomClimb(this); if (c) { this.climbTarget = c; this.pendingState = 'climb'; this.flyTo({ x: c.x, y: c.y2 - 6, type: 'climb', obj: c }); } else this.enterState('perch'); break; }
      case 'walk': { const t = F.walkTarget(this); if (t) { this.walkTarget = t; this.enterState('walk'); } else this.enterState('perch'); break; }
      case 'preen': this.enterState('perch'); this.anim.preen = PH.rand(2, 5); this.decideT = this.anim.preen + 1; break;
      case 'hang': { const c = F.randomClimb(this); if (c) { this.pendingState = 'hang'; this.flyTo({ x: c.x, y: c.y1 + 10, type: 'climb', obj: c }); } else this.enterState('perch'); break; }
      case 'approach': { const t = F.spotNear(data, this); if (t) { this.approachTarget = data; this.flyTo(t); } break; }
      case 'argue': this.argueWith(data); break;
      case 'approachPlayer': { const pl = PH.game.player; const t = F.spotNearPoint(pl.x, pl.y - 20, this); if (t) this.flyTo(t); this.needs.social = Math.max(0, this.needs.social - 10); break; }
      case 'landOnPlayer': this.pendingState = 'onPlayer'; { const pl = PH.game.player; this.flyTo({ x: pl.x + pl.dir * -4, y: pl.y - 30, type: 'player' }); } break;
      case 'steal': this.pendingState = 'steal'; { const pl = PH.game.player; this.flyTo({ x: pl.x + pl.dir * 8, y: pl.y - 12, type: 'player' }); } break;
      case 'flee': this.startle(0.4, 'player'); break;
      default: this.enterState('perch');
    }
  };

  Parrot.prototype.enterState = function (s) { this.state = s; this.stateT = 0; if (s !== 'sleep') this.sleeping = false; };

  Parrot.prototype.startle = function (amount, source) {
    const n = this.needs;
    n.fear = PH.clamp(n.fear + amount * 60 * (1.4 - this.personality.calm), 0, 100);
    this.anim.crest = 1; this.anim.crestT = 2; this.anim.puff.t = 0.85;
    if (source === 'player') { this.adjustTrust(-3 * amount); this.remember('scared_by_player', -1); }
    if (this.state === 'onPlayer') this.leavePlayer();
    if (n.fear > 30 && this.state !== 'flee') {
      this.vocalize(PH.chance(0.6) ? 'scream' : 'squawk');
      const far = this.flock.farPerch(source === 'player' ? PH.game.player.x : this.x, this);
      this.flyTo(far, true); this.state = 'flee';
    }
    this.sleeping = false;
  };

  Parrot.prototype.flyTo = function (target, isFlee) {
    if (!target) { this.enterState('perch'); return; }
    this.target = target; this.perch = null;
    this.enterState(isFlee ? 'flee' : 'fly');
    this.dir = target.x > this.x ? 1 : -1;
    this.vx = this.dir * 30; this.vy = -55;
    this.anim.squash.v = 1.25; this.anim.squash.vel = -2;
    this.flightT = 0;
    if (PH.chance(0.4)) this.flock.feather(this);
  };
  Parrot.prototype.hopTo = function (target) {
    this.target = target; this.perch = null; this.enterState('hop');
    const dx = target.x - this.x, dy = target.y - this.y; const T = 0.38;
    this.vx = dx / T; this.vy = dy / T - 0.5 * 420 * T; this.dir = dx > 0.5 ? 1 : dx < -0.5 ? -1 : this.dir;
    this.anim.squash.v = 0.8; this.anim.squash.vel = 3;
  };
  Parrot.prototype.land = function () {
    const t = this.target; if (!t) return;
    this.x = t.x; this.y = t.y; this.vx = 0; this.vy = 0; this.perch = t;
    this.anim.squash.v = 0.72; this.anim.squash.vel = 2.5; this.anim.wingAngle = 0.6;
    const st = this.pendingState; this.pendingState = null;
    if (st === 'eat' || st === 'drink') { this.enterState(st); this.decideT = PH.rand(3, 7); this.dir = this.eatTarget.x > this.x ? 1 : -1; }
    else if (st === 'play') { this.enterState('play'); this.decideT = PH.rand(4, 10); }
    else if (st === 'climb') { this.enterState('climb'); this.climbDir = -1; this.decideT = PH.rand(3, 8); }
    else if (st === 'hang') { this.enterState('hang'); this.anim.hang = 1; this.decideT = PH.rand(3, 8); }
    else if (st === 'onPlayer') { this.enterState('onPlayer'); this.decideT = PH.rand(6, 20); this.remember('perched_on_player', 1); this.adjustTrust(2); PH.game.notify(this.name + ' lands on your shoulder.'); }
    else if (st === 'steal') { this.doSteal(); }
    else { this.enterState(this.sleeping ? 'sleep' : 'perch'); this.decideT = PH.rand(1.5, 6); }
    if (this.needs.fear > 40) this.decideT = PH.rand(2, 5);
    if (t.type !== 'player') this.flock.onLand(this);
  };
  Parrot.prototype.doSteal = function () {
    const pl = PH.game.player; const item = pl.currentItem();
    if (item && !FOODS[item] && item !== 'phone' && pl.hasItem(item)) {
      pl.removeItem(item, 1); this.stolen = item; this.stealCD = 90; this.remember('stole', 0.5, item);
      PH.game.notify(this.name + ' snatches your ' + PH.items.label(item) + '!'); this.vocalize('squawk'); this.say('!!', 1.5);
      this.learn('mine', false);
      this.flyTo(this.flock.farPerch(pl.x, this)); this.dropT = PH.rand(10, 30);
    } else { this.enterState('perch'); }
  };
  Parrot.prototype.leavePlayer = function () { if (this.state === 'onPlayer') { this.flyTo(this.flock.randomPerch(this)); } };

  Parrot.prototype.updateIdle = function (dt, env) {
    const a = this.anim;
    if (this.sleeping && (!env.night || this.needs.fear > 30 || this.needs.hunger > 85)) { this.sleeping = false; this.enterState('perch'); }
    if (this.state === 'hang') { a.hang = PH.approach(a.hang, 1, dt * 3); if (this.stateT > 6) { this.anim.hang = 0; this.flyTo(this.flock.randomPerch(this)); return; } }
    else a.hang = PH.approach(a.hang, 0, dt * 3);
    // micro behaviors
    if (a.headTiltT > 0) a.headTiltT -= dt; else if (PH.chance(dt * 0.5)) { a.headTilt = PH.rand(-0.6, 0.6); a.headTiltT = PH.rand(0.6, 2.2); } else a.headTilt = PH.approach(a.headTilt, 0, dt * 2);
    if (PH.chance(dt * 0.3)) a.headTurn = PH.chance(0.5) ? 0 : PH.rand(-1, 1);
    if (this.nearPlayer && this.attention > 0.3) { a.headTurn = (PH.game.player.x > this.x) === (this.dir > 0) ? 0 : 1; if (PH.chance(dt * 0.4)) { a.headTilt = PH.rand(0.3, 0.6) * (PH.chance(0.5) ? 1 : -1); a.headTiltT = 1; } }
    if (a.preen > 0) a.preen -= dt;
    if (PH.chance(dt * 0.12)) { this.dir *= -1; a.legOff = 1; }
    if (PH.chance(dt * 0.25)) a.headBob.kick(PH.rand(20, 60));
    a.puff.t = this.sleeping ? 1.3 : this.sick ? 1.35 : this.needs.fear > 50 ? 0.85 : (env.night ? 1.15 : 1) + (this.trust > 70 && this.nearPlayer ? 0.12 : 0);
    if (this.decideT <= 0 && !this.sleeping) this.decide(env);
    if (this.sleeping && this.decideT <= 0) this.decideT = 10;
    if (this.stolen && this.dropT !== undefined) { this.dropT -= dt; if (this.dropT <= 0) { this.flock.dropItem(this, this.stolen); this.stolen = null; this.dropT = undefined; } }
  };
  Parrot.prototype.updateFly = function (dt, env) {
    const t = this.target, a = this.anim; if (!t) return this.enterState('perch');
    this.flightT += dt;
    if (t.type === 'player') { const pl = PH.game.player; t.x = pl.x + (this.pendingState === 'steal' ? pl.dir * 8 : -pl.dir * 3); t.y = pl.y - (this.pendingState === 'steal' ? 12 : 30); if (PH.game.room !== 'aviary') { this.pendingState = null; this.target = this.flock.randomPerch(this); return; } }
    const dx = t.x - this.x, dy = t.y - this.y; const d = Math.sqrt(dx * dx + dy * dy);
    const speed = this.state === 'flee' ? 130 : 85 + this.sp.s * 10;
    const desiredX = dx / (d || 1) * speed, desiredY = dy / (d || 1) * speed;
    // arrive: slow down near target; add a slight arc (lift first, then descend)
    const arrive = PH.clamp(d / 40, 0.25, 1);
    let lift = this.flightT < 0.35 ? -40 : 0;
    this.vx += (desiredX * arrive - this.vx) * 4 * dt;
    this.vy += (desiredY * arrive + lift - this.vy) * 4 * dt;
    // gliding: when descending toward target, reduce flap and let gravity
    this.gliding = this.vy > 10 && dy > 15 && d > 30;
    if (this.gliding) { this.vy += 60 * dt; this.vy = Math.min(this.vy, 70); }
    this.x += this.vx * dt; this.y += this.vy * dt;
    this.dir = this.vx > 5 ? 1 : this.vx < -5 ? -1 : this.dir;
    // bounds
    const B = this.flock.bounds; this.x = PH.clamp(this.x, B.x1 + 8, B.x2 - 8); this.y = PH.clamp(this.y, B.y1 + 10, B.y2);
    a.flap += dt * (this.gliding ? 4 : 16 + speed * 0.05);
    a.wingAngle = this.gliding ? 0.9 + Math.sin(a.flap) * 0.1 : 0.2 + Math.sin(a.flap) * 1.1;
    a.tailSpread = 0.7; a.puff.t = 0.9;
    if (PH.chance(dt * 0.6)) this.flock.feather(this);
    if (d < 6 || this.flightT > 5) { if (this.flightT > 5 && d >= 6) { this.target = this.flock.nearestPerchTo(this.x, this.y); if (!this.target) this.target = this.flock.floorSpot(this.x); } this.land(); }
    // fleeing birds scare others a bit
    if (this.state === 'flee' && PH.chance(dt * 0.5)) this.flock.ripple(this, 0.15);
  };
  Parrot.prototype.updateHop = function (dt) {
    this.vy += 420 * dt; this.x += this.vx * dt; this.y += this.vy * dt;
    this.anim.wingAngle = PH.approach(this.anim.wingAngle, 0.5, dt * 4);
    const t = this.target;
    if (this.vy > 0 && this.y >= t.y - 0.5) { this.land(); }
    if (this.stateT > 1) { this.target = this.flock.nearestPerchTo(this.x, this.y) || this.flock.floorSpot(this.x); this.land(); }
  };
  Parrot.prototype.updateClimb = function (dt) {
    const c = this.climbTarget; if (!c) return this.enterState('perch');
    this.x = c.x; this.y += this.climbDir * 14 * dt; this.anim.walk += dt * 6;
    if (this.y < c.y1 + 8) this.climbDir = 1; if (this.y > c.y2 - 4) this.climbDir = -1;
    if (PH.chance(dt * 0.3)) this.climbDir *= -1;
    if (this.decideT <= 0) { this.flyTo(this.flock.randomPerch(this)); }
  };
  Parrot.prototype.updateWalk = function (dt) {
    const t = this.walkTarget; if (!t) return this.enterState('perch');
    const dx = t.x - this.x; this.dir = dx > 0 ? 1 : -1;
    this.x += this.dir * 18 * dt; this.anim.walk += dt * 9; this.anim.headBob.t = Math.sin(this.anim.walk) * 1.2;
    if (Math.abs(dx) < 2 || this.stateT > 4) { this.anim.headBob.t = 0; this.perch = t; this.enterState('perch'); this.decideT = PH.rand(1, 4); }
  };
  Parrot.prototype.updateEat = function (dt) {
    const b = this.eatTarget, a = this.anim; if (!b) return this.enterState('perch');
    a.bobT += dt * 5;
    const down = Math.sin(a.bobT) > 0.3; a.headBob.t = down ? 4 : 0;
    if (down && PH.chance(dt * 4)) {
      if (this.state === 'eat') {
        if (b.amount > 0) { b.amount -= 0.25; const f = FOODS[b.food] || FOODS.seeds; this.needs.hunger = PH.clamp(this.needs.hunger - f.nutrition * 0.35, 0, 100); if (f.water) this.needs.thirst = PH.clamp(this.needs.thirst - 1, 0, 100); if (b.food === this.favFood && PH.chance(0.15)) { this.adjustTrust(0.5); } if (PH.chance(0.3)) PH.audio.seeds(); if (b.amount <= 0) { b.amount = 0; b.food = null; } }
        else { this.say('...', 1); this.vocalize('squawk'); this.remember('empty_bowl', -0.5); this.enterState('perch'); this.decideT = PH.rand(2, 5); }
      } else {
        if (b.amount > 0) { b.amount -= 0.2; this.needs.thirst = PH.clamp(this.needs.thirst - 6, 0, 100); }
        else { this.say('...', 1); this.enterState('perch'); this.decideT = PH.rand(2, 5); }
      }
    }
    const done = this.state === 'eat' ? this.needs.hunger < 15 : this.needs.thirst < 10;
    if (done || this.decideT <= 0) { a.headBob.t = 0; this.enterState('perch'); this.decideT = PH.rand(1, 4); if (done && this.state === 'eat') this.remember('fed', 1); }
    if (this.rivalCheck === undefined || PH.chance(dt * 0.4)) { const r = this.flock.rivalNear(this, 24); if (r && r.state === 'eat' && this.personality.bold > 0.5 && PH.chance(0.3)) this.argueWith(r); }
  };
  Parrot.prototype.updatePlay = function (dt) {
    const t = this.playTarget, a = this.anim; if (!t) return this.enterState('perch');
    a.bobT += dt * 4;
    if (t.type === 'bell') { a.headBob.t = Math.sin(a.bobT) > 0.6 ? -3 : 0; if (Math.sin(a.bobT) > 0.95 && PH.chance(0.5)) { PH.audio.click(); t.ring = 0.3; } }
    else if (t.type === 'swing') { t.swing = (t.swing || 0) + dt; this.x = t.x + Math.sin(t.swing * 2.5) * 6; a.headTilt = Math.sin(t.swing * 2.5) * 0.3; }
    else if (t.type === 'rope') { a.hang = PH.approach(a.hang, Math.sin(a.bobT * 0.5) > 0 ? 1 : 0, dt * 2); }
    this.needs.boredom = PH.clamp(this.needs.boredom - dt * 6, 0, 100);
    if (this.needs.boredom < 15 || this.decideT <= 0) { a.headBob.t = 0; a.hang = 0; this.remember('played', 0.5); this.flyTo(this.flock.randomPerch(this)); }
  };
  Parrot.prototype.argueWith = function (other) {
    if (other.state === 'argue' || other.state === 'fly' || other.state === 'flee' || other.sleeping) { this.enterState('perch'); return; }
    this.enterState('argue'); other.enterState('argue'); this.arguing = other; other.arguing = this;
    this.dir = other.x > this.x ? 1 : -1; other.dir = -this.dir;
    this.decideT = other.decideT = PH.rand(2, 4);
    this.flock.setBond(this.id, other.id, -0.08);
    this.vocalize('squawk');
  };
  Parrot.prototype.updateArgue = function (dt) {
    const o = this.arguing, a = this.anim; if (!o || o.state !== 'argue') { this.enterState('perch'); return; }
    a.puff.t = 1.3; a.crest = 1; a.wingAngle = 0.5 + Math.sin(this.stateT * 12) * 0.3; a.tailSpread = 1;
    a.headBob.t = Math.sin(this.stateT * 10) > 0.6 ? -2 : 0;
    if (PH.chance(dt * 1.5)) { this.vocalize('squawk'); this.say(PH.pick(['!', '!!', 'RAAK', 'MINE']), 0.8); }
    if (this.stateT > 1.5 && PH.chance(dt * 1.2)) {
      // resolve: bolder/bigger wins
      const meScore = this.personality.bold + this.sp.s * 0.3 + PH.rand(0.4), themScore = o.personality.bold + o.sp.s * 0.3 + PH.rand(0.4);
      const loser = meScore > themScore ? o : this, winner = loser === this ? o : this;
      loser.arguing = null; winner.arguing = null;
      loser.needs.fear = PH.clamp(loser.needs.fear + 15, 0, 100); loser.remember('lost_argument', -0.5, winner.id);
      loser.flyTo(this.flock.farPerch(winner.x, loser), true); loser.state = 'fly';
      winner.enterState('perch'); winner.decideT = PH.rand(2, 5); winner.anim.puff.t = 1.4; winner.remember('won_argument', 0.3, loser.id);
      this.flock.ripple(winner, 0.1);
    }
  };
  Parrot.prototype.updateOnPlayer = function (dt, env) {
    const pl = PH.game.player;
    this.x = pl.x - pl.dir * 3; this.y = pl.y - 29; this.dir = pl.dir;
    this.anim.puff.t = 1.1; this.needs.social = Math.max(0, this.needs.social - dt * 4);
    if (PH.chance(dt * 0.4)) { this.anim.headTilt = PH.rand(-0.5, 0.5); this.anim.headTiltT = 1.5; }
    if (PH.chance(dt * 0.15)) { this.vocalize('purr'); this.say('♥', 1.2); }
    if (PH.game.room !== 'aviary' || pl.running || this.decideT <= 0 || this.needs.hunger > 70) this.leavePlayer();
    // grounding for the player
    PH.game.sanity.ground(dt * 1.2, 'bird');
  };

  // ---- Animation integration ----
  Parrot.prototype.updateAnim = function (dt, env) {
    const a = this.anim;
    a.headBob.update(dt); a.squash.update(dt); a.puff.update(dt);
    if (this.state !== 'fly' && this.state !== 'flee' && this.state !== 'argue') {
      a.wingAngle = PH.approach(a.wingAngle, this.state === 'hop' ? 0.5 : 0, dt * 5);
      a.tailSpread = PH.approach(a.tailSpread, 0.2, dt * 2);
    }
    if (a.crestT > 0) a.crestT -= dt; else a.crest = PH.approach(a.crest, this.needs.fear > 40 ? 0.9 : this.nearPlayer && this.attention > 0.5 ? 0.7 : this.sleeping ? 0.05 : 0.3, dt * 2);
    a.blinkT -= dt; if (a.blinkT <= 0) { a.blink = 0.12; a.blinkT = PH.rand(2, 6); } if (a.blink > 0) a.blink -= dt;
    a.legOff = PH.approach(a.legOff, 0, dt * 6);
    a.shiver = this.needs.fear > 55 ? Math.sin(PH.time * 40) * 0.6 : this.sick ? Math.sin(PH.time * 25) * 0.3 : 0;
  };

  // ---------------- Rendering ----------------
  const bc = G.canvas(64, 64); const bctx = bc.getContext('2d'); const bp = G.painter(bctx);
  Parrot.prototype.draw = function (ctx, camx, camy, tint) {
    const sp = this.sp, s = sp.s, a = this.anim;
    const puff = a.puff.v, sq = a.squash.v;
    // draw into bc at center (32, 40) facing right
    bctx.clearRect(0, 0, 64, 64);
    const cx = 32, feetY = 46;
    const hang = a.hang;
    const flying = this.state === 'fly' || this.state === 'flee' || this.state === 'hop';
    const bodyRx = 5.2 * s * puff * (2 - sq) * 0.95, bodyRy = 4.3 * s * puff * sq;
    const lean = flying ? -0.35 : this.state === 'eat' || this.state === 'drink' ? 0.25 : 0;
    const bodyCy = feetY - bodyRy - (flying ? 2 : 3.5 * s) + (hang ? 6 : 0);
    const bodyCx = cx + lean * 3;
    const dead = this.dead;
    if (dead) { // lying on side
      bp.ellipse(cx, feetY - 3 * s, 5.5 * s, 3 * s, sp.bodyD); bp.ellipse(cx + 5 * s, feetY - 3 * s, 2.5 * s, 2.5 * s, sp.head); bp.tri(cx - 5 * s, feetY - 3 * s, cx - 11 * s, feetY - 1 * s, cx - 11 * s, feetY - 4 * s, sp.tail);
      bp.px(cx + 6 * s, feetY - 4 * s, '#1a1a1a'); bp.outline(64, 64, '#14101a'); this.blit(ctx, camx, camy, tint); return;
    }
    // Tail: fan of 2-3 feathers from back-bottom of body
    const tailBaseX = bodyCx - bodyRx * 0.85, tailBaseY = bodyCy + bodyRy * 0.3;
    const tailLen = (sp.s > 1.2 ? 14 : this.species === 'cockatiel' ? 9 : 8) * s;
    const tailAng = flying ? 0.15 : hang ? -1.2 : 0.75 + Math.sin(PH.time * 1.3) * 0.03; // radians below horizontal (pointing back)
    const spread = 0.12 + a.tailSpread * 0.35;
    for (let i = -1; i <= 1; i++) {
      const ang = tailAng + i * spread; const ex = tailBaseX - Math.cos(ang) * tailLen, ey = tailBaseY + Math.sin(ang) * tailLen;
      bp.tri(tailBaseX, tailBaseY - 1.5 * s, tailBaseX, tailBaseY + 1.5 * s, ex, ey, i === 0 ? sp.tail : PH.shade(sp.tail, 0.8));
    }
    // Far wing (behind body)
    const shoulderX = bodyCx + 0.5 * s, shoulderY = bodyCy - bodyRy * 0.55;
    const wingLen = 8 * s, wingAng = a.wingAngle; // 0 = folded along body, up to ~1.3 raised
    const drawWing = (far) => {
      const ang = wingAng * (far ? 1.05 : 1); const dirSign = 1;
      const tipX = shoulderX - Math.cos(ang * 1.1) * wingLen * dirSign, tipY = shoulderY - Math.sin(ang * 1.1) * wingLen;
      const midX = shoulderX - Math.cos(ang * 0.5) * wingLen * 0.6, midY = shoulderY - Math.sin(ang * 0.5) * wingLen * 0.6 + 3 * s;
      const col = far ? sp.wingD : sp.wing;
      if (ang < 0.15) { // folded: wing lies along body
        bp.ellipse(bodyCx - 0.5 * s, bodyCy - 0.5 * s, bodyRx * 0.75, bodyRy * 0.6, col);
        bp.ellipse(bodyCx - 1.5 * s, bodyCy - 0.5 * s, bodyRx * 0.5, bodyRy * 0.4, far ? sp.wingD : PH.shade(sp.wing, 0.9));
      } else {
        bp.tri(shoulderX, shoulderY - 1, tipX, tipY, midX, midY, col);
        bp.tri(shoulderX, shoulderY + 2 * s, midX, midY, shoulderX - 4 * s, shoulderY + 3 * s, col);
        // primaries
        bp.line(tipX, tipY, midX, midY, PH.shade(col, 0.75));
      }
    };
    if (wingAng > 0.15) drawWing(true);
    // Body
    bp.ellipse(bodyCx, bodyCy, bodyRx, bodyRy, sp.body);
    bp.ellipse(bodyCx + bodyRx * 0.25, bodyCy + bodyRy * 0.35, bodyRx * 0.6, bodyRy * 0.5, PH.mix(sp.body, '#ffffff', 0.12)); // belly highlight
    bp.ellipse(bodyCx - bodyRx * 0.3, bodyCy - bodyRy * 0.3, bodyRx * 0.5, bodyRy * 0.45, sp.bodyD); // back shading
    if (puff > 1.15) { for (let i = 0; i < 6; i++) bp.px(bodyCx + Math.cos(i * 1.1 + PH.time) * bodyRx * 0.95, bodyCy + Math.sin(i * 1.1 + PH.time) * bodyRy * 0.95, sp.bodyD); }
    // Near wing
    drawWing(false);
    // Feet
    const legY = feetY - 3.5 * s + (hang ? -bodyRy * 2 - 3 : 0);
    if (!flying || this.state === 'hop') {
      const w = this.state === 'walk' || this.state === 'climb' ? Math.sin(a.walk) * 1.5 : a.legOff;
      const fy = hang ? feetY - bodyRy * 2 - 8 * s : feetY;
      bp.line(bodyCx - 1.5 * s + w, bodyCy + bodyRy - 1, bodyCx - 1.5 * s + w, fy, '#5a5050'); bp.line(bodyCx + 1.5 * s - w, bodyCy + bodyRy - 1, bodyCx + 1.5 * s - w, fy, '#5a5050');
      bp.hline(bodyCx - 3 * s + w, fy, 3, '#5a5050'); bp.hline(bodyCx + 0.5 * s - w, fy, 3, '#5a5050');
    } else { bp.px(bodyCx - 1, bodyCy + bodyRy - 1, '#5a5050'); bp.px(bodyCx + 1, bodyCy + bodyRy - 1, '#5a5050'); }
    // Head
    const neckX = bodyCx + bodyRx * 0.7, neckY = bodyCy - bodyRy * 0.75;
    let hAng = -0.9 + lean * 0.8; // angle from neck to head center (up-forward)
    const preening = a.preen > 0 && !flying;
    if (preening) hAng = -2.6; // head turned back over shoulder
    const bob = a.headBob.v; const hr = 3.1 * s;
    const hx = neckX + Math.cos(hAng) * hr * 0.9, hy = neckY + Math.sin(hAng) * hr * 0.9 + bob * 0.3 + a.shiver;
    const headFacing = preening ? -1 : 1; // -1 = looking back
    const tilt = a.headTilt; // rotate features
    // head circle (slightly stretched down when bobbing)
    bp.ellipse(hx, hy, hr, hr * (1 + Math.abs(bob) * 0.02), sp.head);
    if (sp.face !== sp.head) bp.ellipse(hx + headFacing * hr * 0.35, hy + hr * 0.1, hr * 0.6, hr * 0.7, sp.face);
    if (sp.cheek) bp.disc(hx + headFacing * hr * 0.2, hy + hr * 0.35, hr * 0.32, sp.cheek);
    // crest
    if (sp.crest) {
      const cr = a.crest; const n = 4; const base = 2 * s + cr * 6 * s;
      for (let i = 0; i < n; i++) {
        const ang = -Math.PI / 2 - 0.5 + i * (0.35 + cr * 0.15) + tilt * 0.3 - (1 - cr) * 0.9;
        const len = base * (1 - Math.abs(i - 1.5) * 0.12);
        bp.line(hx + Math.cos(ang) * hr * 0.6, hy + Math.sin(ang) * hr * 0.6, hx + Math.cos(ang) * (hr * 0.6 + len), hy + Math.sin(ang) * (hr * 0.6 + len), sp.crestColor);
      }
    }
    // eye (position rotates with tilt & turn)
    const turn = a.headTurn; // 0 = facing right (side profile), 1 = looking toward the camera / other way
    const eyeAng = tilt * 0.6; const ex = hx + headFacing * hr * (0.25 - Math.abs(turn) * 0.2) * Math.cos(eyeAng) , ey = hy - hr * 0.2 + Math.sin(eyeAng) * hr * 0.4;
    if (this.sleeping || a.blink > 0) bp.hline(ex - 1, ey, 2, '#1a1a1a');
    else { bp.px(ex, ey, '#1a1a1a'); if (s >= 1) bp.px(ex, ey - 1, sp.eye); if (Math.abs(turn) > 0.5 && s >= 1) bp.px(ex + headFacing * 2, ey, '#1a1a1a'); }
    if (this.sick) bp.hline(ex - 1, ey + 1, 3, PH.shade(sp.head, 0.7));
    // beak
    const bx = hx + headFacing * hr * 0.95, by = hy + hr * 0.05 + tilt * 1.5;
    const bl = (sp.s > 1.2 ? 4 : 2.6) * s, open = a.beakOpen * 1.6 * s;
    bp.tri(bx - headFacing * 1, by - 1.5 * s, bx + headFacing * bl, by - open * 0.4, bx - headFacing * 1, by + 0.5, sp.beak);
    bp.tri(bx - headFacing * 1, by + 0.3, bx + headFacing * bl * 0.8, by + 1.2 * s + open * 0.6, bx - headFacing * 1, by + 1.6 * s, PH.shade(sp.beak, 0.7));
    if (preening) { // beak in wing, feather bits
      if (PH.chance(0.05)) this.flock.feather(this);
    }
    // stolen item indicator
    if (this.stolen && PH.items && PH.items.icon(this.stolen)) bctx.drawImage(PH.items.icon(this.stolen), bx - 4, by + 1, 8, 8);
    bp.outline(64, 64, '#14101a');
    this.blit(ctx, camx, camy, tint);
  };
  Parrot.prototype.blit = function (ctx, camx, camy, tint) {
    const dx = Math.round(this.x - camx), dy = Math.round(this.y - camy);
    ctx.save(); ctx.translate(dx, dy);
    if (this.dir < 0) ctx.scale(-1, 1);
    if (this.anim.hang > 0.5 && !this.dead) { ctx.scale(1, -1); ctx.translate(0, 8); }
    ctx.drawImage(bc, -32, -46);
    ctx.restore();
    if (tint) { ctx.globalAlpha = tint; ctx.fillStyle = '#7a0b12'; ctx.fillRect(dx - 6, dy - 12, 12, 10); ctx.globalAlpha = 1; }
  };

  // ---------------------------------------------------------------------------
  // Flock: manages all birds + aviary structures.
  function Flock() {
    this.birds = []; this.bonds = {}; this.perches = []; this.climbs = []; this.bowls = []; this.toys = []; this.floorY = 0; this.bounds = { x1: 0, x2: 400, y1: 0, y2: 200 };
    this.dirt = 20; this.poops = []; this.droppedItems = []; this.noiseLevel = 0; this.deaths = [];
    for (const k in BONDS) this.bonds[k] = BONDS[k];
  }
  Flock.prototype.setup = function (layout) {
    Object.assign(this, layout);
    this.birds = ROSTER.map((d) => new Parrot(JSON.parse(JSON.stringify(d)), this));
    for (const b of this.birds) { const p = this.randomPerch(b); b.x = p.x; b.y = p.y; b.perch = p; b.dir = PH.chance(0.5) ? 1 : -1; }
    // starting phrases
    this.get('pepper').learn('goodnight', true); this.get('pepper').learn('hello Adrian', true); this.get('pepper').learn('who is it', false);
    this.get('saffron').learn('no no no', false); this.get('marlowe').learn('hello', false); this.get('juno').learn('pretty bird', false);
    this.get('wren').learn('♪ ♪ ♪', false);
  };
  Flock.prototype.get = function (id) { return this.birds.find((b) => b.id === id); };
  Flock.prototype.bond = function (a, b) { return this.bonds[bondKey(a, b)] || 0; };
  Flock.prototype.setBond = function (a, b, d) { const k = bondKey(a, b); this.bonds[k] = PH.clamp((this.bonds[k] || 0) + d, -1, 1); };
  Flock.prototype.update = function (dt, env) {
    env.dirt = this.dirt;
    for (const b of this.birds) b.update(dt, env);
    // poop accumulation
    const alive = this.birds.filter((b) => !b.dead).length;
    if (PH.chance(dt * 0.03 * alive)) { const b = PH.pick(this.birds); if (!b.dead && b.state !== 'fly') { this.poops.push({ x: b.x + PH.rand(-3, 3), y: b.perch ? b.perch.y + 1 : this.floorY }); this.dirt = Math.min(100, this.dirt + 2); if (this.poops.length > 40) this.poops.shift(); } }
    this.noiseLevel = Math.max(0, this.noiseLevel - dt * 0.5);
    for (const t of this.toys) if (t.ring > 0) t.ring -= dt;
    // friends preening near each other slowly bond
    if (PH.chance(dt * 0.2)) for (const a of this.birds) for (const b of this.birds) if (a !== b && !a.dead && !b.dead && Math.abs(a.x - b.x) < 16 && Math.abs(a.y - b.y) < 8 && a.state === 'perch' && b.state === 'perch') this.setBond(a.id, b.id, 0.01);
  };
  Flock.prototype.noise = function (src, amt) { this.noiseLevel = Math.min(2, this.noiseLevel + amt); if (amt >= 1) this.ripple(src, 0.3); };
  Flock.prototype.ripple = function (src, amt) { for (const b of this.birds) if (b !== src && !b.dead && Math.abs(b.x - src.x) < 90 && b.personality.calm < 0.6 && PH.chance(0.5)) b.needs.fear = PH.clamp(b.needs.fear + amt * 30 * (1 - b.personality.calm), 0, 100); };
  Flock.prototype.scareAll = function (amount, source) { for (const b of this.birds) if (!b.dead) b.startle(amount, source); };
  Flock.prototype.feather = function (b) { if (PH.game && PH.game.particles) PH.game.particles.spawn({ x: b.x + PH.rand(-4, 4), y: b.y - 6, vx: PH.rand(-8, 8), vy: 6, g: 4, life: PH.rand(2, 4), color: PH.chance(0.5) ? b.sp.body : b.sp.wing, type: 'feather' }); };
  Flock.prototype.onLand = function (b) { if (PH.chance(0.15)) this.feather(b); };
  Flock.prototype.onMimic = function (b, phrase) { PH.emit('mimic', { bird: b, phrase }); };
  Flock.prototype.onDeath = function (b) { this.deaths.push(b.id); PH.emit('birdDeath', b); for (const o of this.birds) if (o !== b) { o.needs.fear = PH.clamp(o.needs.fear + 30, 0, 100); o.remember('flockmate_died', -2, b.id); } };
  Flock.prototype.dropItem = function (b, item) { this.droppedItems.push({ x: b.x, y: b.perch ? b.perch.y : this.floorY, item }); PH.game.notify(b.name + ' drops the ' + PH.items.label(item) + ' somewhere in the aviary.'); };
  Flock.prototype.someoneOnPlayer = function () { return this.birds.some((b) => b.state === 'onPlayer' || b.pendingState === 'onPlayer'); };
  Flock.prototype.alive = function () { return this.birds.filter((b) => !b.dead); };
  Flock.prototype.avgTrust = function () { const a = this.alive(); return a.length ? a.reduce((s, b) => s + b.trust, 0) / a.length : 0; };
  // spatial helpers
  Flock.prototype.randomPerch = function (b, highOnly) {
    const ps = this.perches.filter((p) => !highOnly || p.y < this.floorY - 40); const p = PH.pick(ps);
    const x = PH.rand(p.x1 + 4, p.x2 - 4); return { x, y: p.y, type: 'perch', ref: p };
  };
  Flock.prototype.nearestPerchTo = function (x, y) { let best = null, bd = 1e9; for (const p of this.perches) { const px = PH.clamp(x, p.x1 + 3, p.x2 - 3); const d = PH.dist(x, y, px, p.y); if (d < bd) { bd = d; best = { x: px, y: p.y, type: 'perch', ref: p }; } } return best; };
  Flock.prototype.farPerch = function (fromX, b) { let best = null, bd = -1; for (const p of this.perches) { const px = (p.x1 + p.x2) / 2; const d = Math.abs(px - fromX) + (this.floorY - p.y) * 0.5; if (d > bd) { bd = d; best = { x: PH.rand(p.x1 + 4, p.x2 - 4), y: p.y, type: 'perch', ref: p }; } } return best; };
  Flock.prototype.floorSpot = function (x) { return { x: PH.clamp(x + PH.rand(-10, 10), this.bounds.x1 + 10, this.bounds.x2 - 10), y: this.floorY, type: 'floor' }; };
  Flock.prototype.hopTarget = function (b) {
    if (!b.perch) return null;
    if (b.perch.type === 'perch' && b.perch.ref) { const p = b.perch.ref; const nx = PH.clamp(b.x + PH.rand(-14, 14), p.x1 + 3, p.x2 - 3); if (Math.abs(nx - b.x) > 3) return { x: nx, y: p.y, type: 'perch', ref: p }; }
    // adjacent perch within hop range
    const near = this.perches.filter((p) => Math.abs(p.y - b.y) < 22 && (Math.abs(p.x1 - b.x) < 30 || Math.abs(p.x2 - b.x) < 30 || (b.x > p.x1 && b.x < p.x2)) && p !== (b.perch.ref));
    if (near.length) { const p = PH.pick(near); return { x: PH.clamp(b.x + PH.rand(-10, 10), p.x1 + 3, p.x2 - 3), y: p.y, type: 'perch', ref: p }; }
    if (b.perch.type === 'floor') return this.floorSpot(b.x);
    return null;
  };
  Flock.prototype.walkTarget = function (b) { if (!b.perch) return null; if (b.perch.type === 'floor') return this.floorSpot(b.x + PH.rand(-30, 30)); if (b.perch.ref) { const p = b.perch.ref; return { x: PH.clamp(b.x + PH.rand(-20, 20), p.x1 + 3, p.x2 - 3), y: p.y, type: 'perch', ref: p }; } return null; };
  Flock.prototype.randomClimb = function () { return this.climbs.length ? PH.pick(this.climbs) : null; };
  Flock.prototype.bestBowl = function (kind, b) { let best = null, bs = -1; for (const bo of this.bowls) { if (bo.kind !== kind || bo.amount <= 0) continue; const s = 1 - Math.abs(bo.x - b.x) / 600 + (bo.food === b.favFood ? 0.5 : 0); if (s > bs) { bs = s; best = bo; } } return best; };
  Flock.prototype.nearestToy = function (b) { let best = null, bd = 1e9; for (const t of this.toys) { const d = Math.abs(t.x - b.x); if (d < bd) { bd = d; best = t; } } return best; };
  Flock.prototype.friendOf = function (b) { let best = null, bs = 0.3; for (const o of this.birds) if (o !== b && !o.dead && (o.state === 'perch' || o.state === 'sleep')) { const s = this.bond(b.id, o.id); if (s > bs) { bs = s; best = o; } } return best; };
  Flock.prototype.rivalNear = function (b, range) { for (const o of this.birds) if (o !== b && !o.dead && Math.abs(o.x - b.x) < (range || 40) && Math.abs(o.y - b.y) < 20 && this.bond(b.id, o.id) < -0.3) return o; return null; };
  Flock.prototype.spotNear = function (other, b) { if (!other.perch || !other.perch.ref) return this.nearestPerchTo(other.x, other.y); const p = other.perch.ref; const side = other.x - 10 * b.sp.s > p.x1 + 3 ? -1 : 1; return { x: PH.clamp(other.x + side * 9 * (b.sp.s + other.sp.s) * 0.7, p.x1 + 3, p.x2 - 3), y: p.y, type: 'perch', ref: p }; };
  Flock.prototype.spotNearPoint = function (x, y, b) { let best = null, bd = 1e9; for (const p of this.perches) { const px = PH.clamp(x + PH.rand(-12, 12), p.x1 + 3, p.x2 - 3); const d = PH.dist(x, y, px, p.y); if (d < bd && d > 8) { bd = d; best = { x: px, y: p.y, type: 'perch', ref: p }; } } if (bd > 70) { const fs = this.floorSpot(x + PH.rand(-16, 16)); if (Math.abs(fs.y - y) < 60) return fs; } return best; };
  Flock.prototype.clean = function (x, radius) { const before = this.poops.length; this.poops = this.poops.filter((p) => Math.abs(p.x - x) > radius); const removed = before - this.poops.length; this.dirt = Math.max(0, this.dirt - removed * 3 - 6); return removed; };
  Flock.prototype.serialize = function () { return { dirt: this.dirt, bonds: this.bonds, bowls: this.bowls.map((b) => ({ amount: b.amount, food: b.food })), birds: this.birds.map((b) => ({ id: b.id, trust: b.trust, needs: b.needs, memories: b.memories, phrases: b.phrases, learned: b.learned, storyPhrases: b.storyPhrases, dead: b.dead })) }; };
  Flock.prototype.deserialize = function (d) { if (!d) return; this.dirt = d.dirt; this.bonds = d.bonds || this.bonds; d.bowls.forEach((s, i) => { if (this.bowls[i]) Object.assign(this.bowls[i], s); }); for (const s of d.birds) { const b = this.get(s.id); if (!b) continue; b.trust = s.trust; Object.assign(b.needs, s.needs); b.memories = s.memories || []; b.phrases = s.phrases || []; b.learned = s.learned || {}; b.storyPhrases = s.storyPhrases || []; if (s.dead) { b.dead = true; b.state = 'dead'; b.y = this.floorY; b.x = PH.clamp(b.x, this.bounds.x1 + 20, this.bounds.x2 - 20); } } };

  PH.Parrot = Parrot; PH.Flock = Flock;
})(window.PH);
