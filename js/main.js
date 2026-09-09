// Main: game state, loop, day/night, weather, rooms, care actions, sleep, saving, endings.
(function (PH) {
  'use strict';
  const HOUR_SECONDS = 40; // one in-game hour per 40 real seconds (a day ~16 min)
  const game = {
    day: 1, hour: 7, room: 'bedroom', camx: 0, flags: {}, decals: [], weather: { rain: 0, wind: 0.3, target: 0 }, fade: 0, fadeDir: 0, title: true, titleCursor: 0, ending: null, clockOffset: 0, lightsOut: 0, reflectionWrong: 0, sitting: null, pendingDeath: null, started: false,
  };
  PH.game = game;

  // ---------- Setup ----------
  function build() {
    PH.world.init();
    game.player = new PH.Player(); game.flock = new PH.Flock(); game.sanity = new PH.Sanity(); game.phone = new PH.Phone(); game.story = new PH.Story(); game.ui = new PH.UI(); game.particles = new PH.gfx.Particles();
    const av = PH.world.room('aviary');
    game.flock.setup({ perches: av.perches, climbs: av.climbs, bowls: av.bowls.map((b) => Object.assign({}, b)), toys: av.toys.map((t) => Object.assign({}, t)), floorY: av.floor, bounds: { x1: 40, x2: av.width - 40, y1: 40, y2: av.floor } });
    game.day = 1; game.hour = 7; game.room = 'bedroom'; game.flags = {}; game.decals = []; game.player.x = 200; game.player.y = PH.world.room('bedroom').floor; game.clockOffset = 0; game.sitting = null; game.ending = null;
    newWeather();
  }
  function newWeather() { game.weather.target = PH.chance(0.35) ? PH.rand(0.3, 1) : 0; game.weather.wind = PH.rand(0.1, 0.8); }

  game.titleOpts = function () { const o = []; if (localStorage.getItem('hollowdome_save')) o.push({ t: 'Continue', f: () => { build(); load(); start(); } }); o.push({ t: 'New game', f: () => { build(); start(true); } }); o.push({ t: 'Help', f: () => { game.ui.help = true; } }); return o; };
  function start(intro) {
    game.title = false; game.started = true; game.ui.showRoom(PH.world.room(game.room).name);
    if (intro) {
      game.say(['Day one. Seven in the morning. The house is very large and you are the only thing in it that breathes.', 'Except that isn\'t true. Across the garden, in the glass dome, six parrots are waiting to be fed.', 'That is the deal you have made with yourself: them first. Then everything else.'], { onClose: () => { game.notify('Go to the aviary: downstairs, out the front door, along the path.'); game.notify('H for help at any time.'); } });
    }
  }
  game.toTitle = function () { game.title = true; game.ending = null; game.titleCursor = 0; build(); };

  // ---------- Environment ----------
  game.isNight = () => game.hour < 6 || game.hour >= 20.5;
  game.env = function () {
    const r = PH.world.room(game.room);
    return { hour: game.hour, night: game.isNight(), wind: game.weather.wind, rain: (r.outdoor || r.glass) ? game.weather.rain : game.weather.rain, distortion: game.sanity.distortion, flicker: game.sanity.flicker, sanity: game.sanity.value, outdoor: !!r.outdoor, showLabels: false, dirt: game.flock.dirt };
  };
  game.notify = function (t, kind) { game.ui.notify(t, kind); };
  game.say = function (lines, opts) { game.ui.say(lines, opts); };

  // ---------- Rooms ----------
  game.changeRoom = function (id, x) {
    const from = game.room; game.room = id; const r = PH.world.room(id); game.player.x = x; game.player.y = r.floor; game.player.vx = 0; game.camx = PH.clamp(x - PH.W / 2, 0, Math.max(0, PH.world.effWidth(r) - PH.W));
    game.ui.showRoom(r.name); game.sanity.figure = null; game.flags.tv = game.flags.tv && id === 'living' ? game.flags.tv : false;
    if (id === 'aviary') { game.flags.visited_aviary = true; for (const b of game.flock.alive()) { b.attention = 0.5; if (b.trust > 65 && PH.chance(0.4)) { b.vocalize('chirp'); } } }
    if (id === 'aviary2') { game.flags.aviary2_seen = true; game.say(['The archive door opens onto a dome. There is no dome under the house.', 'Six shapes sit on six perches. They are all facing you. None of them move.', 'You should not be here.']); game.sanity.change(-8, 'aviary2'); PH.audio.sting(1); }
    if (id === 'longhall') { game.flags.longhall_open = true; game.say(['The hall keeps going.', 'There are more doors than there are rooms in the house. At the far end, faintly, glass.']); PH.audio.sting(0.6); }
    if (id === 'basement' && !game.flags.basement_seen) { game.flags.basement_seen = true; game.say(['You have not been down here since the funeral.', 'It smells of damp cardboard and, under that, faintly, of seed.']); }
    if (from === 'longhall' && id === 'aviary') { game.say(['You step through the last door and you are in the aviary, in daylight, and the birds look up as though you came in the normal way.', 'You do not remember the walk back from the hallway. There was no walk back.']); game.sanity.change(-5, 'impossible'); }
    save();
  };
  game.useDoor = function (d) {
    if (d.locked && !game.flags['unlocked_' + d.to]) { if (game.player.hasItem(d.key)) { game.flags['unlocked_' + d.to] = true; PH.audio.door(); game.say(['The brass key turns. The door has not been opened in a year and says so.']); return; } game.say(['Locked. There was a key. It is in the study safe, probably, with everything else you have decided not to look at.']); return; }
    PH.audio.door(); game.changeRoom(d.to, d.tx);
  };

  // ---------- Sitting / grounding ----------
  game.sitDown = function (kind) { game.sitting = { kind, t: 0 }; game.player.sitting = kind; game.say(kind === 'bench' ? ['You sit. The garden does what gardens do without you.', 'Press any direction to get up.'] : ['You sit down. The cushions remember your shape.', 'Press any direction to get up.']); };
  game.standUp = function () { game.sitting = null; game.player.sitting = null; };
  game.playPiano = function () {
    if (game.flags.piano_today === game.day) { game.say(['You have already played today. Your hands remember more than you do, but not that much.']); return; }
    game.flags.piano_today = game.day; PH.audio.music(true); setTimeout(() => PH.audio.music(false), 12000);
    game.say(['You play the only thing you can still play all the way through: the piece your mother used to teach beginners.', 'From across the garden, faintly, a whistle picks up the tune.']); game.sanity.ground(8, 'piano');
    for (const b of game.flock.alive()) if (b.personality.vocal > 0.5) b.learn('♪ mum\'s tune', false);
  };

  // ---------- Bird care ----------
  game.birdMenu = function (b) { game.ui.openBirdMenu(b); };
  game.petBird = function (b) {
    const p = b.personality; const pl = game.player;
    if (b.needs.fear > 40) { b.needs.fear = Math.max(0, b.needs.fear - 30); b.adjustTrust(3); b.remember('comforted', 1.5); b.anim.puff.t = 1.2; b.anim.crest = 0.2; b.anim.crestT = 2; b.vocalize('purr'); game.say([b.name + ' is shaking. You speak low and slow and hold out a hand without moving it.', 'It takes a while. Then ' + b.name + ' steps onto your finger.']); game.sanity.ground(5, 'bird'); game.story.markCare('comfort'); return; }
    if (b.trust < 30 && p.bold < 0.5) { b.startle(0.4, 'player'); game.say([b.name + ' does not want to be touched, and says so with a beak.', 'Fair.']); return; }
    if (b.trust < 45 && PH.chance(0.4)) { b.needs.fear += 10; b.adjustTrust(-1); game.say([b.name + ' leans away. Not yet.']); return; }
    b.adjustTrust(2 + p.social * 2); b.remember('petted', 1); b.anim.puff.t = 1.25; b.anim.headTilt = 0.5; b.anim.headTiltT = 2; b.needs.social = Math.max(0, b.needs.social - 20); b.vocalize('purr');
    game.say(PH.pick([[b.name + ' lowers ' + (b.id === 'wren' || b.id === 'saffron' || b.id === 'juno' ? 'her' : 'his') + ' head for scratches. Feathers go up like a dandelion.'], [b.name + ' closes ' + (b.id === 'wren' || b.id === 'saffron' || b.id === 'juno' ? 'her' : 'his') + ' eyes. So do you, for a second.'], ['You scratch the pin feathers on ' + b.name + '\'s neck, the ones ' + (b.id === 'wren' || b.id === 'saffron' || b.id === 'juno' ? 'she' : 'he') + ' cannot reach. A small trade, kept.']]));
    game.sanity.ground(4, 'bird'); game.story.markCare('pet');
  };
  game.singTo = function (b) {
    game.flags.sang = (game.flags.sang || 0) + 1;
    b.vocalize('whistle'); b.say('♪', 2); b.attention = 1; b.adjustTrust(1.5); b.remember('sang', 1); b.needs.boredom = Math.max(0, b.needs.boredom - 12);
    for (const o of game.flock.alive()) if (o !== b && o.personality.vocal > 0.5 && Math.abs(o.x - b.x) < 150) setTimeout(() => { if (!o.dead) { o.vocalize('whistle'); o.say('♪', 1.5); } }, 400 + Math.random() * 800);
    if (PH.chance(0.3)) b.learn('♪ ♪', false);
    game.say(PH.pick([['You whistle the three notes. ' + b.name + ' answers with four.'], ['You sing, badly. ' + b.name + ' does not mind. ' + b.name + ' has heard worse from you at 3am.'], [b.name + ' bobs in time. The others pick it up. For a moment the dome is a choir.']]));
    game.sanity.ground(5, 'sing'); game.story.markCare('sing');
  };
  game.playWith = function (b) {
    if (b.needs.fear > 50) { game.say([b.name + ' is too frightened to play. Comfort first.']); return; }
    b.needs.boredom = Math.max(0, b.needs.boredom - 30); b.adjustTrust(2); b.remember('played_with_player', 1); b.anim.headBob.kick(80); b.anim.wingAngle = 0.6;
    const lines = { pepper: ['You hide a walnut under a cup. Pepper looks at the cup, looks at you, and says "who is it".'], saffron: ['Saffron hangs from your sleeve by one foot and screams with joy. The sleeve does not survive.'], ivo: ['Ivo\'s idea of play is being handed a piece of mango slowly. You oblige.'], marlowe: ['You toss the bell. Marlowe catches it, holds it, and looks at you with tremendous dignity.'], wren: ['You wiggle a finger. Wren attacks it with the ferocity of a very small, very polite dinosaur.'], juno: ['Juno hangs upside down from your wrist and swings. You have no idea why. Neither does Juno.'] };
    game.say(lines[b.id] || ['You play.']); game.sanity.ground(5, 'bird'); game.story.markCare('play'); if (PH.chance(0.15)) game.flock.feather(b);
  };
  game.giveTreat = function (b) {
    const pl = game.player; if (!pl.hasItem('treat')) return;
    pl.removeItem('treat', 1); b.needs.hunger = Math.max(0, b.needs.hunger - 10); b.adjustTrust(4 + (b.favFood === 'nuts' ? 1 : 0)); b.remember('treat', 2); b.attention = 1; b.anim.headBob.kick(50); PH.audio.seeds();
    if (b.trust > 60 && PH.chance(0.4)) b.learn('thank you', false);
    game.say([b.name + ' takes the treat from your fingers with enormous care, then eats it with none.']); game.sanity.ground(3, 'bird');
    const rivals = game.flock.alive().filter((o) => o !== b && game.flock.bond(o.id, b.id) < -0.3 && Math.abs(o.x - b.x) < 100); for (const r of rivals) { r.remember('jealous', -0.5, b.id); r.vocalize('squawk'); if (r.personality.bold > 0.6) r.needs.social += 10; }
  };
  game.giveMedicine = function (b) { const pl = game.player; if (!pl.hasItem('medicine')) return; pl.removeItem('medicine', 1); b.needs.health = Math.min(100, b.needs.health + 35); b.sick = b.needs.health < 20; b.remember('medicine', 1); b.adjustTrust(1); game.say(['You hold ' + b.name + ' in a towel and get the dropper in on the second try.', b.needs.health > 60 ? 'Colour comes back to the eye within the hour.' : 'It will take a while. You will check again tonight.']); game.story.markCare('medicine'); game.sanity.ground(3, 'bird'); };
  game.bandageBird = function (b) { const pl = game.player; if (!pl.hasItem('bandage')) return; if (b.needs.health > 70) { game.say([b.name + ' is fine. You check the feet anyway.']); return; } pl.removeItem('bandage', 1); b.needs.health = Math.min(100, b.needs.health + 15); game.say(['You clean the scrape on ' + b.name + '\'s foot and wrap it loosely.']); game.story.markCare('medicine'); };
  game.examineBird = function (b) {
    const n = b.needs; const lines = [b.name + '. ' + b.sp.name + '. ' + b.bio];
    lines.push('Mood: ' + b.mood + '. Trust: ' + (b.trust > 75 ? 'deep.' : b.trust > 50 ? 'steady.' : b.trust > 30 ? 'cautious.' : 'thin.'));
    if (n.health < 60) lines.push('The feathers are dull and ' + (b.id === 'wren' || b.id === 'saffron' || b.id === 'juno' ? 'she' : 'he') + ' sits low. Medicine, warmth, clean water.');
    const mem = b.memories.slice(-3).map((m) => m.type.replace(/_/g, ' ')).join(', '); if (mem) lines.push('Recent: ' + mem + '.');
    if (b.phrases.length) lines.push('Says: ' + b.phrases.map((p) => '"' + p + '"').join(', '));
    const friend = game.flock.friendOf(b); const rival = game.flock.birds.find((o) => o !== b && game.flock.bond(o.id, b.id) < -0.3);
    if (friend) lines.push('Sits with ' + friend.name + '.'); if (rival) lines.push('Does not get on with ' + rival.name + '.');
    game.say(lines);
  };
  game.onFeed = function (bowl) { game.story.markCare('feed'); game.notify('Bowl filled with ' + PH.items.label(bowl.food).toLowerCase() + '.'); let fans = 0; for (const b of game.flock.alive()) { b.remember('saw_feeding', 0.5); if (Math.abs(b.x - bowl.x) < 200) { b.attention = 1; b.decideT = Math.min(b.decideT, PH.rand(0.3, 1.5)); } if (b.favFood === bowl.food) { fans++; b.adjustTrust(1.5); } } if (fans && PH.chance(0.6)) game.say([PH.pick(['Heads turn before the seed hits the bowl.', 'Someone screams with approval. Probably Saffron.', 'Marlowe pretends not to have noticed, then moves two perches closer.'])]); game.sanity.ground(3, 'care'); checkCare(); };
  game.onWater = function () { game.story.markCare('water'); game.notify('Fresh water.'); for (const b of game.flock.alive()) b.remember('saw_water', 0.3); game.sanity.ground(2, 'care'); checkCare(); };
  game.onClean = function (n) { game.story.markCare('clean'); game.notify(n ? 'You scrub the perches and floor.' : 'Cleaner.'); game.sanity.ground(2, 'care'); for (const b of game.flock.alive()) if (Math.abs(b.x - game.player.x) < 60 && b.personality.bold < 0.5) b.needs.fear += 4; checkCare(); };
  function checkCare() { if (game.story.careComplete() && !game.flags['care_' + game.day]) { game.flags['care_' + game.day] = true; game.notify('The birds are cared for today.'); game.sanity.ground(6, 'care'); game.say(['That is the essential work done. Fed, watered, clean.', game.day === 1 ? 'The rest of the day is yours, which is the problem.' : PH.pick(['Now the harder animal.', 'Now you.', 'The dome is quiet. The phone is not.', 'You have until dark to be a person.'])]); } }

  // ---------- Sleep, day change, time skips ----------
  game.trySleep = function () {
    if (game.hour < 19 && game.hour > 5) { game.say(['It is ' + PH.fmtClock(game.hour).trim() + '. Lying down now would not be sleeping.', game.story.careComplete() ? 'The birds are fed. You could sit with them instead.' : 'The birds have not been fed yet.']); return; }
    if (!game.story.careComplete()) { game.say(['You have not finished with the birds today.', 'You know you will not sleep.'], { choices: [{ t: 'Go to the aviary.', f: () => { } }, { t: 'Sleep anyway.', f: () => doSleep(true) }] }); return; }
    doSleep(false);
  };
  function doSleep(neglect) {
    game.fadeDir = 1; game.pendingSleep = neglect;
  }
  function finishSleep() {
    const neglect = game.pendingSleep; game.pendingSleep = undefined;
    // advance
    const hoursSlept = game.hour >= 19 ? (31 - game.hour) : (7 - game.hour); advanceBirds(hoursSlept, neglect);
    game.phone.endDay(game); game.day++; game.hour = 7 + PH.rand(0, 0.5); game.sanity.newDay(); game.flags.tv = false; PH.audio.music(false); game.flags.music = false; newWeather(); game.decals = [];
    if (neglect) { game.sanity.change(-8, 'neglect'); for (const b of game.flock.alive()) { b.remember('neglected', -2); b.adjustTrust(-4); } }
    else game.sanity.change(4, 'sleep');
    const dream = game.story.dream();
    if (game.day > 7) { const ev = game.story.evaluate(); game.beginEnding(ev.ending); return; }
    game.say([...dream, 'Day ' + game.day + '.' + (game.day === 7 ? ' Something in the house has decided this is the last one.' : '')]);
    game.ui.showRoom('Bedroom'); game.player.x = 200; game.room = 'bedroom'; game.camx = 0;
    if (game.day === 7) game.notify('Whatever you are going to do, do it today.');
    save();
  }
  function advanceBirds(hours, neglect) { for (const b of game.flock.alive()) { const n = b.needs; n.hunger = PH.clamp(n.hunger + hours * 3.5, 0, 100); n.thirst = PH.clamp(n.thirst + hours * 4, 0, 100); n.boredom = PH.clamp(n.boredom + hours * 2, 0, 100); n.energy = 100; n.fear = Math.max(0, n.fear - 30); if (neglect && n.hunger > 80) n.health -= 10; if (n.health <= 0) { n.health = 0; } b.sleeping = false; b.state = 'perch'; } game.flock.dirt = Math.min(100, game.flock.dirt + 15); }
  game.timeSkip = function () {
    if (game.ui.blocking() || game.skipping) return; game.skipping = true; game.fadeDir = 1; game.pendingSkip = true; PH.audio.sting(0.7);
  };
  function finishSkip() {
    game.pendingSkip = false; game.skipping = false; const h = PH.rand(1, 3); game.hour += h; if (game.hour >= 24) { game.hour -= 24; game.day++; game.phone.endDay(game); game.sanity.newDay(); }
    advanceBirds(h, false); game.sanity.timeSkips++; game.sanity.change(-4, 'skip');
    const dests = [['aviary', 300], ['study', 200], ['kitchen', 150], ['garden', 500], ['bathroom', 140], ['foyer', 150]]; const d = PH.pick(dests);
    game.room = d[0]; game.player.x = d[1]; game.player.y = PH.world.room(d[0]).floor; game.camx = PH.clamp(d[1] - PH.W / 2, 0, PH.world.effWidth(PH.world.room(d[0])) - PH.W);
    game.ui.showRoom(PH.world.room(d[0]).name);
    game.say([PH.pick(['You are standing somewhere else. The clock says ' + PH.fmtClock(game.hour).trim() + '.', 'The light has changed. You do not remember the last ' + Math.round(h) + ' hours.', 'You come back to yourself mid-step. Your hands smell of seed. It is ' + PH.fmtClock(game.hour).trim() + '.']), d[0] === 'aviary' ? 'The birds are watching you the way they watch a cat.' : d[0] === 'bathroom' ? 'The tap is running. You turn it off.' : 'Nothing seems to be missing except the time.']);
    if (d[0] === 'aviary' && PH.chance(0.5)) game.flock.get('pepper').storyPhrases.push('two hours');
  }
  game.beginEnding = function (kind) { if (game.ending) return; PH.endings.begin(game, kind); };

  // ---------- Save / load ----------
  function save() {
    if (game.title || game.ending) return;
    try { const d = { v: 1, day: game.day, hour: game.hour, room: game.room, x: game.player.x, flags: game.flags, inv: game.player.inv, sanity: { value: game.sanity.value, lowest: game.sanity.lowest, timeSkips: game.sanity.timeSkips }, flock: game.flock.serialize(), phone: game.phone.serialize(), story: game.story.serialize(), toys: game.flock.toys }; localStorage.setItem('hollowdome_save', JSON.stringify(d)); } catch (e) { }
  }
  function load() {
    try { const d = JSON.parse(localStorage.getItem('hollowdome_save')); if (!d) return; game.day = d.day; game.hour = d.hour; game.room = d.room; game.flags = d.flags || {}; game.player.inv = d.inv || game.player.inv; Object.assign(game.sanity, d.sanity); game.flock.deserialize(d.flock); if (d.toys) game.flock.toys = d.toys; game.phone.deserialize(d.phone); game.story.deserialize(d.story); const r = PH.world.room(game.room); game.player.x = d.x; game.player.y = r.floor; game.camx = PH.clamp(d.x - PH.W / 2, 0, Math.max(0, PH.world.effWidth(r) - PH.W)); } catch (e) { console.warn('load failed', e); }
  }

  // ---------- Events ----------
  PH.on('mimic', ({ bird, phrase }) => {
    if (game.room !== 'aviary') return;
    if (['sign it Adrian', 'I didn\'t see the footage', 'nobody came', 'Ada', 'two hours', 'take care of the birds'].includes(phrase)) { game.sanity.change(-3, 'mimic'); if (!game.flags['mimic_' + phrase]) { game.flags['mimic_' + phrase] = true; game.notify(bird.name + ' has learned something you did not teach.'); game.story.addFragment('mimic_' + phrase, bird.name + ' says: "' + phrase + '"', 'A phrase in a voice that is not ' + bird.name + '\'s and not yours. ' + (phrase === 'Ada' ? 'Your mother\'s other bird. You had not said that name in a year. Someone in this house has.' : phrase === 'nobody came' ? 'You did not say this. You have thought it every day.' : 'Somebody said it in this house, often enough for a parrot to learn it.')); } }
    if (phrase === 'goodnight' && game.isNight()) game.sanity.ground(2, 'goodnight');
  });
  PH.on('birdDeath', (b) => { game.pendingDeath = b; });

  // ---------- Update ----------
  function update(dt) {
    PH.time += dt; const I = PH.input;
    if (I.just('mute')) PH.audio.toggleMute();
    if (game.title) {
      if (game.ui.help) { if (I.just('help') || I.just('cancel') || I.just('interact')) game.ui.help = false; return; }
      const opts = game.titleOpts(); if (I.just('up')) game.titleCursor = PH.mod(game.titleCursor - 1, opts.length); if (I.just('down')) game.titleCursor = PH.mod(game.titleCursor + 1, opts.length); if (I.just('interact') || I.just('use')) { PH.audio.click(); opts[game.titleCursor].f(); } if (I.just('help')) game.ui.help = true; return;
    }
    if (game.ending) { PH.endings.update(dt, game); return; }
    // fades (sleep / time skip)
    if (game.fadeDir > 0) { game.fade = Math.min(1, game.fade + dt * 1.2); if (game.fade >= 1) { game.fadeDir = -1; if (game.pendingSleep !== undefined) finishSleep(); else if (game.pendingSkip) finishSkip(); } return; }
    if (game.fadeDir < 0) { game.fade = Math.max(0, game.fade - dt * 0.8); if (game.fade <= 0) game.fadeDir = 0; }
    // time
    const blocked = game.ui.blocking();
    const timeScale = game.sitting ? 6 : 1;
    if (!blocked || game.sitting) game.hour += dt / HOUR_SECONDS * timeScale;
    if (game.hour >= 24) { game.hour -= 24; game.day++; game.phone.endDay(game); game.sanity.newDay(); newWeather(); game.notify('Midnight. Day ' + game.day + '.'); if (game.day > 7) { game.beginEnding(game.story.evaluate().ending); return; } }
    if (game.hour > 3.5 && game.hour < 5 && !game.flags['collapse_' + game.day] && !blocked) { game.flags['collapse_' + game.day] = true; game.say(['You have been awake for twenty hours. Your body makes the decision for you.'], { onClose: () => { game.pendingSleep = true; game.fadeDir = 1; } }); }
    // weather
    game.weather.rain = PH.approach(game.weather.rain, game.weather.target, dt * 0.05); game.weather.wind = PH.clamp(game.weather.wind + (PH.noise1(PH.time * 0.05) - 0.5) * dt * 0.2, 0.05, 1);
    if (game.lightsOut > 0) game.lightsOut -= dt; if (game.reflectionWrong > 0) game.reflectionWrong -= dt;
    for (let i = game.decals.length - 1; i >= 0; i--) { game.decals[i].t -= dt; if (game.decals[i].t <= 0) game.decals.splice(i, 1); }
    // sitting: grounding
    if (game.sitting) { game.sitting.t += dt; game.sanity.ground(dt * 0.6, game.sitting.kind); if (game.sitting.kind === 'bench' && game.sitting.t > 6 && !game.sitting.said) { game.sitting.said = true; game.notify(PH.pick(['A blackbird lands on the fountain. It does not need anything from you.', 'The wind moves the hedge. You breathe with it, more or less.', 'From here you can hear the aviary. It sounds like a market.'])); } }
    // systems
    game.ui.update(dt, game);
    game.player.update(dt, game);
    if (!blocked) { if (I.just('interact')) game.player.interact(game); if (I.just('use')) game.player.use(game); if (I.just('sing') && game.room === 'aviary') { const t = game.player.findTarget(game); if (t && t.type === 'bird') game.singTo(t.obj); else { game.flags.sang = (game.flags.sang || 0) + 1; for (const b of game.flock.alive()) if (b.personality.vocal > 0.5 && PH.chance(0.6)) { b.vocalize('whistle'); b.say('♪', 1.5); b.adjustTrust(0.3); } game.sanity.ground(2, 'sing'); } } }
    // flock
    const env = game.env(); game.flock.update(dt, env);
    if (game.pendingDeath && !blocked) { const b = game.pendingDeath; game.pendingDeath = null; game.say([b.name + ' is on the floor of the aviary and does not get up.', 'You know before you reach ' + (b.id === 'wren' || b.id === 'saffron' || b.id === 'juno' ? 'her' : 'him') + '. You knew yesterday.', 'The others are very quiet.']); game.sanity.change(-18, 'death'); PH.audio.sting(1); game.story.addFragment('death_' + b.id, b.name, b.name + ' died on day ' + game.day + '. Hunger, thirst, or fear, or all three. You were in the house.'); for (const o of game.flock.alive()) o.storyPhrases.push(b.name); }
    game.sanity.update(dt, game); game.phone.update(dt, game);
    // camera
    const r = PH.world.room(game.room); const eff = PH.world.effWidth(r); const tx = PH.clamp(game.player.x - PH.W / 2 + game.player.dir * 20, 0, Math.max(0, eff - PH.W)); game.camx = PH.lerp(game.camx, tx, Math.min(1, dt * 4));
    // particles
    const P = game.particles; P.update(dt);
    if (r.outdoor && game.weather.rain > 0.1) { const n = Math.floor(game.weather.rain * 6); for (let i = 0; i < n; i++) P.spawn({ x: game.camx + PH.rand(-20, PH.W + 20), y: -5, vx: -20 - game.weather.wind * 30, vy: 220, life: 1.3, color: 'rgba(180,200,220,0.7)', type: 'rain', size: 4, fade: false }); }
    if (r.outdoor && game.isNight() && PH.chance(dt * 1.5) && game.weather.rain < 0.3) P.spawn({ x: game.camx + PH.rand(0, PH.W), y: r.floor - PH.rand(5, 50), vx: PH.rand(-6, 6), vy: PH.rand(-4, 2), life: PH.rand(2, 4), color: '#d8f080', type: 'mote', alpha: 0.8 });
    if (!r.outdoor && !r.dark && PH.world.daylight(game.hour) > 0.3 && PH.chance(dt * 3)) { const wins = r.props.filter((p) => p.window); if (wins.length) { const w = PH.pick(wins); P.spawn({ x: PH.world.propX(r, w) + PH.rand(0, 40), y: PH.rand(130, 210), vx: PH.rand(-3, 3), vy: PH.rand(-2, 2), life: PH.rand(3, 6), color: 'rgba(255,240,200,0.5)', type: 'mote' }); } }
    if (r.glass && PH.chance(dt * 0.6)) P.spawn({ x: game.camx + PH.rand(0, PH.W), y: PH.rand(40, 200), vx: PH.rand(-2, 2), vy: PH.rand(1, 3), life: PH.rand(3, 6), color: 'rgba(255,255,255,0.35)', type: 'mote' });
    if (r.dark && PH.chance(dt * 2)) P.spawn({ x: game.camx + PH.rand(0, PH.W), y: PH.rand(50, 230), vx: 0, vy: PH.rand(-2, 2), life: 3, color: 'rgba(200,200,220,0.25)', type: 'mote' });
    // audio env
    PH.audio.setEnvironment({ outdoor: !!(r.outdoor || r.glass), wind: game.weather.wind, rain: game.weather.rain, dread: game.sanity.dread * (game.ui.phoneOpen ? 0.5 : 1), whisper: game.sanity.whisper });
    // aviary ambience: bird noise handled per bird
  }

  // ---------- Boot ----------
  function boot() {
    const canvas = document.getElementById('game'); const sctx = canvas.getContext('2d');
    canvas.width = PH.W; canvas.height = PH.H; sctx.imageSmoothingEnabled = false;
    function resize() { const s = Math.max(1, Math.floor(Math.min(window.innerWidth / PH.W, window.innerHeight / PH.H))); canvas.style.width = PH.W * s + 'px'; canvas.style.height = PH.H * s + 'px'; }
    window.addEventListener('resize', resize); resize();
    PH.input.init(canvas); PH.render.init(); build();
    const bootEl = document.getElementById('boot');
    const go = () => { bootEl.style.display = 'none'; PH.audio.init(); PH.audio.resume(); canvas.focus(); };
    bootEl.addEventListener('click', go); window.addEventListener('keydown', function once(e) { if (bootEl.style.display !== 'none') { go(); } window.removeEventListener('keydown', once); });
    canvas.addEventListener('click', () => { PH.audio.resume(); canvas.focus(); });
    let last = performance.now();
    function loop(now) { let dt = (now - last) / 1000; last = now; if (dt > 0.1) dt = 0.1; try { update(dt); PH.render.frame(sctx, game); } catch (e) { console.error(e); } PH.input.endFrame(); requestAnimationFrame(loop); }
    requestAnimationFrame(loop);
  }
  PH.step = update; PH.save = save;
  window.addEventListener('DOMContentLoaded', boot);
})(window.PH);
