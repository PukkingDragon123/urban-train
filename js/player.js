// Player: movement, hotbar inventory, interaction targeting, item use, singing.
(function (PH) {
  'use strict';
  const ITEMS = {
    seeds: { label: 'Seed mix', max: 5, food: true, desc: 'Millet, sunflower, safflower. Wren\'s favourite.' },
    pellets: { label: 'Pellets', max: 5, food: true, desc: 'Vet-formulated. Nobody\'s favourite, everybody\'s dinner.' },
    fruit: { label: 'Chopped fruit', max: 4, food: true, desc: 'Mango and papaya. Saffron and Ivo will fight over this.' },
    nuts: { label: 'Walnuts', max: 4, food: true, desc: 'Pepper and Marlowe would sell you for these.' },
    treat: { label: 'Treat sticks', max: 3, food: true, treat: true, desc: 'Honey seed sticks. Handed over directly, they build trust.' },
    medicine: { label: 'Bird medicine', max: 2, desc: 'From the avian vet. For a bird that is unwell.' },
    bandage: { label: 'Bandages', max: 3, desc: 'For a bird that has hurt itself, or for you.' },
    toy: { label: 'Bell toy', max: 3, desc: 'Hang it in the aviary. Birds get bored too.' },
    brush: { label: 'Scrub brush', max: 1, desc: 'For the perches and the floor. Use it near the mess.' },
    water: { label: 'Watering can', max: 6, desc: 'Refill at any sink or the fountain.' },
    key: { label: 'Brass key', max: 1, desc: 'Labelled B.' },
    flashlight: { label: 'Flashlight', max: 1, desc: 'Hold it selected to see in the dark.' },
    phone: { label: 'Phone', max: 1, desc: 'Tab to open. Someone might have written.' },
    tea: { label: 'Cup of tea', max: 1, desc: 'Drink it while it is warm.' },
  };
  const ORDER = ['phone', 'seeds', 'pellets', 'fruit', 'nuts', 'treat', 'water', 'brush', 'toy', 'medicine', 'bandage', 'tea', 'flashlight', 'key'];
  let icons = null;
  PH.items = {
    def: (id) => ITEMS[id], label: (id) => (ITEMS[id] ? ITEMS[id].label : id),
    icon(id) { if (!icons) icons = PH.gfx.buildItems(); return icons[id] || icons.record; }, ORDER,
  };

  function Player() {
    this.x = 100; this.y = 222; this.vx = 0; this.vy = 0; this.dir = 1; this.onGround = true;
    this.frames = PH.gfx.buildPlayer(); this.animT = 0; this.pose = 'idle'; this.stillT = 0; this.running = false;
    this.inv = { phone: 1, seeds: 3, pellets: 2, water: 4, brush: 1, treat: 1 }; this.slot = 0;
    this.stepT = 0; this.sitting = null; this.breathing = 0; this.lookAway = 0;
  }
  Player.prototype.hotbar = function () { return ORDER.filter((id) => this.inv[id] > 0); };
  Player.prototype.currentItem = function () { const h = this.hotbar(); if (this.slot >= h.length) this.slot = Math.max(0, h.length - 1); return h[this.slot] || null; };
  Player.prototype.hasItem = function (id) { return (this.inv[id] || 0) > 0; };
  Player.prototype.giveItem = function (id, n) { const d = ITEMS[id]; const cur = this.inv[id] || 0; this.inv[id] = Math.min(d ? d.max : 9, cur + n); };
  Player.prototype.removeItem = function (id, n) { this.inv[id] = Math.max(0, (this.inv[id] || 0) - n); };
  Player.prototype.selectItem = function (id) { const h = this.hotbar(); const i = h.indexOf(id); if (i >= 0) this.slot = i; };

  Player.prototype.update = function (dt, game) {
    const I = PH.input, room = PH.world.room(game.room); const eff = PH.world.effWidth(room);
    const busy = game.ui.blocking();
    let mv = 0;
    if (!busy && !this.sitting) { if (I.is('left')) mv -= 1; if (I.is('right')) mv += 1; }
    if (this.sitting && (mv !== 0 || (!busy && (I.just('interact') || I.just('cancel') || I.is('left') || I.is('right'))))) { game.standUp(); }
    this.running = I.is('breathe') === false && Math.abs(this.vx) > 60;
    const speed = this.sick ? 40 : 62;
    const target = mv * speed * (I.is('breathe') ? 0.45 : 1) * (game.sanity.slow || 1);
    this.vx = PH.approach(this.vx, target, dt * 600);
    if (mv !== 0) { this.dir = mv; this.stillT = 0; } else this.stillT += dt;
    // hop
    if (!busy && !this.sitting && I.just('jump') && this.onGround && !I.is('interact')) { this.vy = -150; this.onGround = false; }
    this.vy += 520 * dt; this.y += this.vy * dt;
    if (this.y >= room.floor) { if (!this.onGround) { PH.audio.step(room.surface); } this.y = room.floor; this.vy = 0; this.onGround = true; }
    this.x += this.vx * dt;
    this.x = PH.clamp(this.x, 22, eff - 22);
    // footsteps
    if (Math.abs(this.vx) > 10 && this.onGround) { this.stepT += dt * Math.abs(this.vx) / 22; if (this.stepT > 1) { this.stepT = 0; PH.audio.step(room.surface); game.sanity.onStep(); } }
    // animation
    this.animT += dt * (Math.abs(this.vx) > 10 ? 9 : 2.2);
    this.pose = this.sitting ? 'sit' : game.ui.phoneOpen ? 'phone' : this.interacting > 0 ? 'reach' : Math.abs(this.vx) > 10 ? 'walk' : 'idle';
    if (this.interacting > 0) this.interacting -= dt;
    this.running = Math.abs(this.vx) > 50;
    // breathing / grounding (hold shift)
    if (!busy && I.is('breathe')) { this.breathing = Math.min(1, this.breathing + dt * 0.5); game.sanity.ground(dt * 0.8, 'breath'); } else this.breathing = Math.max(0, this.breathing - dt);
    // hotbar
    if (!busy) {
      const d = I.digit(); if (d) { this.slot = Math.min(d - 1, this.hotbar().length - 1); PH.audio.click(); }
      if (I.wheel) { const n = this.hotbar().length; this.slot = PH.mod(this.slot + I.wheel, Math.max(1, n)); PH.audio.click(); }
      if (I.justKey('KeyQ')) { const n = this.hotbar().length; this.slot = PH.mod(this.slot - 1, Math.max(1, n)); PH.audio.click(); }
      if (I.justKey('KeyR')) { const n = this.hotbar().length; this.slot = PH.mod(this.slot + 1, Math.max(1, n)); PH.audio.click(); }
    }
  };

  // What is the player near? Returns {type, obj, label}
  Player.prototype.findTarget = function (game) {
    const room = PH.world.room(game.room); const W = PH.world;
    let best = null, bd = 1e9;
    const consider = (type, obj, x, y, label, range, bonus) => { const d = Math.abs(x - this.x) + Math.abs((y || this.y) - this.y) * 0.4 - (bonus || 0); if (d < (range || 26) && d < bd) { bd = d; best = { type, obj, label, x }; } };
    for (const d of W.visibleDoors(room)) { const dx = W.doorX(room, d); consider('door', d, dx + 11, this.y, (d.locked && !game.flags['unlocked_' + d.to] ? '[LOCKED] ' : '') + d.label, 34); }
    for (const p of room.props) if (p.interact) { const sz = PH.props.size(p.p); const px = W.propX(room, p) + sz[0] / 2; consider('prop', p, px, this.y, p.interact === 'mirror' ? 'Look in the mirror' : p.interact === 'bed' ? 'Sleep' : p.interact === 'monitors' ? 'Security feeds' : p.interact === 'computer' ? 'Business records' : p.interact === 'record' ? 'Record player' : p.interact === 'photowall' ? 'Photographs' : p.interact === 'pills' ? 'Prescription' : p.interact === 'tapes' ? 'Tapes' : p.interact === 'oldcage' ? 'Old cage' : p.interact === 'boxes' ? 'Boxes' : p.interact.charAt(0).toUpperCase() + p.interact.slice(1), Math.max(26, sz[0] / 2 + 10)); }
    if (game.room === 'aviary') {
      const F = game.flock;
      for (const b of F.bowls) consider('bowl', b, b.x + 7, b.y, (b.kind === 'water' ? 'Water bowl' : 'Food bowl') + (b.amount <= 0 ? ' (empty)' : b.kind === 'food' ? ' (' + PH.items.label(b.food) + ')' : ''), 22);
      for (const t of F.toys) consider('toy', t, t.x, this.y, t.type === 'bell' ? 'Bell' : t.type === 'swing' ? 'Swing' : 'Rope', 20);
      for (const b of F.birds) if (!b.dead && Math.abs(b.y - this.y) < 60) consider('bird', b, b.x, this.y, b.name, 30, 12);
      for (const it of F.droppedItems) consider('dropped', it, it.x, this.y, 'Dropped ' + PH.items.label(it.item), 20);
      const poop = F.poops.find((p) => Math.abs(p.x - this.x) < 20); if (poop && this.currentItem() === 'brush') consider('mess', poop, poop.x, this.y, 'Mess', 22);
      if (F.dirt > 40 && !best) { /* generic cleaning prompt handled in use */ }
    }
    return best;
  };

  // E: interact
  Player.prototype.interact = function (game) {
    const t = this.findTarget(game); if (!t) return;
    this.interacting = 0.4;
    if (t.type === 'door') game.useDoor(t.obj);
    else if (t.type === 'prop') PH.world.interact(t.obj);
    else if (t.type === 'bird') game.birdMenu(t.obj);
    else if (t.type === 'bowl') { const b = t.obj; if (b.kind === 'food') game.say([b.amount > 0 ? 'The bowl has some ' + PH.items.label(b.food).toLowerCase() + ' left. Use food from the hotbar (F) to top it up.' : 'Empty. Use food from the hotbar (F) to fill it.']); else game.say([b.amount > 0 ? 'The water is ' + (b.amount > 3 ? 'clean enough.' : 'low and cloudy. Use the watering can (F).') : 'Dry. Use the watering can (F).']); }
    else if (t.type === 'toy') { const toy = t.obj; if (toy.type === 'bell') { PH.audio.click(); toy.ring = 0.4; for (const b of game.flock.birds) if (Math.abs(b.x - toy.x) < 120 && !b.dead) { b.anim.headTilt = PH.rand(-0.6, 0.6); b.anim.headTiltT = 1.5; b.attention = 1; if (b.favToy === 'bell') b.needs.boredom = Math.max(0, b.needs.boredom - 5); } game.say(['You ring the bell. Heads turn.']); game.sanity.ground(1, 'bird'); } else if (toy.type === 'swing') { toy.swing = (toy.swing || 0) + 1.5; game.say(['You give the swing a push.']); } else game.say(['A knotted rope. Juno has chewed the bottom to fluff.']); }
    else if (t.type === 'dropped') { const it = t.obj; this.giveItem(it.item, 1); game.flock.droppedItems.splice(game.flock.droppedItems.indexOf(it), 1); PH.audio.pickup(); game.say(['You pick up the ' + PH.items.label(it.item).toLowerCase() + '.']); }
    else if (t.type === 'mess') this.use(game);
  };

  // F: use current item
  Player.prototype.use = function (game) {
    const item = this.currentItem(); if (!item) return;
    const d = ITEMS[item]; this.interacting = 0.4;
    if (item === 'phone') { game.ui.openPhone(); return; }
    if (item === 'tea') { this.removeItem('tea', 1); game.sanity.ground(10, 'tea'); game.say(['You drink the tea. It is still warm. That helps more than it should.']); return; }
    if (item === 'flashlight') { game.say(['You hold the flashlight. Keep it selected to see in dark places.']); return; }
    if (item === 'key') { game.say(['A brass key labelled B. Use it on the basement door in the kitchen.']); return; }
    if (game.room !== 'aviary') { if (d.food) game.say(['The birds are in the aviary. You are not.']); else if (item === 'water') game.say(['You water the nearest plant out of habit.', 'Nothing happens. Nothing has happened to that plant in a long time.']); else if (item === 'brush') game.say(['The house could use it too. Not now.']); else game.say(['Not here.']); return; }
    const F = game.flock; const t = this.findTarget(game);
    // treats & medicine go to birds directly
    const bird = t && t.type === 'bird' ? t.obj : null;
    if (item === 'treat') { if (bird) game.giveTreat(bird); else game.say(['Hold a treat near a bird and it will usually come to you.']); return; }
    if (item === 'medicine') { if (bird) game.giveMedicine(bird); else game.say(['Choose a bird to give it to.']); return; }
    if (item === 'bandage') { if (bird) game.bandageBird(bird); else game.say(['Choose a bird to tend.']); return; }
    if (d.food) {
      const bowl = t && t.type === 'bowl' && t.obj.kind === 'food' ? t.obj : F.bowls.filter((b) => b.kind === 'food' && Math.abs(b.x - this.x) < 30)[0];
      if (bowl) { if (bowl.food && bowl.food !== item && bowl.amount > 0.5) { game.say(['The bowl still has ' + PH.items.label(bowl.food).toLowerCase() + ' in it. The birds will finish it, or you can wait.']); return; } bowl.food = item; bowl.amount = Math.min(8, bowl.amount + 4); this.removeItem(item, 1); PH.audio.seeds(); game.onFeed(bowl); }
      else if (bird) game.say(['Hand-feeding works best with treats. Fill a bowl instead.']);
      else game.say(['Stand next to a food bowl.']);
      return;
    }
    if (item === 'water') { const bowl = t && t.type === 'bowl' && t.obj.kind === 'water' ? t.obj : F.bowls.filter((b) => b.kind === 'water' && Math.abs(b.x - this.x) < 30)[0]; if (bowl) { if (this.inv.water <= 0) { game.say(['The can is empty. Refill it at a sink or the fountain.']); return; } bowl.amount = 8; this.removeItem('water', 1); PH.audio.pour(); game.onWater(bowl); } else game.say(['Stand next to a water bowl.']); return; }
    if (item === 'brush') { const n = F.clean(this.x, 40); PH.audio.step('grass'); if (n > 0 || F.dirt > 5) { game.onClean(n); } else game.say(['Clean enough here.']); return; }
    if (item === 'toy') { if (F.toys.length >= 7) { game.say(['The aviary is full of toys. The birds would rather have you.']); return; } F.toys.push({ x: this.x + this.dir * 14, y: 60 + PH.rand(0, 30), type: 'bell' }); this.removeItem('toy', 1); PH.audio.click(); game.say(['You hang the bell from the frame. Saffron is already looking at it.']); for (const b of F.birds) b.needs.boredom = Math.max(0, b.needs.boredom - 8); game.sanity.ground(2, 'bird'); return; }
  };

  Player.prototype.draw = function (ctx, camx, camy, flicker) {
    const key = this.pose + (this.dir < 0 ? 'L' : ''); const fr = this.frames[key] || this.frames.idle;
    const f = fr[Math.floor(this.animT) % fr.length];
    const x = Math.round(this.x - camx - 9), y = Math.round(this.y - camy - 34);
    if (flicker) { ctx.globalAlpha = 0.5; }
    ctx.drawImage(f, x, y); ctx.globalAlpha = 1;
    if (this.breathing > 0) { ctx.fillStyle = 'rgba(200,220,255,' + this.breathing * 0.5 + ')'; const r = 2 + Math.sin(PH.time * 1.5) * 1.5; ctx.fillRect(Math.round(this.x - camx - r / 2), y - 8, Math.round(r), 1); }
  };
  PH.Player = Player;
})(window.PH);
