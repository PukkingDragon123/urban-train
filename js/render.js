// Renderer: layered scene, weather, reflections, lighting, sanity post-processing.
(function (PH) {
  'use strict';
  const G = PH.gfx, W = PH.world, Pr = PH.props;
  const R = {};
  let buf = null, bctx = null, tmp = null, tctx = null;
  R.init = function () { buf = G.canvas(PH.W, PH.H); bctx = buf.getContext('2d'); tmp = G.canvas(PH.W, PH.H); tctx = tmp.getContext('2d'); };

  function drawProp(ctx, room, p, camx, env) {
    const name = p.altActive && p.alt ? p.alt : (p.window && env.night ? 'window_night' : p.p);
    const c = Pr.get(name); const x = Math.round(W.propX(room, p) - camx), y = Math.round(p.y - c.height);
    if (x + c.width < 0 || x > PH.W) return;
    const sway = (room.outdoor || room.glass) && ['tree', 'tree_dead', 'hedge', 'flowers', 'flowers_dead', 'fern', 'plant_bloom'].includes(name);
    if (sway) { const k = Math.sin(PH.time * (1.2 + (p.x % 7) * 0.1) + p.x * 0.05) * env.wind * 0.06; ctx.save(); ctx.translate(x, y + c.height); ctx.transform(1, 0, k, 1, 0, 0); ctx.drawImage(c, 0, -c.height); ctx.restore(); }
    else ctx.drawImage(c, x, y);
    // computer/tv screen glow effects
    if (p.id === 'tv' && PH.game.flags.tv) { ctx.fillStyle = env.sanity < 60 ? (PH.hash(Math.floor(PH.time * 30), 1) < 0.5 ? '#c8c8d0' : '#606068') : '#3a6a9a'; ctx.fillRect(x + 2, y + 2, 40, 22); if (env.sanity < 60) { for (let i = 0; i < 60; i++) { ctx.fillStyle = PH.hash(i, Math.floor(PH.time * 40)) < 0.5 ? '#111' : '#ddd'; ctx.fillRect(x + 2 + (i % 10) * 4, y + 2 + Math.floor(i / 10) * 4, 4, 4); } if (env.sanity < 40 && PH.hash(Math.floor(PH.time * 2), 7) < 0.3) { ctx.fillStyle = '#000'; ctx.fillRect(x + 18, y + 6, 8, 16); ctx.fillStyle = '#ddd'; ctx.fillRect(x + 20, y + 8, 1, 1); ctx.fillRect(x + 23, y + 8, 1, 1); } } }
    if (p.id === 'fireplace' && env.night) { const f = Math.sin(PH.time * 9) * 2; ctx.fillStyle = '#e06020'; ctx.fillRect(x + 16, y + 30 + f, 20, 10 - f); ctx.fillStyle = '#f0c040'; ctx.fillRect(x + 20, y + 34 + f * 0.5, 12, 6); }
    // Mirror reflection of the player
    if ((p.p === 'mirror') && !p.altActive) {
      const pl = PH.game.player; const mx = W.propX(room, p) + 12; const dx = pl.x - mx;
      if (Math.abs(dx) < 50) {
        ctx.save(); ctx.beginPath(); ctx.rect(x + 3, y + 3, 18, 34); ctx.clip();
        const wrong = PH.game.reflectionWrong > 0; const rx = x + 12 - dx * 0.4 + (wrong ? Math.sin(PH.time * 0.7) * 6 : 0);
        const key = (wrong ? 'idle' : pl.pose) + ((wrong ? pl.dir > 0 : pl.dir < 0) ? 'L' : ''); const fr = pl.frames[key] || pl.frames.idle; const f = fr[Math.floor(pl.animT + (wrong ? 2 : 0)) % fr.length];
        ctx.globalAlpha = 0.85; ctx.drawImage(f, Math.round(rx - 9), y + 8 + (wrong ? 0 : 0), 18, 34); ctx.globalAlpha = 1;
        if (wrong && env.sanity < 30) { ctx.fillStyle = '#000'; ctx.fillRect(Math.round(rx - 4), y + 9, 8, 7); }
        ctx.restore();
      }
    }
  }
  function drawDoors(ctx, room, camx, env) {
    for (const d of W.visibleDoors(room)) {
      const x = Math.round(W.doorX(room, d) - camx); if (x < -30 || x > PH.W) continue;
      let name = 'door'; if (d.kind === 'glass') name = 'door_glass'; else if (d.kind === 'stairs') name = 'door_open'; else if (d.kind === 'locked' && !PH.game.flags['unlocked_' + d.to]) name = 'door_locked'; else if (d.kind === 'path') name = null; else if (d.kind === 'strange') name = PH.hash(Math.floor(PH.time * 4), 3) < 0.9 ? 'door' : 'door_open'; else if (d.kind === 'steel') name = 'door_locked';
      if (room.outdoor && d.kind !== 'path') { // house facade for outdoor doors
        if (d.kind === 'house') { ctx.fillStyle = '#4a4046'; ctx.fillRect(x - 60, room.floor - 120, 142, 120); ctx.fillStyle = '#3a3036'; for (let yy = room.floor - 120; yy < room.floor; yy += 6) ctx.fillRect(x - 60, yy, 142, 1); ctx.fillStyle = '#2a2430'; ctx.beginPath(); ctx.moveTo(x - 66, room.floor - 120); ctx.lineTo(x + 11, room.floor - 160); ctx.lineTo(x + 88, room.floor - 120); ctx.fill(); const lit = env.night; [[x - 44, room.floor - 100], [x + 40, room.floor - 100], [x - 44, room.floor - 60], [x + 40, room.floor - 60]].forEach((w, i) => { ctx.fillStyle = lit && i !== 2 ? '#e8c880' : '#1a2030'; ctx.fillRect(w[0], w[1], 18, 22); ctx.fillStyle = '#5a5056'; ctx.fillRect(w[0] + 8, w[1], 2, 22); }); ctx.fillStyle = '#5a5056'; ctx.fillRect(x - 6, room.floor - 54, 34, 54); }
        if (d.kind === 'glass') { /* dome entrance */ ctx.fillStyle = '#7c8590'; ctx.fillRect(x - 6, room.floor - 60, 36, 60); ctx.fillStyle = 'rgba(165,216,230,0.5)'; ctx.fillRect(x - 3, room.floor - 57, 30, 55); const eff = W.effWidth(room); const cx = x + 12; ctx.strokeStyle = '#7c8590'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(cx + 130, room.floor, 220, 150, 0, Math.PI, 0); ctx.stroke(); ctx.fillStyle = 'rgba(165,216,230,0.18)'; ctx.fill(); if (env.night) { ctx.fillStyle = 'rgba(255,230,180,0.08)'; ctx.fill(); } }
      }
      if (name) ctx.drawImage(Pr.get(name), x, room.floor - 50);
      else { ctx.fillStyle = '#5b4632'; ctx.fillRect(x - 10, room.floor + 4, 44, 14); ctx.fillStyle = '#3a4a2a'; ctx.fillRect(x + 4, room.floor - 30, 6, 34); }
      if (d.label && env.showLabels) PH.font.drawCentered(ctx, d.label, x + 11, room.floor - 58, { color: '#a89880', shadow: '#000' });
    }
  }
  function drawAviary(ctx, game, camx, env) {
    const F = game.flock; const room = W.room(game.room);
    W.drawDomeBack(ctx, room, camx, env);
    // climbs (ropes/bars)
    for (const c of F.climbs) { const x = Math.round(c.x - camx); for (let y = c.y1; y < c.y2; y++) { ctx.fillStyle = y % 3 === 0 ? '#8a7a50' : '#a09060'; ctx.fillRect(x + ((y % 4) < 2 ? 0 : 1), y, 2, 1); } }
    // perches (branch-like)
    for (const p of F.perches) { const x1 = Math.round(p.x1 - camx), x2 = Math.round(p.x2 - camx); if (x2 < 0 || x1 > PH.W) continue; ctx.fillStyle = '#6b4a2f'; ctx.fillRect(x1, p.y, x2 - x1, 3); ctx.fillStyle = '#8d6640'; ctx.fillRect(x1, p.y, x2 - x1, 1); ctx.fillStyle = '#472f1c'; ctx.fillRect(x1, p.y + 2, x2 - x1, 1); for (let x = x1 + 6; x < x2; x += 17) { ctx.fillStyle = '#472f1c'; ctx.fillRect(x, p.y + 1, 2, 1); } // support to frame
      ctx.fillStyle = 'rgba(92,92,90,0.55)'; ctx.fillRect(x1 + 2, 30, 1, p.y - 30); }
    // toys
    for (const t of F.toys) { const x = Math.round(t.x - camx), y = t.y; if (t.type === 'bell') { ctx.fillStyle = '#8a8a70'; ctx.fillRect(x, 30, 1, y - 30); const sw = t.ring > 0 ? Math.sin(PH.time * 30) * 2 : 0; ctx.fillStyle = '#e0b040'; ctx.fillRect(x - 3 + sw, y, 7, 6); ctx.fillRect(x - 4 + sw, y + 6, 9, 1); ctx.fillStyle = '#404040'; ctx.fillRect(x + sw, y + 7, 1, 1); } else if (t.type === 'swing') { const s = Math.sin((t.swing || 0) * 2.5) * 6; ctx.fillStyle = '#8a8a70'; ctx.fillRect(x - 6 + s * 0.5, 30, 1, 30); ctx.fillRect(x + 6 + s * 0.5, 30, 1, 30); ctx.fillStyle = '#6b4a2f'; ctx.fillRect(x - 8 + s, y, 17, 3); } else { ctx.fillStyle = '#a09060'; for (let yy = 30; yy < y + 60; yy++) ctx.fillRect(x + ((yy % 4) < 2 ? 0 : 1), yy, 2, 1); } }
    // bowls
    for (const b of F.bowls) { const x = Math.round(b.x - camx), y = b.y - 6; ctx.drawImage(Pr.get('bowl'), x, y); if (b.amount > 0) { ctx.fillStyle = b.kind === 'water' ? '#5a9ad0' : b.food === 'fruit' ? '#e0702a' : b.food === 'nuts' ? '#a07a45' : b.food === 'pellets' ? '#8b5a2b' : '#c9a66b'; const h = Math.max(1, Math.round(b.amount / 8 * 3)); ctx.fillRect(x + 2, y + 4 - h, 10, h); } }
    // droppings & dropped items
    for (const p of F.poops) { ctx.fillStyle = PH.hash(p.x, 1) < 0.5 ? '#d8d8c8' : '#7a8a60'; ctx.fillRect(Math.round(p.x - camx), Math.round(p.y), 2, 1); }
    for (const it of F.droppedItems) ctx.drawImage(PH.items.icon(it.item), Math.round(it.x - camx - 6), it.y - 12);
    // planting on floor
    // birds (sorted by y for depth)
    const birds = F.birds.slice().sort((a, b) => a.y - b.y);
    for (const b of birds) { b.draw(ctx, camx, 0, b.dead && env.sanity < 30 ? 0.3 : 0); }
  }
  function drawBubbles(ctx, game, camx, env) {
    if (game.room !== 'aviary') return;
    for (const b of game.flock.birds) if (b.bubble) { const x = Math.round(b.x - camx), y = Math.round(b.y - 20 - b.sp.s * 8); const w = b.bubble.length * 6 + 6; ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.fillRect(x - w / 2, y - 10, w, 10); ctx.fillRect(x - 1, y, 2, 2); PH.font.draw(ctx, b.bubble, x - w / 2 + 3, y - 8, { color: '#1a1a1e', glitch: env.sanity < 40 && b.bubble.length > 4 ? 0.06 : 0 }); }
  }
  function drawDecals(ctx, game, camx) {
    for (const d of game.decals) { if (d.room !== game.room) continue; const x = Math.round(d.x - camx), y = Math.round(d.y); if (d.kind === 'blood') { ctx.fillStyle = '#7a0b12'; ctx.fillRect(x - 8, y, 16, 2); ctx.fillRect(x - 4, y - 1, 8, 1); ctx.fillRect(x + 6, y + 2, 5, 1); ctx.fillRect(x - 12, y + 1, 3, 1); ctx.fillStyle = '#b3141c'; ctx.fillRect(x - 2, y, 4, 1); } else { ctx.fillStyle = 'rgba(122,11,18,0.8)'; ctx.fillRect(x, y, 5, 6); ctx.fillRect(x - 1, y - 3, 1, 4); ctx.fillRect(x + 1, y - 4, 1, 5); ctx.fillRect(x + 3, y - 4, 1, 5); ctx.fillRect(x + 5, y - 2, 1, 3); } }
  }
  function drawFigure(ctx, game, camx) {
    const f = game.sanity.figure; if (!f || f.room !== game.room) return;
    const x = Math.round(f.x - camx); if (x < -20 || x > PH.W + 20) return;
    const pl = game.player; const facing = Math.sign(f.x - pl.x) === pl.dir;
    // the figure is only fully there when you are not looking directly at it
    ctx.globalAlpha = facing ? 0.35 + Math.sin(PH.time * 12) * 0.15 : 0.9;
    ctx.drawImage(Pr.get('figure'), x - 8, f.y - 40); ctx.globalAlpha = 1;
    if (facing && !f.seen) { f.seen = true; game.sanity.change(-4, 'figure'); PH.audio.sting(0.5); }
  }
  function drawWeather(ctx, game, camx, env) {
    const room = W.room(game.room);
    if (room.outdoor || room.glass) {
      // fog at dawn/night near ground
      const dl = W.daylight(env.hour); const fog = (1 - dl) * 0.25 + (env.rain * 0.1);
      if (fog > 0.02 && !room.glass) { for (let i = 0; i < 6; i++) { const y = room.floor - 6 - i * 4; ctx.fillStyle = 'rgba(180,190,210,' + fog * (1 - i / 6) * 0.5 + ')'; const off = PH.mod(PH.time * (3 + i) - camx * 0.5, PH.W); ctx.fillRect(0, y, PH.W, 3); ctx.fillStyle = 'rgba(180,190,210,' + fog * 0.3 + ')'; ctx.fillRect(off - 60, y - 2, 120, 2); } }
    }
    game.particles.draw(ctx, camx, 0);
  }
  function drawLights(ctx, game, camx, env) {
    const room = W.room(game.room); const dl = W.daylight(env.hour);
    let amb;
    if (room.dark) amb = '#141218'; else if (room.outdoor || room.glass) amb = PH.mix('#202438', '#ffffff', dl * 0.95); else amb = PH.mix('#2a2634', '#f8f4ec', dl * 0.88);
    if (game.lightsOut > 0) amb = '#08070c';
    const c = G.beginLights(amb);
    // windows during day
    if (!room.outdoor && !room.dark && dl > 0.05 && !(game.lightsOut > 0)) for (const p of room.props) if (p.window) { const x = W.propX(room, p) - camx + 20; G.light(c, x, room.floor - 30, 110, '#fff4dc', dl * 0.5); G.lightRect(c, x - 20, 165, 40, 44, '#fff8e8', dl * 0.4); }
    // lamps at night (interior)
    if (!room.outdoor && !(game.lightsOut > 0)) for (const p of room.props) { if (p.p === 'lamp' && dl < 0.7) G.light(c, W.propX(room, p) - camx + 7, p.y - 40, 90, '#ffd9a0', (0.7 - dl) * 0.9 * (game.sanity.flicker ? 0.4 : 1)); if (p.p === 'chandelier' && dl < 0.7) G.light(c, W.propX(room, p) - camx + 15, p.y, 120, '#ffe0b0', (0.7 - dl) * 0.8); if (p.id === 'fireplace' && dl < 0.8) G.light(c, W.propX(room, p) - camx + 26, p.y - 10, 90, '#ff9040', 0.5 + Math.sin(PH.time * 9) * 0.1); if (p.id === 'tv' && game.flags.tv) G.light(c, W.propX(room, p) - camx + 22, p.y - 12, 60, '#8ab0ff', 0.6 + PH.hash(Math.floor(PH.time * 20), 2) * 0.2); if ((p.id === 'computer' || p.id === 'monitors' || p.id === 'archmonitors' || p.id === 'servers') && (room.dark || dl < 0.5)) G.light(c, W.propX(room, p) - camx + 14, p.y - 10, 50, '#5ab0d0', 0.5); if (p.p === 'boiler') G.light(c, W.propX(room, p) - camx + 15, p.y - 40, 40, '#ff6020', 0.5 + Math.sin(PH.time * 3) * 0.1); }
    // outdoor lamps/pool lights at night
    if (room.outdoor && dl < 0.6) { for (const p of room.props) if (p.p === 'lamp') G.light(c, W.propX(room, p) - camx + 7, p.y - 40, 80, '#ffd9a0', (0.6 - dl)); if (room.id === 'poolside') { for (let i = 0; i < 4; i++) G.light(c, 220 + i * 35 - camx, 245, 40, p => 0 ? 0 : (game.sanity.value < 40 ? '#c03030' : '#40a0d0'), 0.6 * (0.6 - dl)); } if (room.id === 'garden') { G.light(c, 300 - camx, room.floor - 60, 70, '#ffe0b0', 0.5 * (0.6 - dl)); G.light(c, 1050 - camx, room.floor - 80, 240, '#c0f0ff', 0.35 * (0.6 - dl)); } }
    if (room.glass && dl < 0.7) { const eff = W.effWidth(room); for (let i = 1; i < 4; i++) G.light(c, eff * i / 4 - camx, 70, 190, '#ffe8c0', Math.min(0.9, 1.3 * (0.7 - dl)) * (game.sanity.flicker ? 0.5 : 1)); }
    if (room.id === 'longhall') { for (let i = 0; i < 30; i++) { const dx = 120 + i * 130 - camx + 11; if (dx > -60 && dx < PH.W + 60) G.light(c, dx, room.floor - 70, 70, '#ffd9a0', 0.35 + PH.hash(i, Math.floor(PH.time * 6)) * 0.2); } }
    if (room.id === 'aviary2') { G.light(c, game.player.x - camx, room.floor - 40, 120, '#a5d8e6', 0.35); }
    // flashlight
    const pl = game.player; if (pl.currentItem() === 'flashlight' && !game.ui.blocking()) { G.lightCone(c, pl.x - camx + pl.dir * 6, pl.y - 20, pl.dir, 150, '#fff6d8', 0.95); G.light(c, pl.x - camx, pl.y - 18, 30, '#fff6d8', 0.4); }
    // phone glow
    if (game.ui.phoneOpen) G.light(c, pl.x - camx, pl.y - 20, 40, '#8fd0ff', 0.6);
    // player faint presence so they are never fully invisible
    G.light(c, pl.x - camx, pl.y - 18, 26, '#ffffff', 0.12);
    // sanity: colour cast
    if (env.sanity < 50) G.lightRect(c, 0, 0, PH.W, PH.H, '#ff4040', (50 - env.sanity) / 50 * 0.12 * (game.sanity.pressure > 1 ? 2 : 1));
    G.endLights(ctx);
  }
  function postFx(ctx, game, env) {
    const san = game.sanity; const d = san.distortion; const tier = san.tier();
    // desaturate
    if (d > 0.05) { ctx.globalCompositeOperation = 'saturation'; ctx.fillStyle = 'rgba(128,128,128,' + Math.min(0.85, d * 0.9) + ')'; ctx.fillRect(0, 0, PH.W, PH.H); ctx.globalCompositeOperation = 'source-over'; }
    // slice displacement
    if (d > 0.25 || san.pressure > 1) {
      tctx.clearRect(0, 0, PH.W, PH.H); tctx.drawImage(buf, 0, 0);
      const n = Math.floor(3 + d * 12 + san.pressure * 3); const t = Math.floor(PH.time * 10);
      for (let i = 0; i < n; i++) { if (PH.hash(i, t) > 0.4 + d * 0.3) continue; const y = Math.floor(PH.hash(i + 50, t) * PH.H), h = 2 + Math.floor(PH.hash(i + 90, t) * 12); const off = Math.round((PH.hash(i + 130, t) - 0.5) * (6 + d * 30 + san.pressure * 8)); ctx.drawImage(tmp, 0, y, PH.W, h, off, y, PH.W, h); }
      // ghosting
      if (tier >= 3) { ctx.globalAlpha = 0.25 * d; ctx.drawImage(tmp, Math.round(Math.sin(PH.time * 2) * 3 * d), 0); ctx.globalAlpha = 1; }
    }
    // breathing wobble at pressure: scale slightly
    if (san.pressure > 1.5) { tctx.clearRect(0, 0, PH.W, PH.H); tctx.drawImage(buf, 0, 0); const s = 1 + Math.sin(PH.time * 3) * 0.01 * san.pressure; ctx.save(); ctx.translate(PH.W / 2, PH.H / 2); ctx.scale(s, s); ctx.drawImage(tmp, -PH.W / 2, -PH.H / 2); ctx.restore(); }
    // vignette
    const vig = 0.25 + san.dread * 0.6 + san.pressure * 0.15; const grd = ctx.createRadialGradient(PH.W / 2, PH.H / 2, PH.H * 0.35, PH.W / 2, PH.H / 2, PH.W * 0.7); grd.addColorStop(0, 'rgba(0,0,0,0)'); grd.addColorStop(1, 'rgba(0,0,0,' + Math.min(0.95, vig) + ')'); ctx.fillStyle = grd; ctx.fillRect(0, 0, PH.W, PH.H);
    // grain
    if (d > 0.1) { const n = Math.floor(d * 300); const t = Math.floor(PH.time * 30); for (let i = 0; i < n; i++) { ctx.fillStyle = PH.hash(i, t) < 0.5 ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.25)'; ctx.fillRect(Math.floor(PH.hash(i + 7, t) * PH.W), Math.floor(PH.hash(i + 13, t) * PH.H), 1, 1); } }
    // flicker
    if (san.flicker) { ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0, 0, PH.W, PH.H); }
    // fade
    if (game.fade > 0) { ctx.fillStyle = 'rgba(0,0,0,' + Math.min(1, game.fade) + ')'; ctx.fillRect(0, 0, PH.W, PH.H); }
  }

  R.frame = function (screen, game) {
    const ctx = bctx; const room = W.room(game.room); const camx = Math.round(game.camx);
    const env = game.env();
    ctx.clearRect(0, 0, PH.W, PH.H);
    if (game.ending) { PH.endings.draw(ctx, game); screen.drawImage(buf, 0, 0); return; }
    if (game.title) { PH.endings.drawTitle(ctx, game); screen.drawImage(buf, 0, 0); return; }
    W.drawBackground(ctx, room, camx, env);
    // back props
    for (const p of room.props) if (p.layer === 'back') drawProp(ctx, room, p, camx, env);
    drawDoors(ctx, room, camx, env);
    drawDecals(ctx, game, camx);
    if (room.id === 'aviary') drawAviary(ctx, game, camx, env);
    if (room.id === 'aviary2') { W.drawDomeBack(ctx, room, camx, env); PH.endings.drawDeadAviary(ctx, game, camx, env); }
    for (const p of room.props) if (!p.layer) drawProp(ctx, room, p, camx, env);
    drawFigure(ctx, game, camx);
    game.player.draw(ctx, camx, 0, game.sanity.tier() >= 4 && PH.hash(Math.floor(PH.time * 6), 9) < 0.15);
    // birds on player drawn after player
    if (room.id === 'aviary') for (const b of game.flock.birds) if (b.state === 'onPlayer') b.draw(ctx, camx, 0);
    for (const p of room.props) if (p.layer === 'front') drawProp(ctx, room, p, camx, env);
    drawBubbles(ctx, game, camx, env);
    if (room.glass || room.id === 'aviary2') W.drawDomeFront(ctx, room, camx, env);
    drawWeather(ctx, game, camx, env);
    drawLights(ctx, game, camx, env);
    postFx(ctx, game, env);
    game.ui.draw(ctx, game);
    screen.drawImage(buf, 0, 0);
  };
  PH.render = R;
})(window.PH);
